// Jejak design tokens — single source of truth for colours used across components.
// No component should hard-code hex values; import from here or use the
// matching tailwind classes defined in tailwind.config.js.

export const COLORS = {
  navy: "#1B1B3A",
  materials: "#2FBF71",
  labour: "#FF7A1A",
  freight: "#2D5BFF",
  brand: "#8B5CF6",
  retail: "#FF3D81",
  coral: "#FF8A65",
  amber: "#FFC24B",
  magenta: "#FF3D81",
  gold: "#FFC24B",
  goldDeep: "#E8921A",
  goldLight: "#FFF3C4",
};

export const CATEGORIES = [
  { key: "materials", label: "Materials", color: COLORS.materials, blurb: "Raw inputs: fibre, metal, plastic, beans." },
  { key: "labour", label: "Labour", color: COLORS.labour, blurb: "Wages for the people who make it." },
  { key: "freight", label: "Freight & duties", color: COLORS.freight, blurb: "Shipping, ports, tariffs and taxes." },
  { key: "brand", label: "Brand margin", color: COLORS.brand, blurb: "Marketing, design and profit kept by the brand." },
  { key: "retail", label: "Retail margin", color: COLORS.retail, blurb: "Shop rent, staff and the retailer's profit." },
];

export const CATEGORY_MAP = CATEGORIES.reduce((acc, c) => {
  acc[c.key] = c;
  return acc;
}, {});

export const SUNRISE_GRADIENT = "linear-gradient(135deg, #FF8A65 0%, #FFC24B 50%, #FF3D81 100%)";
export const LILAC_PEACH_GRADIENT = "linear-gradient(160deg, #EDE7FF 0%, #FFE7D6 55%, #FFD9E8 100%)";

export const CONFIDENCE = {
  high: { label: "High", color: "#2FBF71" },
  medium: { label: "Medium", color: "#FFC24B" },
  low: { label: "Low", color: "#FF7A1A" },
};

// Route-stop provenance labels, most-evidenced first. Money-split figures use a
// single basis: "AI inference" (category-level estimate, not sourced).
export const BASIS_LABELS = [
  "Read from label",
  "Trade data",
  "Estimated",
  "Sample label",
];