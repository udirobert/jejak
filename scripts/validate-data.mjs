// Validation script: run with `node scripts/validate-data.mjs`
// Asserts every product's split (standard + transparent) sums to exactly 100,
// and sanity-checks currency formatting for GBP and SGD.
import { PRODUCTS } from "../src/data/index.js";
import { sumMid, formatMoney, formatSmallMoney } from "../src/lib/money.js";

let failures = 0;

for (const p of PRODUCTS) {
  const std = sumMid(p.split);
  if (std !== 100) {
    console.error(`FAIL ${p.id} standard split sums to ${std}, expected 100`);
    failures++;
  }
  const tr = sumMid(p.transparentAlternative.split);
  if (tr !== 100) {
    console.error(`FAIL ${p.id} transparent split sums to ${tr}, expected 100`);
    failures++;
  }
  for (const m of Object.keys(p.markets)) {
    const cur = p.markets[m].currency;
    const f = formatMoney(p.markets[m].price, cur);
    if (!f) {
      console.error(`FAIL ${p.id} ${m} formatMoney returned empty`);
      failures++;
    }
  }
}

// Range display check
const labour = formatSmallMoney(0.075, "GBP");
if (labour !== "7.5p") {
  console.error(`FAIL labour per £1 expected "7.5p", got "${labour}"`);
  failures++;
}
const sgd = formatMoney(100, "SGD");
if (!sgd.includes("S$")) {
  console.error(`FAIL SGD formatting expected to contain "S$", got "${sgd}"`);
  failures++;
}

if (failures === 0) {
  console.log(`OK — ${PRODUCTS.length} products validated, all splits sum to 100.`);
  process.exit(0);
} else {
  console.error(`${failures} failure(s)`);
  process.exit(1);
}