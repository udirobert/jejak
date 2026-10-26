// The lifecycle of a question the user handed off to a brand.
//
// Pure on purpose: the clock is passed in rather than read, so the same
// record always renders the same state and the journal can be reasoned about
// (and tested) without a running app.
//
// Stored status is deliberately coarse — drafted | sent | replied |
// escalated | closed. Everything else ("awaiting reply", "no reply in 14
// days") is derived from the clock, so it ages on its own without a cron
// writing to the database.

export const REMIND_DAYS = 14;
const DAY_MS = 86400000;

// The rail a delegated letter moves along. `replied` and `closed` are
// terminal and sit past the end of it.
export const DELEGATION_STAGES = ["drafted", "sent", "escalated"];

export function parseDate(value) {
  if (value == null || value === "") return null;
  const t = typeof value === "number" ? value : Date.parse(value);
  return Number.isNaN(t) ? null : t;
}

export function daysSince(value, now = Date.now()) {
  const t = parseDate(value);
  if (t == null) return null;
  return Math.max(0, Math.floor((now - t) / DAY_MS));
}

export function daysUntil(value, now = Date.now()) {
  const t = parseDate(value);
  if (t == null) return null;
  return Math.ceil((t - now) / DAY_MS);
}

export function formatDay(value) {
  const t = parseDate(value);
  if (t == null) return null;
  return new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/**
 * The derived state of one delegated letter.
 *
 * @param {Record<string, unknown> | null} rec
 * @param {number} now
 * @returns {{
 *   key: string,
 *   stage: number,
 *   label: string,
 *   detail: string,
 *   days: number | null,
 *   canNudge: boolean,
 * } | null}
 */
export function delegationState(rec, now = Date.now()) {
  if (!rec) return null;

  const status = rec.status || "drafted";
  const sentAt = parseDate(rec.sent_at);
  const remindAt = parseDate(rec.remind_at);
  const days = sentAt == null ? null : Math.max(0, Math.floor((now - sentAt) / DAY_MS));

  if (status === "replied") {
    return {
      key: "replied",
      stage: 3,
      label: "they replied",
      detail: (rec.reply_note || "").trim() || "They answered — open the letter in your inbox.",
      days,
      canNudge: false,
    };
  }

  if (status === "closed") {
    return { key: "closed", stage: 3, label: "closed", detail: "You closed this one.", days, canNudge: false };
  }

  if (status === "escalated") {
    return {
      key: "escalated",
      stage: 2,
      label: "escalated",
      detail: "You sent a follow-up. Still no answer.",
      days,
      canNudge: false,
    };
  }

  if (status === "drafted") {
    return {
      key: "drafted",
      stage: 0,
      label: "drafted",
      detail: "Ready when you are — you keep the send button.",
      days,
      canNudge: false,
    };
  }

  // status === "sent" from here on.
  if (rec.reminded) {
    return {
      key: "flagged",
      stage: 2,
      label: "flagged",
      detail: days != null ? `I flagged this on day ${days}. Nothing back yet.` : "I flagged this. Nothing back yet.",
      days,
      canNudge: true,
    };
  }

  if (remindAt != null && now >= remindAt) {
    return {
      key: "overdue",
      stage: 1,
      label: "no reply",
      detail: days != null ? `No reply in ${days} days. A nudge is fair.` : "No reply yet. A nudge is fair.",
      days,
      canNudge: true,
    };
  }

  const left = daysUntil(remindAt, now);
  return {
    key: "awaiting",
    stage: 1,
    label: "awaiting reply",
    detail:
      left == null
        ? "No reply yet."
        : `No reply yet — I check again in ${left} day${left === 1 ? "" : "s"}.`,
    days,
    canNudge: false,
  };
}

// A short, decent follow-up. The app drafts it; the user sends it. Nothing
// here emails a brand on the user's behalf.
export function nudgeDraft(rec) {
  const brand = (rec?.brand || "the brand").trim() || "the brand";
  const product = (rec?.product_name || "your product").trim() || "your product";
  const sentOn = formatDay(rec?.sent_at) || "earlier";
  const subject = `Following up: ${rec?.subject || "a transparency question"}`;
  const body = `Hello,

I wrote to you on ${sentOn} about the ${product} I bought (${brand}). I haven't heard back.

I'm not asking for anything beyond what was on the label: where it was made, and who made it. If there's a published disclosure I can point to instead, that would work just as well.

Thanks,
`;
  return { subject, body };
}
