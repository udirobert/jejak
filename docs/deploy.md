# Deploy and verify

> **Read this before the demo.** Everything in the repo is live-code; nothing is deployed until you run the commands below.

**Live app:** https://jejak.base44.app
**Base44 app id:** `6ace77fd3de4615d81326900`
**Function endpoint:** `POST https://app.base44.app/api/apps/6ace77fd3de4615d81326900/functions/<name>`

You can call a function directly with curl to check what is deployed — that's how the current state was verified:

```bash
curl -s -X POST "https://app.base44.app/api/apps/6ace77fd3de4615d81326900/functions/guessPool" \
  -H "Content-Type: application/json" \
  -d '{"action":"pool_state","product_id":"6110"}'
```

---

## 1 · Deploy

```bash
base44 login          # the account that owns the app
base44 link           # link the existing project
base44 deploy         # entities + functions + site
```

### What changed and what to watch

| Change | What to check after deploying |
|---|---|
| **`guessPool` rewritten** | The deployed function's code should now contain `isFieldPublic`, `callerId` and `canonicalLabourPct`. **It has no `function.jsonc`** — neither do `identifyProduct` or the two Stellar functions. All four were created through the dashboard, so deploy may skip them. If the wager behaves like the old one, this is why. Check the function's updated timestamp, or curl `pool_state` and look for `revealed` in the response. |
| **Pools are now keyed by HS code** | `product_id` is `6110` / `6404` / `090111` / `392690`, not `hoodie`. The old `hoodie` pool is orphaned; the new ones start empty. Anyone who traced before this deploy is in the old pool and won't see the new one. |
| **`Guess` entity** | Gained `owner_id`, `eligible`, `pot_xlm`, `sponsored`, `product_name`, `claim_balance_id`, `claim_tx`, `claim_explorer`, and an **RLS block**. Existing guess rows have no `owner_id`, so they're now invisible to their owners. They're stale demo rows; the backend reads them with the service role, so they may still appear in the field. |
| **`BrandRequest` entity** | Enum gained `escalated`. Widening an enum is safe. |
| **`base44/shared/guess.ts`** | New, imported by `guessPool`. `draftBrandLetter` already imports `../../shared/prompts.ts` the same way, so relative imports outside the function directory do bundle — but confirm. |
| **New route `/t/:scanId`** | Frontend only. No deploy concern beyond the site build. |
| **The share host** | Now read from `window.location.origin` at runtime. If a shared link still points at `jejak-trace-flow.base44.app`, the site build didn't pick up the change. |

### If deploy skips `guessPool`

Create the function from the dashboard pointed at `base44/functions/guessPool/entry.ts`, or add a `function.jsonc` next to it:

```jsonc
{
  "name": "guessPool",
  "entry": "entry.ts"
}
```

then re-deploy and check the timestamp again.

---

## 2 · Test the wager on testnet

**This is the least-tested path in the app.** The claim in particular has never executed.

Two windows, because every interesting state needs a field of at least two people:

- **Window A** — main browser.
- **Window B** — a private/incognito window (a different browser id).

Competing needs no sign-up, so signed-out windows work fine. If you want to test the account-bound path too, sign in on one of them.

### 2.1 — Commit and reveal

1. Window A: `/trace` → Hoodie → journey → money screen.
2. Slide the guess to **12%** → **Reveal the split**.

**Expect:**
- *"Your guess went into the ledger first · sha:…"* with a working explorer link.
- The field axis appears with your vermilion diamond at 12%.
- *"You're the first to guess this one."*

**Check the ledger:** open the commit transaction. It should be a payment operation with a `Memo.hash` (type `hash`, 32 bytes) — that's the guess hash. Note the ledger number; the settle transaction must be **later**.

### 2.2 — A second person

3. Account B (or a private window with a **different** browser id): same flow, same product, guess **9%** → Reveal.

**Expect:**
- The field now has two marks.
- *"1 of 2 guessed higher than you"* (A's guess, at 12%, is above B's 9%).
- The pot now settles, because a pool of one doesn't. The closest guess wins. Against the category's estimate for HS 6110 (**2%**), B at 9% is 7 points off and A at 12% is 10 points off — **B wins**.

**Careful:** A's first guess was 12% and B's is 9%. Against the category's actual of 2%, **B is closer**. So after B reveals, the pot should move to B. That's the re-settlement path — watch it.

**Note:** a signed-out guesser competes too, bound to a browser-local id. You can test the whole thing in two private windows without signing in at all.

### 2.3 — Claim

4. On the winning window: **Claim the 10 XLM**.

**Expect:**
- A new transaction on stellar.expert: a `claimClaimableBalance` operation, sourced from the claimant address, with the memo `JEJAK-CLAIM:…`.
- The balance is released to that address.

**This is the step most likely to fail.** If it does:

| Symptom | Likely cause |
|---|---|
| `RELAYER_FAILURE` / 502 | The relayer couldn't reach testnet. Retry. |
| `nothing_to_claim` | `claim_balance_id` wasn't captured from the operation result, or the winner's row wasn't updated. Check the `Guess` record: `claim_balance_id` should be a 72-character hex string. |
| "bad_guess" / a 400 | The request shape is wrong — check `product_id` matches the one used at commit time. **It's now the HS code** (`6110`, `6404`, `090111`, `392690`), not the product id. |
| The pot never settles | Only one person has guessed. A pool of one doesn't settle — by design. Have a second person guess. |
| "the first one" in the pool | Everyone's guesses are anonymous because they were made signed out. The *count* still works; only the pot's claim needs the matching browser id. |

### 2.4 — The published field

5. Window A: `/atlas` → the Hoodie row.

**Expect:** *"2 of 2 got…"* or *"2 traced this · 2 different origins"*, and the pool count.

### 2.5 — The privacy rule

6. In a signed-out private window, open the app and query the entity directly:

```js
await base44.entities.Guess.filter({}, "-created_date", 10)
```

**Expect:** an empty list or a rejection. The `Guess` entity has owner-only RLS, so a signed-out visitor cannot read anyone's guesses. If this returns rows, the RLS block didn't apply and the whole "we never attribute a belief to a person" rule is broken — fix it before the demo.

---

## 3 · Quick visual QA

Screens that changed and have not been re-checked end to end against a live backend:

- **Money screen** — the wager panel, the field axis, the claim button.
- **Atlas** — the corroboration line on each row, and "trace one like this".
- **A shared trace** — publish a trace, copy `/t/<scanId>`, open it in a signed-out window. It should render, show the corroboration line and the pool count, and the private/not-found states should work.
- **Journal** — observations, the "On my desk" section, and the delegated-letter cards.

---

## 4 · If something is wrong and you have to choose

| If | Then |
|---|---|
| The claim is broken | Ship anyway — the commit and the field are the story. Say the pot is sponsored and that the claim path is being finished. |
| The wager's commit is broken | Hide the wager panel rather than show it failing. The trace, the split and the label are still the product. |
| The backend is down entirely | The app still works locally. The proof drawer falls back to a cached verified transaction and says so. |
| The field has one person | Say it: *"You're the first to guess this one."* It's honest and it's a reason for the next person to join. |
