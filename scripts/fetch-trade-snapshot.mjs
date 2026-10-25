// Snapshots UN Comtrade import shares (by partner, by value) for the product
// categories Jejak traces, for each market. Output is committed so the demo
// never depends on the Comtrade API at runtime.
//   node scripts/fetch-trade-snapshot.mjs
import { writeFileSync, mkdirSync } from "node:fs";

const API = "https://comtradeapi.un.org/public/v1/preview/C/A/HS";
const PARTNERS = "https://comtradeapi.un.org/files/v1/app/reference/partnerAreas.json";
const MARKETS = { GB: 826, SG: 702 };
const PERIODS = ["2024", "2023"];
const TOP_N = 8;

export const HS_CATEGORIES = {
  "6110": { label: "Jumpers, sweatshirts & hoodies (knitted)", proxy: false },
  "6109": { label: "T-shirts & vests (knitted)", proxy: false },
  "6203": { label: "Men's suits, trousers & jeans (woven)", proxy: false },
  "6204": { label: "Women's suits, dresses, trousers & jeans (woven)", proxy: false },
  "6404": { label: "Footwear with textile uppers (most trainers)", proxy: false },
  "6403": { label: "Footwear with leather uppers", proxy: false },
  "090111": { label: "Green coffee beans (unroasted)", proxy: false },
  "0902": { label: "Tea", proxy: false },
  "1806": { label: "Chocolate & cocoa preparations", proxy: false },
  "851713": { label: "Smartphones", proxy: false },
  "847130": { label: "Laptops & portable computers", proxy: false },
  "4202": { label: "Bags, wallets & cases", proxy: false },
  "392690": { label: "Other plastic articles (incl. moulded phone cases)", proxy: true },
  "9503": { label: "Toys", proxy: false },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url);
    if (res.ok) return res.json();
    await sleep(3000 * (i + 1));
  }
  throw new Error(`Failed: ${url}`);
}

const partnerRef = (await getJson(PARTNERS)).results;
const partnerById = new Map(partnerRef.map((p) => [p.PartnerCode, p]));

async function snapshot(reporter, cmd) {
  for (const period of PERIODS) {
    const url = `${API}?reporterCode=${reporter}&period=${period}&cmdCode=${cmd}&flowCode=M&maxRecords=500`;
    const body = await getJson(url);
    await sleep(1500);
    const rows = (body.data || []).filter(
      (r) => r.customsCode === "C00" && r.motCode === 0 && r.partner2Code === 0
    );
    const world = rows.find((r) => r.partnerCode === 0);
    if (!world || !world.primaryValue) continue;
    const partners = rows
      .filter((r) => r.partnerCode !== 0)
      .map((r) => ({ r, ref: partnerById.get(r.partnerCode) }))
      .filter(({ ref }) => ref && !ref.isGroup && ref.PartnerCodeIsoAlpha2)
      .sort((a, b) => b.r.primaryValue - a.r.primaryValue)
      .slice(0, TOP_N)
      .map(({ r, ref }) => ({
        code: ref.PartnerCodeIsoAlpha2,
        country: ref.PartnerDesc,
        share: Math.round((r.primaryValue / world.primaryValue) * 1000) / 10,
      }));
    return { period, totalUsd: Math.round(world.primaryValue), partners };
  }
  return null;
}

const out = {
  source: "UN Comtrade (comtradeapi.un.org public preview API), imports by partner, primary value in USD",
  retrieved: new Date().toISOString().slice(0, 10),
  method:
    "Share = partner import value / world import value for the HS code, reporter = market, flow = imports, all customs procedures and transport modes. Top partners only; shares do not sum to 100.",
  categories: HS_CATEGORIES,
  markets: {},
};

for (const [market, reporter] of Object.entries(MARKETS)) {
  out.markets[market] = {};
  for (const cmd of Object.keys(HS_CATEGORIES)) {
    const snap = await snapshot(reporter, cmd);
    out.markets[market][cmd] = snap;
    console.log(market, cmd, snap ? `${snap.period} ${snap.partners.slice(0, 3).map((p) => `${p.code} ${p.share}%`).join(", ")}` : "NO DATA");
  }
}

mkdirSync("src/data/trade", { recursive: true });
writeFileSync("src/data/trade/imports.json", JSON.stringify(out, null, 2) + "\n");
console.log("wrote src/data/trade/imports.json");
