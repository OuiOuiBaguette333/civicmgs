export const DEMOGRAPHICS = ["population"] as const

export type Demographic = typeof DEMOGRAPHICS[number]

export type Demographics = {
  [Metric in Demographic]: number
}

export const DEMOGRAPHICS_FORMATS: Record<Demographic, string> = {
  population: 'people'
}

export const DEMOGRAPHICS_LABELS: Record<Demographic, string> = {
  population: 'Population'
}

export const ZEROED_DEMOGRAPHICS = Object.fromEntries(DEMOGRAPHICS.map(metric => [metric, 0])) as Demographics
