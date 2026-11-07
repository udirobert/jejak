// The claim, executed end-to-end through the app's own function path.
//
// https://docs/deploy.md §2.3 is the manual two-window version of this runbook;
// this script is the same lifecycle without the windows, so it can be re-run
// after every deploy before a demo:
//
//   node scripts/test-wager-claim.mjs           # or: deno run -A scripts/test-wager-claim.mjs
//
// What it does, over the deployed function (the browser does nothing special
// here — this IS the app path):
//
//   1. commit  — two anonymous guesses, one close to the truth, one not
//   2. resolve — settle the pool; expect a claim_balance_id captured
//   3. claim   — the winner's anonymous id collects the pot on-ledger
//
// Verdict per step is printed. The claim step is the one that has historically
// failed; the symptom table in docs/deploy.md §2.3 explains each failure.
//
// Testnet only. The pot is sponsored; no real money moves. Rows marked
// "claim-verify" find their way into the field — that's the wager counting
// everyone, and worth more than a clean-looking empty field.

const APP = "6ace77fd3de4615d81326900";
const ENDPOINT = `https://app.base44.app/api/apps/${APP}/functions/guessPool`;
const PRODUCT = process.argv[2] || "6110";

const call = async (body) => {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
};

const stamp = `claim-verify-${Date.now().toString(36).slice(-6)}`;
const idA = `${stamp}-a`;
const idB = `${stamp}-b`;

console.log(`pool ${PRODUCT} · guessers ${idA} (3%) / ${idB} (11%)\n`);

// 1 · commit — a close guess wins, a worse guess makes the pot contested
const a = await call({ action: "commit", product_id: PRODUCT, guess_pct: 3, product_name: `claim verification · ${idA}`, anon_id: idA });
console.log(a.ok ? `commit A   ok   ledger ${a.ledger} · sha ${String(a.guess_hash).slice(0, 12)}…` : `commit A   FAIL ${JSON.stringify(a)}`);
if (!a.ok) process.exit(1);

const b = await call({ action: "commit", product_id: PRODUCT, guess_pct: 11, product_name: `claim verification · ${idB}`, anon_id: idB });
console.log(b.ok ? `commit B   ok   ledger ${b.ledger} · sha ${String(b.guess_hash).slice(0, 12)}…` : `commit B   FAIL ${JSON.stringify(b)}`);
if (!b.ok) process.exit(1);

// 2 · resolve — the pot settles to the closest guess (A, 1 point off 2%)
const r = await call({ action: "resolve", product_id: PRODUCT, labour_pct: 2 });
if (!r.ok) { console.log(`resolve     FAIL ${JSON.stringify(r)}`); process.exit(1); }
const s = r.settlement;
console.log(
  s
    ? `resolve     ok   field ${r.field_pcts.join(",")}% · truth ${r.actual_labour_pct}% · winner ${s.guess_pct}% · ${s.contested ? "contested" : "uncontested"}`
    : `resolve     WAIT the pot is still open (${r.eligible_count} eligible)`,
);
if (!s) process.exit(1);
console.log(`settle tx        ${s.settle_explorer}`);

// 3 · claim — THE step. A captured claim_balance_id makes this work; an empty
// one is the deploy.md §2.3 "capture" bug.
if (!s.claim_address) {
  console.log("claim        FAIL no claim address on the settlement");
  process.exit(1);
}
const c = await call({ action: "claim", product_id: PRODUCT, anon_id: idA });
console.log(c.ok
  ? `claim        ok   ${c.amount} ${c.currency} released · ${c.claim_explorer}`
  : `claim        FAIL ${c.reason || c.error} ← THE KNOWN FAILURE. See docs/deploy.md §2.3.`);

process.exit(c.ok ? 0 : 1);
