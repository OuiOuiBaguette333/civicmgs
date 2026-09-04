# CivicLens

An interactive lens on Australian Bureau of Statistics data: pick a Victorian
suburb, see how it compares with the state, and move sliders to explore what a
proposed change would mean for it.

## What it does today

- Search any **Statistical Area Level 2** (SA2) in Victoria — roughly a suburb.
- Pull that area's 2021 figures live from the [ABS Data API](https://www.abs.gov.au/statistics/application-programming-interfaces-apis/data-api-user-guide)
  (`ABS_REGIONAL_ASGS2021`) and compare them against Victoria as a whole.
- Move a **policy lever** — school funding, employment services, housing supply,
  health funding — and see it projected onto those figures as a range, with the
  research behind every number one click away.
- Enter the promise the way it was announced — "$2.4 billion over four years" —
  and see the sustained percentage change it actually amounts to.
- Share any scenario as a link: the suburb, the levers and the horizon live in
  the URL.
- Or adjust a metric directly, which scales it by itself and claims nothing.

## The projection model

Moving a policy lever projects a change onto the census figures using published
research. The model lives in `src/model` and is deliberately data, not code:
`effects.ts` is a table anyone can audit without reading React.

Three rules keep it honest.

**Everything is a range.** No projected figure is a point estimate. The central
value is the study's own; where a bound is CivicLens's conservative floor for
carrying an overseas estimate to Victoria, the derivation says so.

**Nothing moves overnight.** A census metric counts the whole adult population,
but a school funding change reaches one school cohort at a time. Every effect
declares a lag and a phase-in, and a projection only moves by the share of the
population that has actually lived through the change. So +20% school funding
shifts Year 12 completion by about 2 points over 20 years, not 19 — and by
nothing at all for the first 13. Those timings are structural assumptions of this
project, not findings of the studies, and the interface says which is which.

**Links without a usable size project no number.** Employment services and
housing supply have research agreeing on the direction and nothing that converts
into a Victorian suburb, so they are typed as direction-only and cannot move a
figure. Health funding has no entry at all. That asymmetry is the finding, not an
omission: of four things routinely promised, one has a transferable causal
estimate for these outcomes.

Effects are summed, never chained. Compounding first-order estimates through
education to income to employment turns small numbers into confident nonsense.

**Dollars into percentages.** Spending is announced as a total over a
forward-estimates period; the model takes a sustained annual percentage. The
conversion spreads the commitment evenly and divides by the annual spend it
scales — for schools, 661,326.7 full-time equivalent Victorian government-school
students at $21,550 each, about $14.25bn a year. So $2.4bn over four years is
4.2%, not a transformation. The per-student figure is the national average,
because the state breakdown is published only in the report's data tables.

### What the model is built on

- Jackson, Johnson & Persico (2016), _The Quarterly Journal of Economics_ — a 10%
  rise in per-pupil spending across all 12 school years raises high-school
  graduation by 9.5 percentage points, adult wages by 7.25%, and cuts adult
  poverty by 3.67 points. US school finance reforms, cohorts born 1955–1985.
- Jackson & Mackevicius (2024), _AEJ: Applied Economics_ — $1,000 more per pupil
  for four years raises college-going by 2.8 points, across US evaluations.
- Leigh (2025), _Economic Papers_ — an extra year of schooling raises Australian
  hourly wages by about 7%. HILDA, 2001–2022.
- Card, Kluve & Weber (2018), _JEEA_ — across 200+ evaluations, employment
  programmes average near zero in the short run and turn positive after two to
  three years. No transferable effect size.
- Mense (2025), _JPE Macroeconomics_ — new housing supply lowers rents on impact
  and the effect fades within about a year. Munich rental listings.
- Productivity Commission, _Report on Government Services 2026_ — $21,550 per
  full-time student in government schools, 2023–24, used to price the funding
  lever.

## What it still does not do

Levers cannot be expressed as dollars over a forward-estimates period yet, only as
a sustained percentage change. Nothing accounts for people moving into or out of a
suburb in response to a policy. And the strongest evidence in the table is American:
carrying it to Victoria is an assumption the low bounds try to respect but cannot
remove.

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

## Building the map data

The map ships pre-projected SVG paths rather than boundary geometry, so the app
needs no mapping library at runtime. Both data files are generated once and
committed.

```bash
# 1. Boundaries. Download the SA2 2021 layer as GeoJSON from the ABS or the
#    Digital Atlas of Australia, then:
npm run data:shapes -- SA2.geojson

# 2. Figures for every Victorian SA2, fetched from the ABS API in batches.
npm run data:metrics
```

`data:shapes` streams the input rather than parsing it whole — the national file
is larger than most machines want to hold in memory — filters to Victoria,
projects with a Mercator fitted to the state's extent, and simplifies in pixel
space to about a third of a pixel. 522 areas come out at roughly 230 kB, loaded
as its own lazy chunk.

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
