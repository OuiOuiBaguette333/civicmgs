/**
 * Every Legislative Assembly district at the 2022 Victorian state election.
 *
 * This is the election result, not the current chamber. Four by-elections and
 * several changes of party have happened since — the Assembly now sits at
 * roughly Labor 54, Coalition 29, crossbench 5 against the 56/28/4 below — so
 * nothing here should be read as who holds a seat today. The margin is the
 * part that keeps its meaning: it is a fixed historical fact and it is what
 * says how contestable a district was when it was last tested.
 *
 * Compiled from the published results rather than fetched, because the VEC
 * publishes district results as web pages and a map, with no data file behind
 * them. Checked three ways before being committed: the party totals come to
 * 56/19/9/4, which is the published Assembly result and would break if any
 * single row carried the wrong party; every winner is above 50%, which a
 * two-candidate-preferred winner must be; and the district names are exactly
 * the 88 in SED_VIC.json.
 *
 * Sources:
 *   Results of the 2022 Victorian state election (Legislative Assembly)
 *   https://en.wikipedia.org/wiki/Results_of_the_2022_Victorian_state_election_(Legislative_Assembly)
 *   and the individual district articles for the fourteen it truncates.
 */

export type Party = "Labor" | "Liberal" | "National" | "Greens";

export interface Seat {
  district: string;
  /** The member elected in 2022, who is not always the member now. */
  member: string;
  party: Party;
  /**
   * The winner's share of the final two candidates, which is not always a
   * Labor-versus-Coalition pair: twelve districts came down to some other
   * combination, most of them Labor against the Greens.
   */
  twoCandidatePreferred: number;
}

export const SEATS_2022: Seat[] = [
  { district: "Albert Park", member: "Nina Taylor", party: "Labor", twoCandidatePreferred: 61.2 },
  { district: "Ashwood", member: "Matt Fregon", party: "Labor", twoCandidatePreferred: 56.2 },
  { district: "Bass", member: "Jordan Crugnale", party: "Labor", twoCandidatePreferred: 50.2 },
  { district: "Bayswater", member: "Jackson Taylor", party: "Labor", twoCandidatePreferred: 54.2 },
  { district: "Bellarine", member: "Alison Marchant", party: "Labor", twoCandidatePreferred: 58.5 },
  { district: "Benambra", member: "Bill Tilley", party: "Liberal", twoCandidatePreferred: 50.9 },
  {
    district: "Bendigo East",
    member: "Jacinta Allan",
    party: "Labor",
    twoCandidatePreferred: 60.8,
  },
  {
    district: "Bendigo West",
    member: "Maree Edwards",
    party: "Labor",
    twoCandidatePreferred: 64.6,
  },
  { district: "Bentleigh", member: "Nick Staikos", party: "Labor", twoCandidatePreferred: 58.0 },
  { district: "Berwick", member: "Brad Battin", party: "Liberal", twoCandidatePreferred: 54.7 },
  { district: "Box Hill", member: "Paul Hamer", party: "Labor", twoCandidatePreferred: 57.2 },
  { district: "Brighton", member: "James Newbury", party: "Liberal", twoCandidatePreferred: 55.1 },
  {
    district: "Broadmeadows",
    member: "Kathleen Matthews-Ward",
    party: "Labor",
    twoCandidatePreferred: 65.5,
  },
  { district: "Brunswick", member: "Tim Read", party: "Greens", twoCandidatePreferred: 63.7 },
  { district: "Bulleen", member: "Matthew Guy", party: "Liberal", twoCandidatePreferred: 55.9 },
  { district: "Bundoora", member: "Colin Brooks", party: "Labor", twoCandidatePreferred: 62.7 },
  { district: "Carrum", member: "Sonya Kilkenny", party: "Labor", twoCandidatePreferred: 59.8 },
  {
    district: "Caulfield",
    member: "David Southwick",
    party: "Liberal",
    twoCandidatePreferred: 52.1,
  },
  { district: "Clarinda", member: "Meng Heang Tak", party: "Labor", twoCandidatePreferred: 60.2 },
  {
    district: "Cranbourne",
    member: "Pauline Richards",
    party: "Labor",
    twoCandidatePreferred: 59.0,
  },
  { district: "Croydon", member: "David Hodgett", party: "Liberal", twoCandidatePreferred: 51.4 },
  {
    district: "Dandenong",
    member: "Gabrielle Williams",
    party: "Labor",
    twoCandidatePreferred: 68.3,
  },
  { district: "Eildon", member: "Cindy McLeish", party: "Liberal", twoCandidatePreferred: 57.0 },
  { district: "Eltham", member: "Vicki Ward", party: "Labor", twoCandidatePreferred: 59.0 },
  { district: "Essendon", member: "Danny Pearson", party: "Labor", twoCandidatePreferred: 62.5 },
  { district: "Eureka", member: "Michaela Settle", party: "Labor", twoCandidatePreferred: 57.2 },
  {
    district: "Euroa",
    member: "Annabelle Cleeland",
    party: "National",
    twoCandidatePreferred: 59.9,
  },
  { district: "Evelyn", member: "Bridget Vallence", party: "Liberal", twoCandidatePreferred: 55.4 },
  { district: "Footscray", member: "Katie Hall", party: "Labor", twoCandidatePreferred: 54.2 },
  { district: "Frankston", member: "Paul Edbrooke", party: "Labor", twoCandidatePreferred: 58.7 },
  { district: "Geelong", member: "Christine Couzens", party: "Labor", twoCandidatePreferred: 64.7 },
  {
    district: "Gippsland East",
    member: "Tim Bull",
    party: "National",
    twoCandidatePreferred: 74.6,
  },
  {
    district: "Gippsland South",
    member: "Danny O'Brien",
    party: "National",
    twoCandidatePreferred: 65.6,
  },
  {
    district: "Glen Waverley",
    member: "John Mullahy",
    party: "Labor",
    twoCandidatePreferred: 53.3,
  },
  { district: "Greenvale", member: "Iwan Walters", party: "Labor", twoCandidatePreferred: 57.1 },
  { district: "Hastings", member: "Paul Mercurio", party: "Labor", twoCandidatePreferred: 51.4 },
  { district: "Hawthorn", member: "John Pesutto", party: "Liberal", twoCandidatePreferred: 51.7 },
  { district: "Ivanhoe", member: "Anthony Carbines", party: "Labor", twoCandidatePreferred: 62.8 },
  { district: "Kalkallo", member: "Ros Spence", party: "Labor", twoCandidatePreferred: 66.5 },
  { district: "Kew", member: "Jess Wilson", party: "Liberal", twoCandidatePreferred: 54.0 },
  {
    district: "Kororoit",
    member: "Luba Grigorovitch",
    party: "Labor",
    twoCandidatePreferred: 64.5,
  },
  { district: "Lara", member: "Ella George", party: "Labor", twoCandidatePreferred: 65.9 },
  { district: "Laverton", member: "Sarah Connolly", party: "Labor", twoCandidatePreferred: 68.4 },
  { district: "Lowan", member: "Emma Kealy", party: "National", twoCandidatePreferred: 71.6 },
  { district: "Macedon", member: "Mary-Anne Thomas", party: "Labor", twoCandidatePreferred: 59.5 },
  { district: "Malvern", member: "Michael O'Brien", party: "Liberal", twoCandidatePreferred: 58.1 },
  { district: "Melbourne", member: "Ellen Sandell", party: "Greens", twoCandidatePreferred: 60.2 },
  { district: "Melton", member: "Steve McGhie", party: "Labor", twoCandidatePreferred: 54.6 },
  { district: "Mildura", member: "Jade Benham", party: "National", twoCandidatePreferred: 51.2 },
  { district: "Mill Park", member: "Lily D'Ambrosio", party: "Labor", twoCandidatePreferred: 61.6 },
  {
    district: "Monbulk",
    member: "Daniela De Martino",
    party: "Labor",
    twoCandidatePreferred: 57.6,
  },
  { district: "Mordialloc", member: "Tim Richardson", party: "Labor", twoCandidatePreferred: 58.2 },
  {
    district: "Mornington",
    member: "Chris Crewther",
    party: "Liberal",
    twoCandidatePreferred: 50.7,
  },
  { district: "Morwell", member: "Martin Cameron", party: "National", twoCandidatePreferred: 54.4 },
  { district: "Mulgrave", member: "Daniel Andrews", party: "Labor", twoCandidatePreferred: 60.8 },
  {
    district: "Murray Plains",
    member: "Peter Walsh",
    party: "National",
    twoCandidatePreferred: 73.4,
  },
  { district: "Narracan", member: "Wayne Farnham", party: "Liberal", twoCandidatePreferred: 63.0 },
  {
    district: "Narre Warren North",
    member: "Belinda Wilson",
    party: "Labor",
    twoCandidatePreferred: 58.7,
  },
  {
    district: "Narre Warren South",
    member: "Gary Maas",
    party: "Labor",
    twoCandidatePreferred: 58.3,
  },
  { district: "Nepean", member: "Sam Groth", party: "Liberal", twoCandidatePreferred: 56.4 },
  { district: "Niddrie", member: "Ben Carroll", party: "Labor", twoCandidatePreferred: 56.7 },
  { district: "Northcote", member: "Kat Theophanous", party: "Labor", twoCandidatePreferred: 50.2 },
  { district: "Oakleigh", member: "Steve Dimopoulos", party: "Labor", twoCandidatePreferred: 63.5 },
  {
    district: "Ovens Valley",
    member: "Tim McCurdy",
    party: "National",
    twoCandidatePreferred: 67.8,
  },
  { district: "Pakenham", member: "Emma Vulin", party: "Labor", twoCandidatePreferred: 50.4 },
  {
    district: "Pascoe Vale",
    member: "Anthony Cianflone",
    party: "Labor",
    twoCandidatePreferred: 52.0,
  },
  {
    district: "Point Cook",
    member: "Mathew Hilakari",
    party: "Labor",
    twoCandidatePreferred: 58.3,
  },
  {
    district: "Polwarth",
    member: "Richard Riordan",
    party: "Liberal",
    twoCandidatePreferred: 51.8,
  },
  { district: "Prahran", member: "Sam Hibbins", party: "Greens", twoCandidatePreferred: 62.0 },
  { district: "Preston", member: "Nathan Lambert", party: "Labor", twoCandidatePreferred: 52.1 },
  {
    district: "Richmond",
    member: "Gabrielle de Vietri",
    party: "Greens",
    twoCandidatePreferred: 57.2,
  },
  { district: "Ringwood", member: "Will Fowles", party: "Labor", twoCandidatePreferred: 57.5 },
  { district: "Ripon", member: "Martha Haylett", party: "Labor", twoCandidatePreferred: 53.0 },
  { district: "Rowville", member: "Kim Wells", party: "Liberal", twoCandidatePreferred: 53.7 },
  {
    district: "Sandringham",
    member: "Brad Rowswell",
    party: "Liberal",
    twoCandidatePreferred: 55.0,
  },
  {
    district: "Shepparton",
    member: "Kim O'Keeffe",
    party: "National",
    twoCandidatePreferred: 56.8,
  },
  {
    district: "South Barwon",
    member: "Darren Cheeseman",
    party: "Labor",
    twoCandidatePreferred: 59.8,
  },
  {
    district: "South-West Coast",
    member: "Roma Britnell",
    party: "Liberal",
    twoCandidatePreferred: 58.0,
  },
  {
    district: "St Albans",
    member: "Natalie Suleyman",
    party: "Labor",
    twoCandidatePreferred: 59.6,
  },
  { district: "Sunbury", member: "Josh Bull", party: "Labor", twoCandidatePreferred: 56.4 },
  { district: "Sydenham", member: "Natalie Hutchins", party: "Labor", twoCandidatePreferred: 58.8 },
  { district: "Tarneit", member: "Dylan Wight", party: "Labor", twoCandidatePreferred: 62.3 },
  {
    district: "Thomastown",
    member: "Bronwyn Halfpenny",
    party: "Labor",
    twoCandidatePreferred: 65.8,
  },
  { district: "Warrandyte", member: "Ryan Smith", party: "Liberal", twoCandidatePreferred: 54.3 },
  { district: "Wendouree", member: "Juliana Addison", party: "Labor", twoCandidatePreferred: 61.9 },
  { district: "Werribee", member: "Tim Pallas", party: "Labor", twoCandidatePreferred: 60.9 },
  {
    district: "Williamstown",
    member: "Melissa Horne",
    party: "Labor",
    twoCandidatePreferred: 63.4,
  },
  { district: "Yan Yean", member: "Lauren Kathage", party: "Labor", twoCandidatePreferred: 54.3 },
];
