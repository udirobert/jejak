export const phoneCase = {
  id: "phone_case",
  hs: "392690",
  name: "Phone Case",
  emoji: "📱",
  confidence: "medium",
  markets: {
    GB: { currency: "GBP", price: 25, retailer: "Online retailer" },
    SG: { currency: "SGD", price: 32, retailer: "Online retailer" },
  },
  split: {
    materials: { pct: { low: 14, mid: 18, high: 22 }, confidence: "medium", basis: "AI inference" },
    // Anchored to Deloitte/Oxfam factory-wage modelling for China (~4%) —
    // injection moulding is less labour-intensive than cut-and-sew.
    labour: { pct: { low: 2, mid: 4, high: 7 }, confidence: "medium", basis: "AI inference" },
    freight: { pct: { low: 8, mid: 12, high: 16 }, confidence: "medium", basis: "AI inference" },
    brand: { pct: { low: 26, mid: 30, high: 34 }, confidence: "low", basis: "AI inference" },
    retail: { pct: { low: 26, mid: 36, high: 34 }, confidence: "medium", basis: "AI inference" },
  },
  route: [
    { stage: "Plastic & silicone", kind: "raw_material", country: "China", code: "CN", lat: 30.0, lng: 120.0, note: "Polymers and moulding", value: 18 },
    { stage: "Assembly", kind: "final_manufacture", country: "China", code: "CN", lat: 30.0, lng: 120.0, note: "Injection moulded", value: 10 },
    { stage: "Freight hub", kind: "logistics", country: "Singapore", code: "SG", lat: 1.35, lng: 103.8, note: "Air and sea freight", value: 12 },
  ],
  finalStop: {
    GB: { stage: "Sold", country: "United Kingdom", code: "GB", lat: 51.5, lng: -0.12, note: "Online retailer", value: 60 },
    SG: { stage: "Sold", country: "Singapore", code: "SG", lat: 1.35, lng: 103.8, note: "Online retailer", value: 60 },
  },
  labourContext:
    "Phone cases are mostly injection-moulded in China from silicone and TPU. Deloitte's modelling puts factory wages in China near 4% of retail; moulding is less labour-intensive than cut-and-sew, so the real share is likely lower.",
  livingWage: {
    madeIn: "China",
    wageRisePct: 0,
    retailRisePct: 0,
    source: "Deloitte Access Economics for Oxfam Australia (2017)",
  },
  transparentAlternative: {
    note: "Illustrative scenario for a transparent brand — not a specific real company.",
    split: {
      materials: { pct: { low: 22, mid: 28, high: 34 }, confidence: "medium", basis: "AI inference" },
      labour: { pct: { low: 8, mid: 14, high: 20 }, confidence: "medium", basis: "AI inference" },
      freight: { pct: { low: 10, mid: 14, high: 18 }, confidence: "medium", basis: "AI inference" },
      brand: { pct: { low: 16, mid: 20, high: 24 }, confidence: "low", basis: "AI inference" },
      retail: { pct: { low: 12, mid: 24, high: 20 }, confidence: "low", basis: "AI inference" },
    },
  },
};