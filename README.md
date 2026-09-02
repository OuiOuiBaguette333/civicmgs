# CivicLens

An interactive lens on Australian Bureau of Statistics data: pick a Victorian
suburb, see how it compares with the state, and move sliders to explore what a
proposed change would mean for it.

## What it does today

- Search any **Statistical Area Level 2** (SA2) in Victoria — roughly a suburb.
- Pull that area's 2021 figures live from the [ABS Data API](https://www.abs.gov.au/statistics/application-programming-interfaces-apis/data-api-user-guide)
  (`ABS_REGIONAL_ASGS2021`) and compare them against Victoria as a whole.
- Adjust a metric with a slider and see the simulated figure beside its baseline.

## What it does *not* do yet

The sliders currently scale a metric by itself. **There is no causal model**: moving
the income slider does not move employment or Year 12 completion, and nothing here
should be read as a prediction.

That is deliberate, because it is the hard part:

1. **The census contains no policy levers.** There is no "education funding" column
   at SA2. The census records *outcomes* — attainment, income, unemployment — as a
   stock at one moment. Funding lives in the Victorian budget papers, the
   Productivity Commission's [Report on Government Services](https://www.pc.gov.au/ongoing/report-on-government-services),
   and ABS Government Finance Statistics.
2. **Correlation across suburbs is not a causal effect.** Areas with more educated
   adults also have higher incomes and lower unemployment. Fitting a regression
   across SA2s and calling the coefficient "the effect of funding" is the ecological
   fallacy plus omitted-variable bias.

The intended design is a small, auditable table of **published elasticities** — each
with a source, an effect-size range and a time lag — rendering results as ranges
rather than point estimates, with "no reliable evidence" shown wherever no such
research exists.

## Data notes

- Figures are for **2021** and come from `ABS_REGIONAL_ASGS2021`.
- Income is **equivalised** median weekly household income (adjusted for household
  size), not raw household income.
- "Born overseas" is shown as a share of the estimated resident population, so that
  suburbs of different sizes are comparable.
- Population is deliberately **not** compared against Victoria — a suburb count
  against a state total is not a meaningful comparison.
- Some measures are suppressed by the ABS for small or unusual areas. Those render
  as "Not available" rather than zero.

## Setup

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run dev    # Vite dev server
npm run build  # Typecheck and build
npm run test   # Vitest
npm run fmt    # Oxfmt
npm run lint   # Oxlint
```
