# The social layer

> **The brief:** people love the social parts of this app. Do they exist?
>
> **The honest answer, before this pass:** mostly not. Jejak had a *broadcast* model — you published an anonymised trace to a shared map — and no *interaction* model. There was no way to see other people, no way to compare yourself to anyone, no way for money to move between people. The wager existed as a backend with a broken win-detection check and no visible field of opponents.
>
> This document is the spec for the social layer as it now stands, and — just as importantly — where it deliberately stops.

---

## 0. The line we don't cross

The product's credibility rests on saying what is true. Three rules constrain every social feature:

1. **We never attribute a belief to a person.** You see the shape of what people thought. You never see who thought what. The commit-reveal pattern guarantees the *timing* of the reveal; we choose separately that the *attribution* stays private.
2. **We never say you staked anything.** The pot is sponsored by Jejak. No XLM of the guesser's is locked, so the words "stake" and "your XLM" would be a lie. The data says so too: `pot_xlm`, `sponsored: true`.
3. **A count of one points at somebody.** So the Atlas says "the first one" rather than "1 live".

Everything below follows from those.

---

## 1 · The wager, made correct

`base44/functions/guessPool/entry.ts` · `base44/entities/Guess.jsonc`

The wager is the only place in the app where money moves and a hash commits, so it had to be the first place we made honest. It had four real bugs.

### The three rules that make it a wager

**1 · The pool is keyed by category, not by product.** A pool is an HS code (`6110` — jumpers, sweatshirts & hoodies), not a product instance. This is the difference between a shared field and a private note: two people who photograph *the same jacket* get different AI-traced product ids, so keying by product would put them in different rooms. Keying by category puts them in the same one.

It also means everyone in a pool is compared against the **same truth** — the category's estimate (`CATEGORY_LABOUR_MID` in `base44/shared/guess.ts`) — rather than whichever person's trace happened to resolve the pool. The table is copied out of `src/data` so the deployed function doesn't have to pull the whole catalogue in; `guess.test.ts` asserts the copy still matches, so it can't drift.

**2 · A pool of one doesn't settle.** The pot opens when a second person guesses. Otherwise the first person through the door wins a contested-looking pot on their own, and the wager is really just a note to yourself. So a solo reveal says *"You're the only one in the pool. The pot opens when somebody else guesses"* — and offers a share button right there. Their guess stays committed, so the next reveal settles against everyone who's in it.

**3 · No sign-up is required to compete.** A signed-out visitor guesses with a browser-local anonymous id and counts toward the pot; they claim it by presenting that same id, which is the secret their claim is bound to. A signed-in guesser is bound to their account id instead. On mainnet both would be the passport wallet. Requiring an account to compete empties the field exactly where you want it full — a busy booth.

### Where your guess goes

```
your guess  ──▶  SHA-256 hash  ──▶  Memo.hash on the ledger  ──▶  revealed against the category
```

Committing before the reveal is what makes the guess honest: the hash is on the public ledger, so nobody — including the app — can move it afterwards. What it does **not** do is hide your identity from yourself: the record is yours, and RLS keeps it owner-only.

### Two more changes from the first pass

| Before | Now |
|---|---|
| The client sent `user_id`, which was `savedScanId \|\| "guest"` — so **everybody** was `"guest"`. The winner's claim address was derived from it, meaning every winner shared one demo address whose key lives in the backend. **Nobody could ever claim the pot.** | Identity is resolved **server-side** from the caller's auth, or from a browser-local anonymous id when signed out. The claim address is derived from that, and only the holder of the matching secret can claim. |
| The UI compared `winner.user_id === (savedScanId \|\| "guest")` to decide whether you won. With no `savedScanId` that was `"guest" === "guest"` — **you were told you won whenever anybody won.** With a `savedScanId` you were told you lost even when you won. | The server computes `settlement.you_won` against the authenticated caller and returns that. The client never works out its own position. |
| There was no claim action at all — a winner got a string saying `pool won · 10 XLM claimable` and nothing to press. | `action: "claim"` submits a real `claimClaimableBalance` operation, signed by the winner's own derived key, from the winner's own address. The transaction is on the ledger and has an explorer link. |

### Other changes

- **One belief per person.** `latestPerUser` keeps only each person's most recent guess. Guessing again before the reveal is allowed — changing your mind is the point — but it stops one person hedging the pot by holding several entries at once.
- **The pot moves.** If a closer guess arrives after a settlement, the next reveal re-settles and the previous winner's claim is voided, so only one pot is ever live.
- **The field is cumulative.** The distribution includes every guess ever made on the category, not just the current round. That is the "human priors vs. estimates" dataset the submission talks about.
- **The winner's identity is never returned.** `resolve` sends `you_won: boolean` instead of a `user_id`.
- **The distribution is locked until the reveal.** `pool_state` returns the *count* of guessers at any time — that's safe — but the distribution only once a guess has settled. Before that, showing it would let a guesser copy the crowd, which is exactly what the commit-then-reveal order prevents.

---

## 2 · Where you sit

`src/components/journal/GuessField.jsx` · `src/components/journal/WagerPanel.jsx`

The field of opponents is shown as a **hand-inked axis**, not a leaderboard:

```
 1        10        20        30        40%
 │░░░░░░░│──│──│─│  ─│─│──│      │  │
 │  ▲     ▌                    │
 you  │  my estimate           │
       actual
```

- One mark per person, stacked upward where they cluster, so nobody is hidden.
- **Your guess** is the vermilion diamond.
- **The app's estimate** is the faint band — a category-level range.
- **The real number**, once the pool settles, is the solid rule.

It reads left to right as: *here is what people believed, here is what the trade data thought, here is where you landed, and here is the truth.*

### Why not a leaderboard

A leaderboard ranks people. This shows **positions in a distribution**. The interesting fact isn't "Ana was first" — it's "9 of 14 people guessed higher than you, and the trade data said 2%". Those are different claims, and only one of them is worth making.

It also avoids the thing that kills social features in a product like this: nothing here needs moderation, nothing here can be gamed by spamming, and nothing here requires a user to have a public profile.

### The copy

The panel says where you stood, in plain sentences:

> *The closest was 7% — you were 5 points off.*
> *6 people guessed higher than you; the middle of the field was 11%.*

and, when you win:

> *10 XLM is waiting for you — a claimable balance, so it's yours to collect and nobody else's.*

with the honest footnote always present:

> *sponsored pot · no XLM of yours was staked*

---

## 3 · Corroboration, not rating

`src/components/explore/exploreUtils.js` → `corroboration()`, `corroborationLine()`

The original idea was "rate each other". That is a bad idea here: taste is low-signal, it needs moderation, and it invites noise. The good version of the same idea is **agreement**.

If seven people traced the same hoodie and five of them also got Bangladesh, that is worth more than any opinion, because it is the same conclusion reached independently. So the Atlas row says:

> *5 of 7 got Bangladesh*

or, when they don't agree:

> *7 traced this · 4 different origins*

Both are honest, both are automatic, and neither needs a user to click anything.

Each row also carries **"trace one like this"** — the social move is tracing the same thing.

Sample entries are excluded: seeded data is not a person.

---

## 4 · What still isn't social, on purpose

| Not built | Why |
|---|---|
| **User profiles, followers, comments, mentions** | A social graph needs moderation, moderation needs a team, and a traceability app has no reason to become a network. The Atlas and the wager are the whole social surface. |
| **Kudos tips to another person** | This is the one worth doing next, and it's genuinely hard: the pot is claimable by a *cause wallet*, never by a Jejak user. Making a user claimable means the passport has to be a claimant on a claimable balance, which the fee relayer can't do yet (it journals on the sponsor account). The Stellar primitives are right; the plumbing isn't. |
| **A visible balance or stake ledger** | There is no user balance screen. The claimable balance is the receipt. |
| **Free-text comments on a trace** | Everything the app knows is derived from the trace, so anything a person writes about someone else's trace needs moderation and attribution. Corroboration gets the value without the cost. |

---

## 5 · The maker payout is not a tip to a person

Worth being explicit, because it used to read like one: `GiveBackNote` and `MakerBridgeCard` send real testnet XLM, but the recipient is always one of four hardcoded **demo cause wallets** (`src/data/causes.json`). A Jejak user can never receive, and the escrow claimant is that same demo wallet.

The tip is also deliberately kept **out of the split**. `SupplyFlowPipe` is handed `makerTip={0}` on purpose: the split estimates where the *shelf price* went, and your extra £1 doesn't change that. Mixing them would make the estimate look better than it is. So the tip gets its own line — *"£1 sent to causes on this trace · separate from the split above"* — instead of quietly inflating the makers' share.

---

## 6 · What has been verified, and what hasn't

Checked against the deployed backend, not against the repo.

| | |
|---|---|
| **The deployed `guessPool` is the current one** | `POST /api/apps/6ace77fd3de4615d81326900/functions/guessPool` returns the new response shape. |
| **A guess reaches the ledger before the reveal** | Tx `61b78270e882612c2b3c7d9ebdc469a043bc867e5f06b1da59af0bbcb185ae36`, **ledger 5399535**, `memo_type: hash`. |
| **The reveal lock holds** | `pool_state` returns the guesser *count* at any time, but an empty *distribution* until a guess has settled. |
| **The win is computed server-side** | `resolve` returns `you_won`; the client never works out its own position. |
| **The claim has never executed** | It refuses correctly, but a successful claim is unproven. It is the only path in the app that moves money. |

The claim is the thing to test first. [`deploy.md`](./deploy.md) has the script and a table of what each failure symptom means.


---

## Tests

- `base44/shared/guess.test.ts` — the field maths: bucketing, median, one-belief-per-person, and where-you-stand. Pure, so it runs without a Stellar connection.
- `src/lib/corroboration.test.ts` — the agreement logic, including that sample entries don't count as people.

Run with `deno test base44/shared/ src/lib/`.
