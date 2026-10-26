// Pure helpers for the wager's field maths.
//
// Kept out of the function so they can be tested without a Stellar
// connection, and so the same definitions are used by the backend that
// settles the pool and by anything that needs to explain it.

export const MIN_PCT = 1;
export const MAX_PCT = 40;
export const BUCKET_PCT = 2;

// The canonical maker-share estimate for each category we have a curated
// product for, keyed by HS code.
//
// The pool is keyed by category, not by product instance: two people who
// photograph the same jacket must land in the same pool, and they only do
// if the key is the category. And because everyone in a pool is compared
// against the SAME truth, the truth has to be the category's estimate rather
// than whichever person's trace happened to resolve it.
//
// Kept here rather than imported from src/data so the deployed function
// doesn't have to pull the whole catalogue in; `guess.test.ts` asserts this
// table still matches src/data, so the two can't drift.
export const CATEGORY_LABOUR_MID: Record<string, number> = {
  "6110": 2,
  "6404": 4,
  "090111": 7,
  "392690": 4,
};

// The pool a product belongs to.
export function poolKeyFor(hs: string | null | undefined, productId: string | null | undefined) {
  return hs || productId || "unknown";
}

// The truth a pool is settled against: the category's estimate when we have
// one, otherwise whatever the resolver's own trace says.
export function canonicalLabourPct(poolKey: string, fallback: number) {
  const v = CATEGORY_LABOUR_MID[poolKey];
  return typeof v === "number" ? v : fallback;
}

// A guess is bucketed so the distribution can be shown without attributing
// any individual belief to a person. Two-percentage-point buckets over 1..40.
export function histogram(values: number[], bucket: number = BUCKET_PCT) {
  const counts = new Map<number, number>();
  for (const v of values) {
    const n = Number(v);
    if (!isFinite(n)) continue;
    const b = Math.min(MAX_PCT, Math.max(MIN_PCT, Math.ceil(n / bucket) * bucket));
    counts.set(b, (counts.get(b) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([pct, count]) => ({ pct, count }))
    .sort((a, b) => a.pct - b.pct);
}

export function median(values: number[]) {
  const v = values.filter((n) => isFinite(n)).sort((a, b) => a - b);
  if (!v.length) return null;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : Math.round(((v[mid - 1] + v[mid]) / 2) * 10) / 10;
}

// One belief per person: if someone guessed twice, their latest guess is the
// one that counts. Guessing again before the reveal is allowed — changing
// your mind is the point — but it must not let one person hedge the pot by
// holding several entries at once.
export function latestPerUser<T extends { user_id?: string; created_date?: string }>(
  guesses: T[]
): T[] {
  const byUser = new Map<string, T>();
  for (const g of guesses) {
    const key = g.user_id || "anon";
    const prev = byUser.get(key);
    const t = Date.parse(g.created_date || "") || 0;
    const pt = prev ? Date.parse(prev.created_date || "") || 0 : -1;
    if (!prev || t >= pt) byUser.set(key, g);
  }
  return Array.from(byUser.values());
}

// Whether the field's distribution may be shown publicly yet.
//
// The count of guessers is always safe. The distribution is not: before the
// product has been revealed, showing it would let a guesser copy the crowd —
// which is precisely what committing the hash before the reveal prevents.
// So the distribution unlocks only once a guess has actually been settled.
export function isFieldPublic(guesses: Array<{ status?: string }>) {
  return guesses.some((g) => g?.status === "won" || g?.status === "lost");
}

// Where the caller stands in the field. Computed here rather than in the UI
// so the client is never trusted to work out its own position.
export function standing(guesses: number[], yourPct: number | null) {
  if (yourPct == null || !isFinite(yourPct)) {
    return { rank: null, guessedHigher: null, fieldSize: guesses.length };
  }
  const eligible = guesses.filter((n) => isFinite(n));
  const sorted = [...eligible].sort((a, b) => a - b);
  const rank = sorted.findIndex((n) => Math.abs(n - yourPct) < 1e-9) + 1;
  return {
    rank: rank > 0 ? rank : null,
    guessedHigher: eligible.filter((n) => n > yourPct).length,
    fieldSize: eligible.length,
  };
}
