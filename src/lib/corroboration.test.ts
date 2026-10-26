import { assertEquals } from "jsr:@std/assert";
import { corroboration, corroborationLine } from "../components/explore/exploreUtils.js";

const scan = (over: Record<string, unknown> = {}) => ({
  id: "s1",
  product_id: "hoodie",
  origin: "Bangladesh",
  ...over,
});

Deno.test("corroboration — one person is a field of one, with nothing to say", () => {
  const c = corroboration([scan()]);
  assertEquals(c?.people, 1);
  assertEquals(c?.agreedOrigin, null);
  assertEquals(corroborationLine(c), "");
});

Deno.test("corroboration — sample entries do not count as people", () => {
  const c = corroboration([scan({ is_sample: true }), scan({ id: "s2", is_sample: true })]);
  assertEquals(c, null);
});

Deno.test("corroboration — agreement is reported, not a count of likes", () => {
  const c = corroboration([
    scan(),
    scan({ id: "s2" }),
    scan({ id: "s3", origin: "Vietnam" }),
  ]);
  assertEquals(c?.people, 3);
  assertEquals(c?.agreedOrigin, "Bangladesh");
  assertEquals(c?.agreedCount, 2);
  assertEquals(c?.distinctOrigins, 2);
});

Deno.test("corroboration — nobody agrees when every answer differs", () => {
  const c = corroboration([
    scan({ origin: "Bangladesh" }),
    scan({ id: "s2", origin: "Vietnam" }),
  ]);
  assertEquals(c?.agreedOrigin, null);
  assertEquals(c?.distinctOrigins, 2);
});

Deno.test("corroborationLine — nothing to say about one person", () => {
  assertEquals(corroborationLine(corroboration([scan()])), "");
});

Deno.test("corroborationLine — agreement, in plain words", () => {
  const c = corroboration([scan(), scan({ id: "s2" })]);
  assertEquals(corroborationLine(c), "2 of 2 got Bangladesh");
});

Deno.test("corroborationLine — disagreement is still worth saying", () => {
  const c = corroboration([scan({ origin: "Bangladesh" }), scan({ id: "s2", origin: "Vietnam" })]);
  assertEquals(corroborationLine(c), "2 traced this · 2 different origins");
});
