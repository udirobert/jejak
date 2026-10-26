// Pure helpers for the wager's field maths.
//
// Kept out of the function so they can be tested without a Stellar
// connection, and so the same definitions are used by the backend that
// settles the pool and by anything that needs to explain it.

export const MIN_PCT = 1;
export const MAX_PCT = 40;
export const BUCKET_PCT = 2;

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
