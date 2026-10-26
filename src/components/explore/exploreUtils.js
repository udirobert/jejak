import countries from "../../data/trade/countries.json" with { type: "json" };

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

// Origin dots: display name -> [lng, lat] for every country in the table,
// plus legacy names scans were saved under.
export const ORIGIN_COORDS = (() => {
  const out = {};
  for (const [code, c] of Object.entries(countries)) {
    if (code.startsWith("_") || !c?.name || !c?.point) continue;
    out[c.name] = c.point;
  }
  // Legacy names already stored on Scan records / used in code.
  const legacy = {
    Vietnam: "VN",
    "United Kingdom": "GB",
    Turkey: "TR",
    "Viet Nam": "VN",
    USA: "US",
    "United States of America": "US",
    "South Korea": "KR",
    Korea: "KR",
    "Hong Kong": "HK",
  };
  for (const [name, code] of Object.entries(legacy)) {
    const c = countries[code];
    if (c?.point && !out[name]) out[name] = c.point;
  }
  return out;
})();

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

// Corroboration — did anyone else reach the same conclusion?
//
// Not a rating and not a star count: agreement. If seven people traced the
// same hoodie and five of them also got Bangladesh, that is worth more than
// any opinion, because it is the same conclusion reached independently.
//
// Sample entries are excluded — seeded data is not a person.
export function corroboration(items) {
  const real = (items || []).filter((s) => !isSampleScan(s));
  const withOrigin = real.filter((s) => (s.origin || "").trim());
  if (!withOrigin.length) return null;

  const counts = new Map();
  for (const s of withOrigin) {
    const o = s.origin.trim();
    counts.set(o, (counts.get(o) || 0) + 1);
  }
  const ranked = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  const [topOrigin, topCount] = ranked[0];

  return {
    people: withOrigin.length,
    distinctOrigins: counts.size,
    agreedOrigin: topCount >= 2 ? topOrigin : null,
    agreedCount: topCount,
  };
}

// One line of plain English about what the field agrees on.
export function corroborationLine(c) {
  if (!c || c.people < 2) return "";
  if (c.agreedOrigin) {
    return `${c.agreedCount} of ${c.people} got ${c.agreedOrigin}`;
  }
  if (c.distinctOrigins > 1) {
    return `${c.people} traced this · ${c.distinctOrigins} different origins`;
  }
  return `${c.people} traced this`;
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