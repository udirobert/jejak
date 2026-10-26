import { assertEquals } from "jsr:@std/assert";
import { histogram, median, latestPerUser, standing } from "./guess.ts";

Deno.test("histogram — guesses are bucketed into 2% bands", () => {
  // 7% rounds up into the 8% band.
  assertEquals(histogram([4, 6, 7, 8, 8]), [
    { pct: 4, count: 1 },
    { pct: 6, count: 1 },
    { pct: 8, count: 3 },
  ]);
});

Deno.test("histogram — the top band is capped at the axis maximum", () => {
  const h = histogram([41, 40]);
  assertEquals(h, [{ pct: 40, count: 2 }]);
});

Deno.test("histogram — the bottom band is capped at the axis minimum", () => {
  assertEquals(histogram([0, 1]), [
    { pct: 1, count: 1 },
    { pct: 2, count: 1 },
  ]);
});

Deno.test("histogram — junk is dropped, not counted", () => {
  assertEquals(histogram([Number.NaN, 10]), [{ pct: 10, count: 1 }]);
});

Deno.test("median — odd and even counts", () => {
  assertEquals(median([9, 11, 15]), 11);
  assertEquals(median([8, 10, 12, 20]), 11);
  assertEquals(median([]), null);
});

Deno.test("latestPerUser — one belief per person, the latest wins", () => {
  const out = latestPerUser([
    { user_id: "a", guess_pct: 5, created_date: "2026-03-01T00:00:00Z" },
    { user_id: "a", guess_pct: 9, created_date: "2026-03-09T00:00:00Z" },
    { user_id: "b", guess_pct: 3, created_date: "2026-03-05T00:00:00Z" },
  ] as any[]);
  assertEquals(out.length, 2);
  const a = out.find((g: any) => g.user_id === "a");
  assertEquals(a?.guess_pct, 9);
});

Deno.test("latestPerUser — two people guessing twice is still two beliefs", () => {
  const out = latestPerUser([
    { user_id: "a", guess_pct: 5, created_date: "2026-03-01T00:00:00Z" },
    { user_id: "a", guess_pct: 9, created_date: "2026-03-09T00:00:00Z" },
    { user_id: "b", guess_pct: 3, created_date: "2026-03-05T00:00:00Z" },
    { user_id: "b", guess_pct: 7, created_date: "2026-03-07T00:00:00Z" },
  ] as any[]);
  assertEquals(out.length, 2);
  assertEquals(out.find((g: any) => g.user_id === "b")?.guess_pct, 7);
});

Deno.test("latestPerUser — a guess with no user id is still one belief", () => {
  const out = latestPerUser([
    { guess_pct: 5, created_date: "2026-03-01T00:00:00Z" },
    { guess_pct: 9, created_date: "2026-03-09T00:00:00Z" },
  ] as any[]);
  assertEquals(out.length, 1);
  assertEquals(out[0].guess_pct, 9);
});

Deno.test("standing — your rank and how many guessed higher", () => {
  const s = standing([4, 6, 8, 8, 12, 20], 8);
  assertEquals(s.rank, 3);
  assertEquals(s.guessedHigher, 2);
  assertEquals(s.fieldSize, 6);
});

Deno.test("standing — no guess means no standing", () => {
  assertEquals(standing([4, 6], null), { rank: null, guessedHigher: null, fieldSize: 2 });
});

Deno.test("standing — a guess you did not make has no rank", () => {
  assertEquals(standing([4, 6], 99).rank, null);
});
