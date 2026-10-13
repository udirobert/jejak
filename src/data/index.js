import { hoodie } from "./hoodie.js";
import { trainers } from "./trainers.js";
import { coffee } from "./coffee.js";
import { phoneCase } from "./phoneCase.js";

export const PRODUCTS = [hoodie, trainers, coffee, phoneCase];

export const PRODUCT_MAP = PRODUCTS.reduce((acc, p) => {
  acc[p.id] = p;
  return acc;
}, {});

export function getProduct(id) {
  return PRODUCT_MAP[id];
}

// Chips shown on the home screen.
export const DEMO_CHIPS = [
  { id: "hoodie", label: "Hoodie", emoji: "🧥" },
  { id: "trainers", label: "Trainers", emoji: "👟" },
  { id: "coffee", label: "Coffee", emoji: "☕" },
  { id: "phone_case", label: "Phone case", emoji: "📱" },
];

// Categories a camera scan may resolve to, mapped to a curated product.
export const CATEGORY_TO_PRODUCT = {
  hoodie: "hoodie",
  trainers: "trainers",
  coffee: "coffee",
  phone_case: "phone_case",
};