export const coffee = {
  id: "coffee",
  hs: "090111",
  name: "Coffee Bag",
  emoji: "☕",
  confidence: "medium",
  markets: {
    GB: { currency: "GBP", price: 6, retailer: "Specialty roaster" },
    SG: { currency: "SGD", price: 12, retailer: "Specialty roaster" },
  },
  split: {
    materials: { pct: { low: 16, mid: 20, high: 24 }, confidence: "medium", basis: "AI inference" },
    // Farm wages on cherry picking: the farm-gate price is already a small
    // fraction of the shelf price, and wages are a fraction of that.
    labour: { pct: { low: 4, mid: 7, high: 11 }, confidence: "medium", basis: "AI inference" },
    freight: { pct: { low: 10, mid: 14, high: 18 }, confidence: "medium", basis: "AI inference" },
    brand: { pct: { low: 20, mid: 24, high: 28 }, confidence: "low", basis: "AI inference" },
    retail: { pct: { low: 26, mid: 35, high: 34 }, confidence: "medium", basis: "AI inference" },
  },
  route: [
    { stage: "Cherry harvest", kind: "raw_material", country: "Ethiopia", code: "ET", lat: 9.0, lng: 38.5, note: "Coffee cherries picked by hand", value: 20 },
    { stage: "Processing", kind: "processing", country: "Ethiopia", code: "ET", lat: 9.0, lng: 38.5, note: "Washed and dried", value: 12 },
    { stage: "Roasting", kind: "final_manufacture", country: "United Kingdom", code: "GB", lat: 51.5, lng: -0.12, note: "Roasted close to market", value: 14 },
  ],
  finalStop: {
    GB: { stage: "Sold", country: "United Kingdom", code: "GB", lat: 51.5, lng: -0.12, note: "Specialty roaster", value: 54 },
    SG: { stage: "Sold", country: "Singapore", code: "SG", lat: 1.35, lng: 103.8, note: "Specialty roaster", value: 54 },
  },
  labourContext:
    "Most of the world's arabica is grown by smallholders near the equator. The farm-gate price is a small fraction of the shelf price; roasting and retail take the largest shares.",
  transparentAlternative: {
    note: "Illustrative scenario for a transparent brand — not a specific real company.",
    split: {
      materials: { pct: { low: 28, mid: 34, high: 40 }, confidence: "medium", basis: "AI inference" },
      labour: { pct: { low: 10, mid: 18, high: 25 }, confidence: "medium", basis: "AI inference" },
      freight: { pct: { low: 10, mid: 13, high: 16 }, confidence: "medium", basis: "AI inference" },
      brand: { pct: { low: 12, mid: 15, high: 18 }, confidence: "low", basis: "AI inference" },
      retail: { pct: { low: 10, mid: 20, high: 18 }, confidence: "low", basis: "AI inference" },
    },
  },
};