import { assertEquals, assertStringIncludes } from "jsr:@std/assert";
import { delegationState, nudgeDraft, daysSince, REMIND_DAYS } from "./delegation.js";
import { deriveObservations, openThreadSummary } from "./observations.js";

const DAY = 86400000;
const NOW = Date.parse("2026-03-20T12:00:00.000Z");

const letter = (over: Record<string, unknown> = {}) => ({
  id: "br_1",
  brand: "Uniqlo",
  product_name: "Everyday Hoodie",
  subject: "Where was this made?",
  body: "…",
  questions: [],
  status: "drafted",
  ...over,
});

// delegationState returns null only for a null record; every real letter has
// a state, so the helper unwraps it for the assertions below.
const state = (rec: Record<string, unknown>, now = NOW) => {
  const s = delegationState(rec, now);
  if (!s) throw new Error("expected a delegation state");
  return s;
};

Deno.test("delegationState — a drafted letter is waiting on the user", () => {
  const s = state(letter());
  assertEquals(s.key, "drafted");
  assertEquals(s.stage, 0);
  assertEquals(s.canNudge, false);
});

Deno.test("delegationState — a sent letter is awaiting a reply", () => {
  const s = state(
    letter({
      status: "sent",
      sent_at: new Date(NOW - 3 * DAY).toISOString(),
      remind_at: new Date(NOW + 11 * DAY).toISOString(),
    })
  );
  assertEquals(s.key, "awaiting");
  assertEquals(s.stage, 1);
  assertEquals(s.days, 3);
  assertEquals(s.canNudge, false);
  assertStringIncludes(s.detail, "11 days");
});

Deno.test("delegationState — past the reminder date it is overdue", () => {
  const s = state(
    letter({
      status: "sent",
      sent_at: new Date(NOW - 16 * DAY).toISOString(),
      remind_at: new Date(NOW - 2 * DAY).toISOString(),
    })
  );
  assertEquals(s.key, "overdue");
  assertEquals(s.canNudge, true);
  assertStringIncludes(s.detail, "16 days");
});

Deno.test("delegationState — a reminded letter is flagged, not merely waiting", () => {
  const s = state(
    letter({
      status: "sent",
      sent_at: new Date(NOW - 20 * DAY).toISOString(),
      remind_at: new Date(NOW - 6 * DAY).toISOString(),
      reminded: true,
    })
  );
  assertEquals(s.key, "flagged");
  assertEquals(s.stage, 2);
  assertEquals(s.canNudge, true);
});

Deno.test("delegationState — a reply and a closure are terminal", () => {
  const replied = state(letter({ status: "replied", reply_note: "They said Bangladesh." }));
  assertEquals(replied.key, "replied");
  assertEquals(replied.detail, "They said Bangladesh.");
  assertEquals(replied.canNudge, false);

  const closed = state(letter({ status: "closed" }));
  assertEquals(closed.key, "closed");
  assertEquals(closed.canNudge, false);
});

Deno.test("delegationState — an escalated letter says so", () => {
  const s = state(letter({ status: "escalated", sent_at: new Date(NOW - 30 * DAY).toISOString() }));
  assertEquals(s.key, "escalated");
  assertEquals(s.stage, 2);
});

Deno.test("nudgeDraft — the follow-up names the brand and the item", () => {
  const d = nudgeDraft(letter({ status: "sent", sent_at: new Date(NOW - 20 * DAY).toISOString() }));
  assertStringIncludes(d.subject, "Where was this made?");
  assertStringIncludes(d.body, "Uniqlo");
  assertStringIncludes(d.body, "Everyday Hoodie");
  assertStringIncludes(d.body, "28 Feb");
});

Deno.test("daysSince — clamps to zero and tolerates junk", () => {
  assertEquals(daysSince(new Date(NOW - 5 * DAY).toISOString(), NOW), 5);
  assertEquals(daysSince(new Date(NOW + 5 * DAY).toISOString(), NOW), 0);
  assertEquals(daysSince("not a date", NOW), null);
  assertEquals(daysSince(null, NOW), null);
});

Deno.test("REMIND_DAYS is two weeks", () => {
  assertEquals(REMIND_DAYS, 14);
});

Deno.test("deriveObservations — two items from one country are noticed", () => {
  const out = deriveObservations({
    scans: [
      { id: "s1", origin: "Bangladesh", product_name: "Everyday Hoodie" },
      { id: "s2", origin: "Bangladesh", product_name: "Trainers" },
      { id: "s3", origin: "Vietnam", product_name: "Trainers" },
    ],
    letters: [],
    now: NOW,
  });
  const origin = out.find((o) => o.id === "origin:Bangladesh");
  assertEquals(origin?.title, "Two of your items came from Bangladesh.");
});

Deno.test("deriveObservations — a single origin is not an observation", () => {
  const out = deriveObservations({
    scans: [{ id: "s1", origin: "Bangladesh" }],
    letters: [],
    now: NOW,
  });
  assertEquals(out.filter((o) => o.id.startsWith("origin:")).length, 0);
});

Deno.test("deriveObservations — a silent brand becomes a stalled thread", () => {
  const out = deriveObservations({
    scans: [],
    letters: [
      letter({
        id: "br_9",
        status: "sent",
        sent_at: new Date(NOW - 30 * DAY).toISOString(),
        remind_at: new Date(NOW - 16 * DAY).toISOString(),
      }),
    ],
    now: NOW,
  });
  const stalled = out.find((o) => o.id === "stalled:br_9");
  assertEquals(stalled?.action?.kind, "nudge");
  assertStringIncludes(stalled?.title || "", "Uniqlo");
});

Deno.test("deriveObservations — a draft that never went out is surfaced", () => {
  const out = deriveObservations({ scans: [], letters: [letter({ id: "br_2" })], now: NOW });
  const unsent = out.find((o) => o.id === "unsent:br_2");
  assertEquals(unsent?.action?.kind, "send");
});

Deno.test("deriveObservations — traces without a label get called out", () => {
  const out = deriveObservations({
    scans: [
      { id: "s1", origin: "Bangladesh", label_country: "" },
      { id: "s2", origin: "Vietnam", label_country: "" },
    ],
    letters: [],
    now: NOW,
  });
  assertEquals(out.some((o) => o.id === "no-labels"), true);
});

Deno.test("deriveObservations — a labelled trace is not called out", () => {
  const out = deriveObservations({
    scans: [
      { id: "s1", origin: "Bangladesh", label_country: "Bangladesh" },
      { id: "s2", origin: "Vietnam", label_country: "Vietnam" },
    ],
    letters: [],
    now: NOW,
  });
  assertEquals(out.some((o) => o.id === "no-labels"), false);
});

Deno.test("deriveObservations — the same brand twice gets one letter, not two", () => {
  const out = deriveObservations({
    scans: [
      { id: "s1", brand: "Uniqlo", origin: "Bangladesh" },
      { id: "s2", brand: "Uniqlo", origin: "Vietnam" },
    ],
    letters: [],
    now: NOW,
  });
  const brand = out.find((o) => o.id === "brand:Uniqlo");
  assertEquals(brand?.title, "Two of your items are Uniqlo.");
});

Deno.test("deriveObservations — nothing to notice means no observations", () => {
  const out = deriveObservations({ scans: [], letters: [], now: NOW });
  assertEquals(out.length, 0);
});

Deno.test("openThreadSummary — counts what is open and what came back", () => {
  const s = openThreadSummary(
    [
      letter({
        id: "a",
        status: "sent",
        sent_at: new Date(NOW - 2 * DAY).toISOString(),
        remind_at: new Date(NOW + 12 * DAY).toISOString(),
      }),
      letter({ id: "b", status: "replied" }),
    ],
    NOW
  );
  assertEquals(s, "1 letter open · 1 reply in");
  assertEquals(openThreadSummary([], NOW), null);
});
