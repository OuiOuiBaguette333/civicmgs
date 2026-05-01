export type ABSData = {
  population: number
}

type APIResponse = {
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

const DATASETS = {
  population: 'ABS,ABS_ANNUAL_ERP_ASGS2021,'
}

const DEFAULT_QUERY = 'dimensionAtObservation=AllDimensions&format=jsondata'

const buildUrl = (SA2Code: string, dataset: keyof typeof DATASETS, year: number) => {
  const searchParams = new URLSearchParams(DEFAULT_QUERY)
  searchParams.append("startPeriod", year.toString())
  searchParams.append("endPeriod", year.toString())

  return `${API_BASE_URL}/${DATASETS[dataset]}/.SA2.${SA2Code}.A?${searchParams.toString()}`
}

export default async (SA2Code: string, year: number): Promise<ABSData> => {
  const populationUrl = buildUrl(SA2Code, 'population', year)

  const populationResponse = await fetch(populationUrl)
  const populationData: APIResponse = await populationResponse.json()

  const population = populationData.data.dataSets[0].observations['0:0:0:0:0'][0]

  return {
    population
  }
}
