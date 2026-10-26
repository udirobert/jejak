# Jejak — HackMeridian (Stellar) submission plan

## Tracks

- **Builder:** Genesis (new project; Scale is invite/assignment only)
- **Thematic:** **Stellar Composed** — we compose ≥4 ecosystem primitives:
  OpenZeppelin Smart Account Kit (passkey/WebAuthn smart wallet, Protocol 27 deployments)
  + fee-sponsored relayer (`stellarFeeRelayer`)
  + CAP-23 claimable balances (stakes, tips, pot settlement)
  + provenance memo-anchoring (`stellarMakerPayout`, `jejak.provenance.v1` schema)

## Why Stellar (the argument, weak → strong)

1. **The pot can't be custodial.** CAP-23 claimable balances are a native protocol
   primitive: stakes sit on-ledger, the winner claims directly. Jejak never holds
   funds. A backend database cannot make that claim.
2. **Guesses are provably fair.** Guess → SHA-256 commit anchored onchain at
   guess-time → anyone re-hashes after reveal and confirms nothing was edited or
   reordered. "Provably fair" needs a public timestamped ledger; a DB can't do it.
3. **The user can't need a wallet.** Passkey smart account + fee-sponsored relayer
   = stake a guess in one tap, no seed phrase, no XLM balance, no gas. This is the
   Composed "wallets people want to use" brief almost verbatim.
4. **Domain novelty.** Prediction markets on Stellar exist (predictIQ, oracle-based
   price feeds). **Provenance-guess pools** do not: predictions on physical-product
   facts (maker share, origin) resolved by our trace + UN Comtrade — and the guess
   distribution itself becomes a dataset (human priors vs. estimates → model signal).
5. **Honest disclosures:** winner resolution is server-side in v1 (commits +
   settlement onchain; contract/oracle path documented as future work); testnet
   stakes are demo value; maker/brand identities are estimates, not verified humans.

## New feature: staked provenance guesses ("the wager") — BUILT + VERIFIED on testnet

Live: `base44/functions/guessPool` + `Guess` entity + MoneySplit stake wiring.
Verified 2026-10-26: two guesses committed (anchored onchain, e.g. tx
`3f90061a…` — payment op + Memo.hash), resolve ranked correctly (12% beat 9%
vs actual 11%), winner's claimable balance settled onchain (tx `cfe9f2b9…`,
ledger 5393274, memo `JEJAK-POOL:wager-te:WIN`).

Extends the existing guess-the-maker-share slider into a staked pool:

- **Commit:** guess locked → `SHA-256(guess + salt + product_id)` anchored via memo tx
  → returns commit hash + explorer link (reuses existing anchor path).
- **Stake:** XLM claimable balance created to the pool/winner claim key.
- **Reveal:** maker-share reveal as today → winner = closest guess (server-resolved v1,
  disclosed).
- **Settle:** claimable balance(s) paid to winner → explorer-visible settlement tx.
- **Dataset:** guess distribution stored with product_id for the human-prior signal.

### Backend changes

- `base44/functions/guessPool/entry.ts` — DONE: `commit` (anchor hash + create stake),
  `resolve` (reveal + rank + settle). Reuses deterministic keypair helpers from
  `stellarMakerPayout`; keep sponsor/stake accounts isolated like `stellarFeeRelayer`.
- `base44/entities/Guess.jsonc` — DONE: { product_id, guess_pct, commit_hash, commit_tx, stake_balance_id,
  user, status, reveal_error_pct }.
- Optional: `anchorProvenance` upgrade later — registry contract (see "future work").

### Frontend changes

- `MoneySplit.jsx` — DONE: reveal handler commits onchain + resolves pool;
  commit-hash + settle-tx links render under the receipt.
- Deferred to demo-polish: passkey-signed commit (backend key signs v1 — disclose),
  pool-state display, multi-guess UI.

### Demo beats (the Stellar video)

1. Passkey signs the stake — no wallet friction ("no seed phrase, no gas").
2. Commit hash lands on stellar.expert — the "it's real" moment.
3. Reveal → winner claims the pot — explorer-visible settlement.

## Video work (video/jejak-vid)

- New ego captures: passport/passkey sheet, stake+commit flow on the split screen,
  anchor explorer page, claim/settle tx.
- New `StellarCut` impl in `video/jejak-vid/src/lib.rs` (same Shot machinery):
  passport → stake/commit → explorer → settle → end card. ~30-45s.
- Optional new VO line about the wager layer, else mono labels carry it.

## The agentic layer — BUILT
The product stops handing over answers and starts showing its work. Spec in
[`docs/agentic.md`](docs/agentic.md).

- **TraceSteps** — the identifying screen shows the trace landing one step at a
  time (read photo → match product type → pull import data → build route →
  estimate split). Every line is read from the same helpers the rest of the app
  uses, so it can't drift from the numbers shown later. Closes with a
  first-person verdict whose reasoning follows from the data.
- **ConfidenceShift** — a care tag visibly moves the origin from *fairly sure*
  to *sure*, and says what did **not** change: one label doesn't price a
  factory. Sample labels are excluded — a demo is not evidence.
- **DelegationCard** + `src/lib/delegation.js` — a brand letter becomes a task
  with a clock-derived state (drafted → sent → awaiting reply → flagged after
  14 days → escalated) and a drafted follow-up. Jejak drafts; the user sends.
- **Observations** + `src/lib/observations.js` — the journal opens with what the
  app noticed (two items from the same country, a letter nobody answered, a set
  of traces with no label). Derived from the user's own records — never
  generated by a model.
- **GiveBackNote** — the maker payout moved out of the proof drawer into the
  money flow, sent as a claimable balance (claim it or it returns).
- **PassportSign** — the passport co-signs an anchored record, so the ledger
  shows the trace is *yours*, not just that Jejak wrote it down. Journaled on
  the fee-sponsoring account, same honest limitation as the other passport
  admin actions.

## The social layer — BUILT

Jejak stops being a broadcast app (you publish an anonymised trace to a shared
map) and becomes an interaction app. Spec in [`docs/social.md`](docs/social.md).

- **The wager, made correct.** Identity is resolved **server-side from auth** —
  it used to be a client-supplied `"guest"` for everybody, which meant every
  winner shared one demo claim address and nobody could ever claim the pot.
  The win-detection no longer tells you you won when you lost. The pool is
  scoped to the **product**, so the field accumulates instead of fragmenting
  into private buckets. And `action: "claim"` submits a real
  `claimClaimableBalance` operation, signed by the winner's own derived key —
  so the pot is genuinely collectable, with an explorer link.
- **GuessField** — the whole field on one hand-inked axis: a mark per person,
  your guess as the vermilion diamond, the app's estimate as a faint band, the
  truth as a solid rule. It shows **where you sat**, not a ranking, and never
  says who held which belief. One belief per person (your latest counts), so
  nobody can hedge the pot by guessing twice.
- **Corroboration** — the Atlas reports what people agree on: *5 of 7 got
  Bangladesh*. Agreement reached independently, not approval — so there is
  nothing to moderate and nothing to game.
- **Honest throughout**: the pot is **sponsored** (no XLM of the user's is
  locked, and the UI never says "stake"); signed-out visitors count toward the
  field but are not eligible for the pot; and a count of one is never shown.

### Demo beats (the social layer)

1. Guess on the split screen — the hash goes to the ledger first.
2. Reveal — the truth *and* the whole field land together on the axis.
3. Point at the marks: "9 of 14 guessed higher than you."
4. Open the Atlas — "5 of 7 got Bangladesh."

### Engagement pass — the part that makes it fill up

The social layer was correct but unusable: pools were keyed by product instance (so two
people photographing the same jacket landed in different rooms), a solo pool settled
instantly (so the first person through the door won a contested-looking pot alone),
signed-out visitors could not compete (so a booth where nobody signs up had an empty
field), and every shared link pointed at a dead domain.

- **Pools are keyed by HS code**, so the same kind of product is the same room — and
  everyone in a pool is compared against the same truth, the category's estimate.
- **A pool of one doesn't settle.** The pot opens when somebody else guesses; the
  guess stays committed so the next reveal settles against everyone in it.
- **No sign-up to compete.** A signed-out guess is bound to a browser-local id; a
  signed-in one to your account. On mainnet both would be the passport wallet.
- **The guesser count shows before you guess**, so a guess feels like it's going
  somewhere.
- **Publishing to the Atlas is offered where the trace has just proved itself**,
  not as a toggle in the far column — which is why the shared map had stayed empty.
- **A shared link is the trace**: `/t/:scanId` renders a published entry without a
  sign-in, and the share button points there rather than at the front page.

### Verified against the deployed backend

- Live app: **https://jejak.base44.app** (Base44 app id `6ace77fd3de4615d81326900`).
- The deployed `guessPool` returns the new response shape; commit → real testnet tx
  `61b78270e882612c2b3c7d9ebdc469a043bc867e5f06b1da59af0bbcb185ae36`, **ledger
  5399535**, `memo_type: hash`.
- `pool_state` returns the guesser *count* before the reveal but an empty
  *distribution* — the crowd can't be copied before the answer is out.
- **Not yet verified:** a successful `claim`. It is the one path in the app that
  moves money and it has never executed. Test it before the demo —
  [`docs/deploy.md`](docs/deploy.md) has the script and the symptom table.

Full project status: [`docs/progress.md`](docs/progress.md).

## Repo/submission checklist

- [ ] Repo public (`gh repo view`)
- [ ] README: Stellar architecture section — Horizon testnet + Soroban RPC, OZ
      Protocol-27 contract IDs (from `src/lib/stellarConfig.js`), relayer design,
      `jejak.provenance.v1` anchor schema, env vars, demo instructions.
- [ ] Onchain tx evidence: one confirmed testnet anchor + explorer link in README/demo.
- [ ] Prior-work disclosure: `stellarFeeRelayer`/`stellarMakerPayout` predate
      HackMeridian (@ts-nocheck banner marks them). New this event: the wager pool
      (guessPool fn + stake/commit/settle/claim UX), the agentic layer (trace steps,
      confidence shift, delegated letters, observations), the social layer (the
      wager's field, the claim, corroboration), the journal/product shell, video.
      Say so explicitly.
- [ ] `JEJAK_APP_URL` env var check for payout/passport deep links.

## Future-work lines (pitch, not scope)

- Onchain attestation registry contract (register/verify hash) replacing memo-only anchors.
- User-signed anchors via passkey (relayer gains an `anchor` allowlisted action).
- Maker payouts via path payments (payer XLM → maker USDC, testnet DEX liquidity).
- x402/MPP agent payments for per-trace API calls.
- Kudos tips for what people wear (shareable item QR → claimable balance).
