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

### The bugs, and what they now do

| Before | Now |
|---|---|
| The client sent `user_id`, which was `savedScanId \|\| "guest"` — so **everybody** was `"guest"`. The winner's claim address was derived from it, meaning every winner shared one demo address whose private key lives in the backend. **Nobody could ever claim the pot.** | Identity is resolved **server-side** from the caller's auth (`base44.auth.me()`). A signed-out visitor gets a browser-local anonymous id, is recorded in the field, and is **not eligible for the pot** — because the pot has to be claimable by a real person. |
| The UI compared `winner.user_id === (savedScanId \|\| "guest")` to decide whether you won. With no `savedScanId` that was `"guest" === "guest"` — **you were told you won whenever anybody won.** With a `savedScanId` you were told you lost even when you won. | The server computes `settlement.you_won` against the authenticated caller and returns that. The client never works out its own position. |
| `product_id` was `savedScanId \|\| product.id`, so the pool was global per product on a first reveal and a **private bucket** on every one after it. | The pool is scoped to the **product**. Every trace of the same hoodie lands in the same field, so the field actually accumulates. |
| There was no claim action at all — a winner got a string saying `pool won · 10 XLM claimable` and nothing to press. | `action: "claim"` submits a real `claimClaimableBalance` operation, signed by the winner's own derived key, from the winner's own address. The transaction is on the ledger and has an explorer link. |

### Other changes

- **One belief per person.** `latestPerUser` keeps only each person's most recent guess. Guessing again before the reveal is allowed — changing your mind is the point — but it stops one person hedging the pot by holding several entries at once.
- **The pot moves.** If a closer guess arrives after a settlement, the next reveal re-settles and the previous winner's claim is voided, so only one pot is ever live.
- **The field is cumulative.** The distribution includes every guess ever made on the product, not just the current round. That is the "human priors vs. estimates" dataset the submission talks about.
- **The winner's identity is never returned.** `resolve` sends `you_won: boolean` instead of a `user_id`.

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

## Tests

- `base44/shared/guess.test.ts` — the field maths: bucketing, median, one-belief-per-person, and where-you-stand. Pure, so it runs without a Stellar connection.
- `src/lib/corroboration.test.ts` — the agreement logic, including that sample entries don't count as people.

Run with `deno test base44/shared/ src/lib/`.
