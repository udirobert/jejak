import { assertEquals, assertAlmostEquals } from "jsr:@std/assert";
import { normalizeTrace, haversineKm } from "./trace.ts";

const baseRaw = (over = {}) => ({
  traceable: true,
  name: "Wool jumper",
  category: "apparel",
  brand: "",
  estimated_price: 45,
  route: [
    { stage: "Sheep farming", country: "Australia", code: "AU", lat: -25, lng: 134, note: "Wool grown", basis: "Estimated", confidence: "medium" },
    { stage: "Knitting", country: "Bangladesh", code: "BD", lat: 23.7, lng: 90.4, note: "Knitted and sewn", basis: "Estimated", confidence: "medium" },
  ],
  split: {
    materials: { pct: { low: 10, mid: 30, high: 40 }, confidence: "medium", basis: "trade data" },
    labour: { pct: { low: 5, mid: 30, high: 10 }, confidence: "low", basis: "nonsense" },
    freight: { pct: { low: 5, mid: 10, high: 15 }, confidence: "medium", basis: "trade data" },
    brand: { pct: { low: 10, mid: 20, high: 30 }, confidence: "low", basis: "AI inference" },
    retail: { pct: { low: 20, mid: 30, high: 40 }, confidence: "medium", basis: "public price benchmark" },
  },
  labour_context: "Garment workers, likely low wages.",
  overall_confidence: "medium",
  ...over,
});

const input = { description: "grey wool jumper", market: "GB" as const, price: 45 };

Deno.test("mids not summing to 100 are scaled to exactly 100", async () => {
  const r = await normalizeTrace(baseRaw(), input);
  if (!r.ok) throw new Error("expected ok");
  const sum = Object.values(r.product.split).reduce((a: number, s: any) => a + s.pct.mid, 0);
  assertAlmostEquals(sum, 100, 1e-9);
});

Deno.test("inverted low/high are fixed around mid", async () => {
  const r = await normalizeTrace(baseRaw(), input);
  if (!r.ok) throw new Error("expected ok");
  for (const s of Object.values(r.product.split) as any[]) {
    assertEquals(s.pct.low <= s.pct.mid && s.pct.mid <= s.pct.high, true);
  }
  // labour raw was low 5 mid 30 high 10 -> after scaling mid ~26.5, low<=mid, high>=mid
  const labour = r.product.split.labour.pct;
  assertEquals(labour.high >= labour.mid, true);
});

Deno.test("label country match gets Read from label + high; others stay Estimated", async () => {
  const r = await normalizeTrace(baseRaw(), { ...input, labelCountry: "bangladesh" });
  if (!r.ok) throw new Error("expected ok");
  const bd = r.product.route.find((s) => s.country === "Bangladesh")!;
  const au = r.product.route.find((s) => s.country === "Australia")!;
  assertEquals(bd.basis, "Read from label");
  assertEquals(bd.confidence, "high");
  assertEquals(au.basis, "Estimated");
});

Deno.test("invalid coordinates are dropped", async () => {
  const raw = baseRaw();
  raw.route.push({ stage: "Bad", country: "Nowhere", code: "XX", lat: 200, lng: 0, note: "", basis: "Estimated", confidence: "low" });
  raw.route.push({ stage: "NoCountry", country: "", code: "ZZ", lat: 0, lng: 0, note: "", basis: "Estimated", confidence: "low" });
  const r = await normalizeTrace(raw, input);
  if (!r.ok) throw new Error("expected ok");
  assertEquals(r.product.route.length, 2);
});

Deno.test("traceable:false -> not_traceable", async () => {
  const r = await normalizeTrace(baseRaw({ traceable: false }), input);
  assertEquals(r.ok, false);
  assertEquals((r as any).reason, "not_traceable");
});

Deno.test("empty route -> bad_output", async () => {
  const r = await normalizeTrace(baseRaw({ route: [] }), input);
  assertEquals(r.ok, false);
  assertEquals((r as any).reason, "bad_output");
});

Deno.test("transparentAlternative mids sum to 100", async () => {
  const r = await normalizeTrace(baseRaw(), input);
  if (!r.ok) throw new Error("expected ok");
  const sum = Object.values(r.product.transparentAlternative.split).reduce((a: number, s: any) => a + s.pct.mid, 0);
  assertAlmostEquals(sum, 100, 1e-9);
});

Deno.test("haversineKm sanity: London->Singapore ~10800km", () => {
  const d = haversineKm({ lat: 51.5, lng: -0.12 }, { lat: 1.35, lng: 103.8 });
  assertEquals(d > 10000 && d < 11500, true);
});
