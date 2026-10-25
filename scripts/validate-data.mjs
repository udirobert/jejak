// Validation script: run with `node scripts/validate-data.mjs`
// Asserts every product's split (standard + transparent) sums to exactly 100,
// and sanity-checks currency formatting for GBP and SGD.
import { PRODUCTS } from "../src/data/index.js";
import { sumMid, formatMoney, formatSmallMoney } from "../src/lib/money.js";
import { annotateRoute, evidenceIndex } from "../src/lib/provenance.js";
import importsSnapshot from "../src/data/trade/imports.json" with { type: "json" };
import countries from "../src/data/trade/countries.json" with { type: "json" };

let failures = 0;

const fail = (msg) => {
  console.error(`FAIL ${msg}`);
  failures++;
};

// Route kinds: exactly one final_manufacture stop per curated product;
// every curated hs exists in imports.json for GB and SG;
// every split basis is "AI inference".
for (const p of PRODUCTS) {
  const fm = p.route.filter((s) => s.kind === "final_manufacture");
  if (fm.length !== 1) fail(`${p.id} has ${fm.length} final_manufacture stops, expected 1`);
  for (const m of ["GB", "SG"]) {
    if (!p.hs || !importsSnapshot.markets?.[m]?.[p.hs]) fail(`${p.id} hs ${p.hs} missing in imports.json ${m}`);
  }
  for (const [scope, split] of [["split", p.split], ["transparent", p.transparentAlternative.split]]) {
    for (const [k, e] of Object.entries(split)) {
      if (e.basis !== "AI inference") fail(`${p.id} ${scope}.${k} basis is "${e.basis}", expected "AI inference"`);
    }
  }
}

// Every partner code in imports.json exists in countries.json.
for (const [mkt, codes] of Object.entries(importsSnapshot.markets)) {
  for (const [hs, snap] of Object.entries(codes)) {
    for (const p of snap.partners || []) {
      if (!countries[p.code]) fail(`${mkt} HS ${hs} partner ${p.code} missing from countries.json`);
    }
  }
}

// annotateRoute assertions.
const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
const assertStop = (cond, msg) => { if (!cond) fail(msg); };

{
  const r = annotateRoute(byId.hoodie, "GB", null);
  const ev = r.find((s) => s.isEvidenceStop);
  const wh = r.find((s) => s.stage === "Warehouse");
  assertStop(ev?.stage === "Cut & sew" && ev.country === "Bangladesh" && ev.provenanceBasis === "Trade data" && ev.tradeShare === 20.9,
    `hoodie GB evidence stop: got ${ev?.stage}/${ev?.country}/${ev?.provenanceBasis}/${ev?.tradeShare}`);
  assertStop(wh?.country === "Netherlands" && wh?.provenanceBasis === "Estimated",
    `hoodie GB warehouse: got ${wh?.country}/${wh?.provenanceBasis}`);
}
{
  const r = annotateRoute(byId.hoodie, "GB", { readable: true, country_of_manufacture: "Bangladesh" });
  const ev = r.find((s) => s.isEvidenceStop);
  assertStop(ev?.provenanceBasis === "Read from label" && ev?.provenanceConfidence === "high",
    `hoodie GB real label: got ${ev?.provenanceBasis}/${ev?.provenanceConfidence}`);
}
{
  const r = annotateRoute(byId.hoodie, "GB", { readable: true, isSampleLabel: true, country_of_manufacture: "Bangladesh" });
  const ev = r.find((s) => s.isEvidenceStop);
  assertStop(ev?.provenanceBasis === "Sample label", `hoodie GB sample label: got ${ev?.provenanceBasis}`);
}
{
  const r = annotateRoute(byId.coffee, "GB", null);
  const ev = r.find((s) => s.isEvidenceStop);
  assertStop(ev?.stage === "Cherry harvest" && ev.country === "Ethiopia" && ev.tradeShare === 2.6,
    `coffee GB evidence stop: got ${ev?.stage}/${ev?.country}/${ev?.tradeShare}`);
}
{
  const r = annotateRoute(byId.trainers, "GB", null);
  const ev = r.find((s) => s.isEvidenceStop);
  assertStop(ev?.stage === "Assembly" && ev.country === "Vietnam" && ev.tradeShare === 42.3,
    `trainers GB evidence stop: got ${ev?.stage}/${ev?.country}/${ev?.tradeShare}`);
}
if (evidenceIndex(byId.hoodie, "GB") !== 2) fail(`hoodie GB evidenceIndex ${evidenceIndex(byId.hoodie, "GB")}, expected 2`);

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