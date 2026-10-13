export const phoneCase = {
  id: "phone_case",
  name: "Phone Case",
  emoji: "📱",
  confidence: "medium",
  markets: {
    GB: { currency: "GBP", price: 25, retailer: "Online retailer" },
    SG: { currency: "SGD", price: 32, retailer: "Online retailer" },
  },
  split: {
    materials: { pct: { low: 14, mid: 18, high: 22 }, confidence: "medium", basis: "public price benchmark" },
    labour: { pct: { low: 7, mid: 10, high: 13 }, confidence: "medium", basis: "published brand disclosure" },
    freight: { pct: { low: 8, mid: 12, high: 16 }, confidence: "medium", basis: "trade data" },
    brand: { pct: { low: 26, mid: 30, high: 34 }, confidence: "low", basis: "AI inference" },
    retail: { pct: { low: 26, mid: 30, high: 34 }, confidence: "medium", basis: "public price benchmark" },
  },
  route: [
    { stage: "Plastic & silicone", country: "China", code: "CN", lat: 30.0, lng: 120.0, note: "Polymers and moulding", value: 18 },
    { stage: "Assembly", country: "China", code: "CN", lat: 30.0, lng: 120.0, note: "Injection moulded", value: 10 },
    { stage: "Freight hub", country: "Singapore", code: "SG", lat: 1.35, lng: 103.8, note: "Air and sea freight", value: 12 },
  ],
  finalStop: {
    GB: { stage: "Sold", country: "United Kingdom", code: "GB", lat: 51.5, lng: -0.12, note: "Online retailer", value: 60 },
    SG: { stage: "Sold", country: "Singapore", code: "SG", lat: 1.35, lng: 103.8, note: "Online retailer", value: 60 },
  },
  labourContext:
    "Phone cases are mostly injection-moulded in China from silicone and TPU. Materials and labour are a small share; most of the price is brand and retail margin.",
  transparentAlternative: {
    note: "Illustrative scenario for a transparent brand — not a specific real company.",
    split: {
      materials: { pct: { low: 22, mid: 28, high: 34 }, confidence: "medium", basis: "AI inference" },
      labour: { pct: { low: 16, mid: 22, high: 28 }, confidence: "medium", basis: "AI inference" },
      freight: { pct: { low: 10, mid: 14, high: 18 }, confidence: "medium", basis: "trade data" },
      brand: { pct: { low: 16, mid: 20, high: 24 }, confidence: "low", basis: "AI inference" },
      retail: { pct: { low: 12, mid: 16, high: 20 }, confidence: "low", basis: "AI inference" },
    },
  },
};