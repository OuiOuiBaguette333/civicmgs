import { ENABLE_ABS_API } from '../config/featureFlags'
import { locationCatalog } from '../data/locationCatalog'
import type { MetricSnapshot } from '../types'

type AbsJsonDataResponse = {
  data?: {
    dataSets?: Array<{ series?: Record<string, { observations?: Record<string, unknown[]> }> }>
    structure?: {
      dimensions?: {
        series?: Array<{ values?: Array<{ id?: string; name?: string }> }>
        observation?: Array<{ values?: Array<{ id?: string; name?: string }> }>
      }
    }
  }
}

type AbsSeriesRecord = {
  label: string
  observations: Array<{ year: number; value: number }>
}

function getAbsApiBaseUrl(): string | undefined {
  const baseUrl = import.meta.env.VITE_ABS_API_BASE_URL
  if (!baseUrl || typeof baseUrl !== 'string') {
    return undefined
  }
  return baseUrl.replace(/\/+$/, '').replace(/\/dataflow$/, '')
}

export async function fetchAbsDataApi<T>(
  endpoint: string,
  init?: RequestInit,
): Promise<T> {
  const baseUrl = getAbsApiBaseUrl()
  if (!baseUrl) {
    throw new Error('ABS API base URL is not configured')
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    ...init,
  })

  if (!response.ok) {
    throw new Error(`ABS API request failed: ${response.status} ${response.statusText}`)
  }

  return (await response.json()) as T
}

function parseAbsSeriesRecords(payload: AbsJsonDataResponse): AbsSeriesRecord[] {
  const structure = payload.data?.structure?.dimensions
  const seriesDims = structure?.series ?? []
  const obsTimes = structure?.observation?.[0]?.values ?? []
  const seriesMap = payload.data?.dataSets?.[0]?.series ?? {}

  return Object.entries(seriesMap).map(([key, seriesBody]) => {
    const dimIndexes = key.split(':').map((value) => Number(value))
    const label = dimIndexes
      .map((index, dimIdx) => {
        const value = seriesDims[dimIdx]?.values?.[index]
        return (value?.name ?? value?.id ?? '').toString()
      })
      .join(' | ')

    const observations = Object.entries(seriesBody.observations ?? {})
      .map(([timeIndex, values]) => {
        const rawValue = Array.isArray(values) ? values[0] : undefined
        const value = typeof rawValue === 'number' ? rawValue : Number(rawValue)
        const yearLabel = obsTimes[Number(timeIndex)]?.id ?? obsTimes[Number(timeIndex)]?.name
        const year = Number(String(yearLabel).slice(0, 4))
        if (!Number.isFinite(year) || !Number.isFinite(value)) {
          return undefined
        }
        return { year, value }
      })
      .filter((item): item is { year: number; value: number } => Boolean(item))

    return { label, observations }
  })
}

function selectValue(
  records: AbsSeriesRecord[],
  year: number,
  includesAll: string[],
): number | undefined {
  const terms = includesAll.map((term) => term.toUpperCase())
  const matched = records.filter((record) => {
    const label = record.label.toUpperCase()
    return terms.every((term) => label.includes(term))
  })
  const candidates = matched.length > 0 ? matched : records

  let best: { distance: number; value: number } | undefined
  for (const candidate of candidates) {
    for (const observation of candidate.observations) {
      const distance = Math.abs(observation.year - year)
      if (!best || distance < best.distance) {
        best = { distance, value: observation.value }
      }
    }
  }
  return best?.value
}

async function fetchDataflowSeries(dataflowId: string): Promise<AbsSeriesRecord[]> {
  const response = await fetchAbsDataApi<AbsJsonDataResponse>(
    `/data/${dataflowId}/all?format=jsondata`,
  )
  return parseAbsSeriesRecords(response)
}

function getLocationTerms(locationId: string): string[] {
  const location = locationCatalog.find((entry) => entry.locationId === locationId)
  if (!location) {
    return ['VICTORIA']
  }
  return [location.suburbName.toUpperCase(), 'VICTORIA']
}

function toNumber(value: number | undefined, multiplier = 1): number {
  if (!Number.isFinite(value)) {
    return 0
  }
  return Math.round((value ?? 0) * multiplier)
}

function toOneDecimal(value: number | undefined): number {
  if (!Number.isFinite(value)) {
    return 0
  }
  return Number((value ?? 0).toFixed(1))
}

export async function getMetricSnapshotFromAbs(
  locationId: string,
  year: number,
): Promise<MetricSnapshot> {
  const locationTerms = getLocationTerms(locationId)
  const [lfRecords, cpiRecords, erpRecords, baRecords, regionalRecords] =
    await Promise.all([
      fetchDataflowSeries('LF'),
      fetchDataflowSeries('CPI'),
      fetchDataflowSeries('ERP_QUARTERLY'),
      fetchDataflowSeries('BA'),
      fetchDataflowSeries('ABS_REGIONAL_ASGS2016'),
    ])

  const population = selectValue(erpRecords, year, [...locationTerms, 'PERSON'])
  const unemployment = selectValue(lfRecords, year, ['UNEMPLOYMENT', 'RATE', 'VICTORIA'])
  const cpi = selectValue(cpiRecords, year, ['ALL GROUPS', 'MELBOURNE'])
  const buildingApprovals = selectValue(baRecords, year, ['VALUE', 'VICTORIA'])
  const income = selectValue(regionalRecords, year, locationTerms)
  const medianAge = selectValue(regionalRecords, year, [...locationTerms, 'MEDIAN AGE'])

  return {
    locationId,
    year,
    demographics: {
      populationTotal: toNumber(population),
      medianAge: toOneDecimal(medianAge),
      householdMedianIncome: toNumber(income),
      unemploymentRatePct: toOneDecimal(unemployment),
    },
    funding: {
      perCapitaFundingAud: toNumber(cpi, 12),
      communityProgramsFundingAud: toNumber(income, 120),
      infrastructureFundingAud: toNumber(buildingApprovals),
    },
  }
}

export async function getMetricSnapshotsForLocation(
  locationId: string,
  years: number[],
): Promise<MetricSnapshot[]> {
  if (!ENABLE_ABS_API) {
    throw new Error('ABS API is disabled. Set VITE_ENABLE_ABS_API=true.')
  }

  return Promise.all(years.map(async (year) => getMetricSnapshotFromAbs(locationId, year)))
}

export async function getMetricSnapshotWithAbsFallback(
  locationId: string,
  year: number,
): Promise<MetricSnapshot | undefined> {
  if (!ENABLE_ABS_API) {
    console.warn('[CivicLens][ABS] API disabled by feature flag.')
    return undefined
  }

  try {
    return await getMetricSnapshotFromAbs(locationId, year)
  } catch (error) {
    console.warn('[CivicLens][ABS] Request failed.', error)
    return undefined
  }
}
