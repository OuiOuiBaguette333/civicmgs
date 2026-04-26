export interface ScenarioAdjustments {
  populationTotalPct?: number
  medianAgePct?: number
  householdMedianIncomePct?: number
  unemploymentRatePctChange?: number
  perCapitaFundingAudPct?: number
  communityProgramsFundingAudPct?: number
  infrastructureFundingAudPct?: number
}

export interface SimulationInput {
  locationId: string
  year: number
  adjustments: ScenarioAdjustments
}

export interface SimulationMetricDelta {
  absolute: number
  relativePct: number
}
