export const FLAGS = {
  Bangladesh: "🇧🇩",
  Vietnam: "🇻🇳",
  Ethiopia: "🇪🇹",
  China: "🇨🇳",
  Cambodia: "🇰🇭",
  Indonesia: "🇮🇩",
  India: "🇮🇳",
  Singapore: "🇸🇬",
  Netherlands: "🇳🇱",
  "United Kingdom": "🇬🇧",
};

export const ORIGIN_COORDS = {
  Bangladesh: [90.3563, 23.685],
  Vietnam: [108.2772, 14.0583],
  Ethiopia: [40.4897, 9.145],
  China: [113.2644, 23.1291],
  Cambodia: [104.991, 12.5657],
  Indonesia: [110.3695, -7.7956],
  India: [78.9629, 20.5937],
  Singapore: [103.8198, 1.3521],
  Netherlands: [5.2913, 52.1326],
  "United Kingdom": [-1.1743, 52.3555],
};

export const PRODUCT_SURFACES = {
  hoodie: "linear-gradient(145deg, #FF8A65 0%, #FFB74D 100%)",
  trainers: "linear-gradient(145deg, #6366F1 0%, #EC4899 100%)",
  coffee: "linear-gradient(145deg, #F59E0B 0%, #10B981 100%)",
  phone_case: "linear-gradient(145deg, #3B82F6 0%, #8B5CF6 100%)",
};

export const DEFAULT_MATERIALS = {
  hoodie: "Cotton fleece",
  trainers: "Knit mesh & EVA",
  coffee: "Washed Arabica",
  phone_case: "Moulded TPU",
};

export function materialOriginLine(scan) {
  if (!scan) return "";
  const mat =
    scan.label_materials?.trim() ||
    DEFAULT_MATERIALS[scan.product_id] ||
    "Standard material";
  return `${mat} · ${scan.origin || "Origin"}`;
}

export function hasOwnAnchoredRecord(scan) {
  return Boolean(
    scan &&
      typeof scan.stellar_tx_hash === "string" &&
      scan.stellar_tx_hash.trim().length === 64 &&
      typeof scan.record_sha256 === "string" &&
      scan.record_sha256.trim().length === 64
  );
}

export function txExplorerUrl(scan) {
  if (!hasOwnAnchoredRecord(scan)) return "";
  return `https://stellar.expert/explorer/testnet/tx/${scan.stellar_tx_hash.trim()}`;
}