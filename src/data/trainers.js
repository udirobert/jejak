export const trainers = {
  id: "trainers",
  hs: "6404",
  name: "Running Trainers",
  emoji: "👟",
  confidence: "medium",
  markets: {
    GB: { currency: "GBP", price: 90, retailer: "Sportswear retailer" },
    SG: { currency: "SGD", price: 110, retailer: "Local retailer" },
  },
  split: {
    materials: { pct: { low: 20, mid: 25, high: 30 }, confidence: "medium", basis: "AI inference" },
    // Labour anchored to Deloitte/Oxfam: factory wages ≈4% of retail in Vietnam.
    labour: { pct: { low: 2, mid: 4, high: 7 }, confidence: "medium", basis: "AI inference" },
    freight: { pct: { low: 7, mid: 9, high: 12 }, confidence: "medium", basis: "AI inference" },
    brand: { pct: { low: 26, mid: 30, high: 34 }, confidence: "low", basis: "AI inference" },
    retail: { pct: { low: 24, mid: 32, high: 32 }, confidence: "medium", basis: "AI inference" },
  },
  route: [
    { stage: "Rubber & foam", kind: "raw_material", country: "Vietnam", code: "VN", lat: 16.0, lng: 107.0, note: "Sole compounds made", value: 25 },
    { stage: "Components", kind: "processing", country: "China", code: "CN", lat: 30.0, lng: 120.0, note: "Uppers and knit panels", value: 8 },
    { stage: "Assembly", kind: "final_manufacture", country: "Vietnam", code: "VN", lat: 16.0, lng: 107.0, note: "Stitched and lasted", value: 9 },
    { stage: "Freight hub", kind: "logistics", country: "Singapore", code: "SG", lat: 1.35, lng: 103.8, note: "Sea freight consolidation", value: 30 },
  ],
  finalStop: {
    GB: { stage: "Sold", country: "United Kingdom", code: "GB", lat: 51.5, lng: -0.12, note: "Sportswear retailer", value: 28 },
    SG: { stage: "Sold", country: "Singapore", code: "SG", lat: 1.35, lng: 103.8, note: "Local retailer", value: 28 },
  },
  labourContext:
    "Trainer assembly is concentrated in Vietnam, a major footwear exporter. Deloitte's supply-chain modelling puts factory wages at about 4% of retail there; brand marketing spend is far larger.",
  livingWage: {
    madeIn: "Vietnam",
    wageRisePct: 8,
    retailRisePct: 0.5,
    source: "Deloitte Access Economics for Oxfam Australia (2017)",
  },
  transparentAlternative: {
    note: "Illustrative scenario for a transparent brand — not a specific real company.",
    split: {
      materials: { pct: { low: 26, mid: 30, high: 34 }, confidence: "medium", basis: "AI inference" },
      labour: { pct: { low: 8, mid: 14, high: 20 }, confidence: "medium", basis: "AI inference" },
      freight: { pct: { low: 8, mid: 10, high: 13 }, confidence: "medium", basis: "AI inference" },
      brand: { pct: { low: 18, mid: 22, high: 26 }, confidence: "low", basis: "AI inference" },
      retail: { pct: { low: 16, mid: 24, high: 24 }, confidence: "low", basis: "AI inference" },
    },
  },
};