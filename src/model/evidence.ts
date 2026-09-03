export interface Citation {
  authors: string;
  year: number;
  title: string;
  publication: string;
  url: string;
  /** The population, place and period the estimate was produced from. */
  setting: string;
}

/**
 * How much weight a projected number deserves. Nothing here is a prediction;
 * this says how far the research behind a link actually reaches.
 */
export type EvidenceStrength = "strong" | "moderate" | "direction-only" | "none";

export const EVIDENCE_LABELS: Record<EvidenceStrength, string> = {
  strong: "Strong evidence",
  moderate: "Moderate evidence",
  "direction-only": "Direction only",
  none: "No reliable evidence",
};

export const EVIDENCE_NOTES: Record<EvidenceStrength, string> = {
  strong: "A credible causal study measured this outcome directly.",
  moderate:
    "A credible causal study measured something close to this outcome, and reaching this metric took a conversion the study itself does not test.",
  "direction-only":
    "Research agrees on which way this moves but gives no size that transfers to Victorian suburbs, so no number is projected.",
  none: "No study links this policy to this metric closely enough to put a number on it.",
};

/** A low–central–high range. Every projected figure is one of these, never a point. */
export interface Band {
  low: number;
  central: number;
  high: number;
}

export const CITATIONS = {
  jacksonJohnsonPersico2016: {
    authors: "Jackson, C. K., Johnson, R. C., & Persico, C.",
    year: 2016,
    title: "The Effects of School Spending on Educational and Economic Outcomes",
    publication: "The Quarterly Journal of Economics 131(1), 157–218",
    url: "https://academic.oup.com/qje/article-abstract/131/1/157/2461148",
    setting: "United States, court-ordered school finance reforms, children born 1955–1985",
  },
  jacksonMackevicius2024: {
    authors: "Jackson, C. K., & Mackevicius, C. L.",
    year: 2024,
    title: "What Impacts Can We Expect from School Spending Policy?",
    publication: "American Economic Journal: Applied Economics 16(1), 412–446",
    url: "https://www.aeaweb.org/articles?id=10.1257/app.20220279",
    setting: "Meta-analysis of United States school spending evaluations",
  },
  leigh2025: {
    authors: "Leigh, A.",
    year: 2025,
    title: "Returns to Education in Australia 2001–2022",
    publication: "Economic Papers (IZA Discussion Paper 17025)",
    url: "https://docs.iza.org/dp17025.pdf",
    setting: "Australia, HILDA survey, 2001–2022",
  },
  cardKluveWeber2018: {
    authors: "Card, D., Kluve, J., & Weber, A.",
    year: 2018,
    title: "What Works? A Meta Analysis of Recent Active Labor Market Program Evaluations",
    publication: "Journal of the European Economic Association 16(3), 894–931",
    url: "https://academic.oup.com/jeea/article-abstract/16/3/894/4430618",
    setting: "Over 200 evaluations, mostly Europe and North America",
  },
  mense2025: {
    authors: "Mense, A.",
    year: 2025,
    title: "The Impact of New Housing Supply on the Distribution of Rents",
    publication: "Journal of Political Economy Macroeconomics 3(1)",
    url: "https://www.journals.uchicago.edu/doi/full/10.1086/733977",
    setting: "Munich, monthly rental listings",
  },
  rogs2026: {
    authors: "Productivity Commission",
    year: 2026,
    title: "Report on Government Services 2026, school education (table 4A.33)",
    publication: "Productivity Commission",
    url: "https://www.pc.gov.au/ongoing/report-on-government-services/child-care-education-and-training/school-education",
    setting: "Australia, 2023–24",
  },
} as const satisfies Record<string, Citation>;
