// Unprompted observations.
//
// The journal already knows things the user never asked about: two items came
// from the same country, a letter nobody answered, a whole set of traces with
// no label in sight. These are derived from the journal's own records on every
// render, so an observation can never drift from what the app actually knows.
//
// Pure functions. `now` is passed in so the output is deterministic.

import { delegationState, formatDay } from "./delegation.js";

const monthYear = (value) => {
  const t = value ? Date.parse(value) : NaN;
  if (Number.isNaN(t)) return null;
  return new Date(t).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
};

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/**
 * The observations the journal can make about what the user has traced.
 *
 * Each one is a claim the app can actually back with a record — no invented
 * counts, no flattery. `weight` decides what surfaces first when there are
 * more than we want to show.
 *
 * @param {{
 *   scans?: Array<{
 *     id?: string,
 *     origin?: string,
 *     brand?: string,
 *     label_country?: string,
 *     product_name?: string,
 *     created_date?: string,
 *   }>,
 *   letters?: Array<Record<string, unknown>>,
 *   now?: number,
 * }} input
 * @returns {Array<{
 *   id: string,
 *   kicker: string,
 *   title: string,
 *   body: string,
 *   action: { kind: string, label: string, value: string | null } | null,
 *   weight: number,
 * }>}
 */
export function deriveObservations({ scans = [], letters = [], now = Date.now() } = {}) {
  const out = [];
  const entries = Array.isArray(scans) ? scans : [];
  const requests = Array.isArray(letters) ? letters : [];

  // 1. Two or more of the user's items share an origin country.
  const byOrigin = new Map();
  for (const s of entries) {
    const origin = (s?.origin || "").trim();
    if (!origin) continue;
    byOrigin.set(origin, (byOrigin.get(origin) || 0) + 1);
  }
  for (const [origin, n] of byOrigin) {
    if (n < 2) continue;
    out.push({
      id: `origin:${origin}`,
      kicker: "Same place, twice",
      title:
        n === 2
          ? `Two of your items came from ${origin}.`
          : `${n} of your items came from ${origin}.`,
      body:
        n === 2
          ? "Different brands, same factory country. Worth knowing before you read either one as an exception."
          : `That is ${Math.round((n / entries.length) * 100)}% of everything you've traced. It is the pattern, not the outlier.`,
      action: { kind: "filter", label: "Show those entries", value: origin },
      weight: 60 + n,
    });
  }

  // 2. The same brand twice — one letter covers both.
  const byBrand = new Map();
  for (const s of entries) {
    const brand = (s?.brand || "").trim();
    if (!brand) continue;
    byBrand.set(brand, (byBrand.get(brand) || 0) + 1);
  }
  for (const [brand, n] of byBrand) {
    if (n < 2) continue;
    out.push({
      id: `brand:${brand}`,
      kicker: "Same brand, twice",
      title: `Two of your items are ${brand}.`,
      body: "One letter covers both. Asking twice doesn't make them answer faster.",
      action: { kind: "ask", label: `Ask ${brand}`, value: brand },
      weight: 55 + n,
    });
  }

  // 3. A letter that nobody answered — the app is holding the thread.
  for (const rec of requests) {
    const state = delegationState(rec, now);
    if (!state) continue;
    if (state.key === "overdue" || state.key === "flagged") {
      const when = monthYear(rec.created_date);
      out.push({
        id: `stalled:${rec.id}`,
        kicker: "Waiting on them",
        title: `You asked ${rec.brand} about the ${rec.product_name}${when ? ` in ${when}` : ""}. They haven't answered.`,
        body:
          state.key === "flagged"
            ? "I flagged it for you. A short follow-up is fair — I'll draft it, you send it."
            : `No reply in ${state.days ?? "a while"} days. A short follow-up is fair — I'll draft it, you send it.`,
        action: { kind: "nudge", label: "Draft a nudge", value: rec.id },
        weight: 90 + (state.days || 0),
      });
    }
    if (state.key === "drafted") {
      out.push({
        id: `unsent:${rec.id}`,
        kicker: "Holding a draft",
        title: `A letter to ${rec.brand} is drafted and hasn't gone out.`,
        body: "It's ready. You keep the send button — I just wanted it not to sit there.",
        action: { kind: "send", label: "Open the letter", value: rec.id },
        weight: 50,
      });
    }
  }

  // 4. Plenty of traces, not one label. Labels are the only hard facts.
  const labelled = entries.filter((s) => (s?.label_country || "").trim()).length;
  if (entries.length >= 2 && labelled === 0) {
    out.push({
      id: "no-labels",
      kicker: "Still an estimate",
      title: `You've traced ${plural(entries.length, "item", "items")} and not one label.`,
      body: "Everything in your journal is a well-reasoned guess. A care tag is the one thing that turns my estimate into a fact.",
      action: { kind: "trace", label: "Trace one with a label", value: null },
      weight: 45,
    });
  }

  // 5. Traced a lot, asked nobody.
  const askedBrands = new Set(requests.map((r) => (r?.brand || "").trim().toLowerCase()).filter(Boolean));
  const tracedBrands = new Set(
    entries.map((s) => (s?.brand || "").trim().toLowerCase()).filter(Boolean)
  );
  if (entries.length >= 2 && tracedBrands.size >= 2 && askedBrands.size === 0) {
    out.push({
      id: "never-asked",
      kicker: "One question short",
      title: `You've traced ${plural(tracedBrands.size, "brand", "brands")} and never asked any of them anything.`,
      body: "The estimate is my best reasoning. Their answer would be a fact. I can draft the question.",
      action: { kind: "ask", label: "Ask one of them", value: null },
      weight: 40,
    });
  }

  return out.sort((a, b) => b.weight - a.weight);
}

/**
 * A one-line summary of what the journal is currently holding open.
 *
 * @param {Array<Record<string, unknown>>} letters
 * @param {number} now
 * @returns {string | null}
 */
export function openThreadSummary(letters = [], now = Date.now()) {
  const states = (letters || [])
    .map((rec) => delegationState(rec, now))
    .filter(Boolean);
  if (!states.length) return null;
  const waiting = states.filter((s) => s.key === "awaiting" || s.key === "overdue" || s.key === "flagged").length;
  const answered = states.filter((s) => s.key === "replied").length;
  if (!waiting && !answered) return null;
  const bits = [];
  if (waiting) bits.push(`${plural(waiting, "letter", "letters")} open`);
  if (answered) bits.push(`${plural(answered, "reply", "replies")} in`);
  return bits.join(" · ");
}

export { formatDay };
