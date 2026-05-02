import { type Demographic, type Demographics, DEMOGRAPHICS } from '@utils/metrics'

type ApiResponse = {
  meta: object
  data: {
    dataSets: {
      structure: number
      action: string
      links: object[]
      annotations: number[]
      attributes: number[],
      observations: Record<string, [number, null, null]>
    }[],
    structures: [
      {
        name: string
        names: Record<string, string>
        description: string
        descriptions: Record<string, string>
        dimensions: object
        attributes: string
        annotations: object[]
        dataSets: number[]
      }
    ]
  }
  errors: []
}

const API_BASE_URL = 'https://data.api.abs.gov.au/rest/data'

const DATASETS: Record<Demographic, string> = {
  population: 'ABS,ABS_ANNUAL_ERP_ASGS2021,'
}

const DEFAULT_QUERY = 'dimensionAtObservation=AllDimensions&format=jsondata'

const buildUrl = (locationCode: string, metric: Demographic, year: number) => {
  const searchParams = new URLSearchParams(DEFAULT_QUERY)
  searchParams.append("startPeriod", year.toString())
  searchParams.append("endPeriod", year.toString())

  return `${API_BASE_URL}/${DATASETS[metric]}/.SA2.${locationCode}.A?${searchParams.toString()}`
}

const fetchMetric = async (locationCode: string, metric: Demographic, year: number) => {
  const url = buildUrl(locationCode, metric, year)
  const response = await fetch(url)
  const data: ApiResponse = await response.json()
  
  return data.data.dataSets[0].observations['0:0:0:0:0'][0]
}

export default async (locationCode: string, year: number): Promise<Demographics> => {
  const metricsPromises = DEMOGRAPHICS.map(metric => fetchMetric(locationCode, metric, year))
  const resolvedMetricsPromises = await Promise.all(metricsPromises)

  return resolvedMetricsPromises.reduce<Demographics>((accumulator, metric, index) => {
    return {
      ...accumulator,
      [DEMOGRAPHICS[index]]: metric
    }
  }, {} as Demographics)
}
