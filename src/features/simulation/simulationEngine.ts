import type { MetricSnapshot, ScenarioAdjustments } from '../../types'

function applyPercentChange(value: number, percent: number): number {
  return value * (1 + percent / 100)
}

export function applyScenarioAdjustments(
  snapshot: MetricSnapshot,
  adjustments: ScenarioAdjustments,
): MetricSnapshot {
  return {
    ...snapshot,
    demographics: {
      ...snapshot.demographics,
      populationTotal: Math.round(
        applyPercentChange(
          snapshot.demographics.populationTotal,
          adjustments.populationTotalPct ?? 0,
        ),
      ),
    },
    funding: {
      ...snapshot.funding,
      communityProgramsFundingAud: Math.round(
        applyPercentChange(
          snapshot.funding.communityProgramsFundingAud,
          adjustments.communityProgramsFundingAudPct ?? 0,
        ),
      ),
      infrastructureFundingAud: Math.round(
        applyPercentChange(
          snapshot.funding.infrastructureFundingAud,
          adjustments.infrastructureFundingAudPct ?? 0,
        ),
      ),
    },
  }
}
