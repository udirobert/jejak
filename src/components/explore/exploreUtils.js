export const FLAGS = {
  Bangladesh: "BD",
  Vietnam: "VN",
  Ethiopia: "ET",
  China: "CN",
  Cambodia: "KH",
  Indonesia: "ID",
  India: "IN",
  Singapore: "SG",
  Netherlands: "NL",
  "United Kingdom": "GB",
  UK: "GB",
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
  hoodie: "linear-gradient(145deg, #FF8A65 0%, #FFC24B 100%)",
  trainers: "linear-gradient(145deg, #6366F1 0%, #EC4899 100%)",
  coffee: "linear-gradient(145deg, #F59E0B 0%, #10B981 100%)",
  phone_case: "linear-gradient(145deg, #3B82F6 0%, #8B5CF6 100%)",
};

export const DEFAULT_MATERIALS = {
  hoodie: "Cotton fleece",
  trainers: "Knit mesh & EVA sole",
  coffee: "Washed Arabica",
  phone_case: "Moulded TPU",
};

const RETIRED_SHARED_TX_HASH =
  "89cc05d9e7d0c0bfc766c205b00da5780fb4e70d93c45215202bb3b3346d6643";
const RETIRED_SHARED_SHA256 =
  "711a78b17f427af83d26d3efcce5af117cee0bf2fb8c375b4cf3388a4b20113c";
export const EMPTY_STRING_SHA256 =
  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

export function isSampleScan(scan) {
  return Boolean(scan && (scan.sample_entry || scan.is_sample));
}

export function getMaterialName(scan) {
  if (!scan) return "Standard material";
  return (
    scan.label_materials?.trim() ||
    DEFAULT_MATERIALS[scan.product_id] ||
    "Standard material"
  );
}

export function materialOriginLine(scan) {
  if (!scan) return "";
  return `${getMaterialName(scan)} · ${scan.origin || "Origin"}`;
}

export function materialMadeInHeadline(scan) {
  if (!scan) return "";
  return `${getMaterialName(scan)} · ${scan.origin || "Origin"}`;
}

export function getScanBasis(scan) {
  if (!scan) return "Estimated";
  if (
    scan.basis === "Read from label" ||
    scan.basis === "Declared" ||
    scan.basis === "Estimated"
  ) {
    return scan.basis;
  }
  if (scan.label_country?.trim() || scan.label_materials?.trim()) {
    return "Read from label";
  }
  return "Estimated";
}

export function relativeTracedTime(iso) {
  if (!iso) return "Traced just now";
  const diffSec = Math.max(
    1,
    Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  );
  if (diffSec < 60) return "Traced just now";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `Traced ${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `Traced ${diffHr}h ago`;
  return `Traced ${Math.round(diffHr / 24)}d ago`;
}

export function hasOwnAnchoredRecord(scan) {
  if (!scan) return false;
  const tx =
    typeof scan.stellar_tx_hash === "string"
      ? scan.stellar_tx_hash.trim().toLowerCase()
      : "";
  const sha =
    typeof scan.record_sha256 === "string"
      ? scan.record_sha256.trim().toLowerCase()
      : "";
  if (tx.length !== 64 || sha.length !== 64) return false;
  if (
    tx === RETIRED_SHARED_TX_HASH ||
    sha === RETIRED_SHARED_SHA256 ||
    sha === EMPTY_STRING_SHA256
  ) {
    return false;
  }
  return true;
}

export function txExplorerUrl(scan) {
  if (!hasOwnAnchoredRecord(scan)) return "";
  return `https://stellar.expert/explorer/testnet/tx/${scan.stellar_tx_hash.trim()}`;
}

export async function sha256HexBrowser(str) {
  const bytes = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}