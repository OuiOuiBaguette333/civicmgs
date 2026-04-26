export interface DemographicMetrics {
  populationTotal: number
  medianAge: number
  householdMedianIncome: number
  unemploymentRatePct: number
}

export interface FundingMetrics {
  perCapitaFundingAud: number
  communityProgramsFundingAud: number
  infrastructureFundingAud: number
}

export interface MetricSnapshot {
  locationId: string
  year: number
  demographics: DemographicMetrics
  funding: FundingMetrics
}

export interface VictorianAverageSnapshot {
  year: number
  demographics: DemographicMetrics
  funding: FundingMetrics
}
