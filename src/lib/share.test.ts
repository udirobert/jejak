import { assertEquals, assertStringIncludes } from "jsr:@std/assert";
import { APP_URL, traceUrl, tracePath, poolUrl, poolPath } from "./share.js";

Deno.test("traceUrl — a shared link points at the trace, not the app root", () => {
  const url = traceUrl("scn_abc123");
  assertEquals(url, `${APP_URL}/t/scn_abc123`);
  assertStringIncludes(url, "/t/");
});

Deno.test("traceUrl — no scan falls back to the app", () => {
  assertEquals(traceUrl(null), APP_URL);
  assertEquals(traceUrl(""), APP_URL);
  assertEquals(traceUrl(undefined), APP_URL);
});

Deno.test("tracePath — the in-app route mirrors the public one", () => {
  assertEquals(tracePath("scn_abc123"), "/t/scn_abc123");
  assertEquals(tracePath(null), "/trace");
});

Deno.test("traceUrl — the link is short enough for a text message", () => {
  // The whole point of /t/ is that it survives being pasted into a chat.
  assertEquals(traceUrl("scn_abc123").length < APP_URL.length + 20, true);
});

Deno.test("poolUrl — a guess-first pool shares the room, not the app", () => {
  assertEquals(poolUrl("6110"), `${APP_URL}/pool/6110`);
  assertStringIncludes(poolUrl("6110"), "/pool/");
  assertEquals(poolUrl(null), APP_URL);
});

Deno.test("poolPath — the route mirrors the shared one", () => {
  assertEquals(poolPath("6110"), "/pool/6110");
  assertEquals(poolPath("090111"), "/pool/090111");
  assertEquals(poolPath(null), "/trace");
});
