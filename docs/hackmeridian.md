# HackMeridian 2026 — Jejak Hackathon Plan
**Event:** HackMeridian 2026, Lisbon · **Track:** Genesis + Stellar Composed  
**Started:** 2026-10-25 · **Budget: ~17h hard deadline**

> Work is split between **Dev A** (new Stellar feature + `/room`) and **Dev B** (GTM + polish + submission). Read your individual file: `docs/dev-a.md` or `docs/dev-b.md`.

---

## The pitch in one sentence
> *"Jejak is the field journal for things you own — snap anything, trace where it came from, follow the money, and anchor the proof on Stellar forever."*

---

## Track: Genesis, and what "built today" means

New projects enter Genesis (Scale applications are closed). The Genesis requirement is **a working PoC/MVP + meaningful technical work during the event** — same bar we set for ourselves. New work during the event is:

1. 🆕 **`/room` — Hackathon Floor Mode**: ledger-backed live counter (reads from Stellar, not just DB), guest trace (no sign-up), live feed with anchored-on-Stellar chips → stellar.expert links — **Dev A**
2. 🆕 **Brand attestation stretch**: a second deterministic keypair `manageData`s a reference to the user's anchor hash — "estimate today, attested claim when the brand co-signs" — **Dev A stretch**
3. 🆕 **Fresh on-chain evidence**: anchor a trace during the event so the submission cites a hash timestamped today, not Oct 13 — **Dev B**
4. 🆕 **Performance + visual polish pass**: page transitions, colour system, font consistency — **both (context below)**
5. 🆕 **Provenance legitimacy pass**: UN Comtrade trade data behind the "made in" stop, honest source labels, label evidence applied to the correct stop, proof record v2 (label photo hash + trade citation). Full audit in [`legitimacy.md`](legitimacy.md) — **Dev B**
6. 🆕 **Mobile harmonisation**: the old app's thumb-first interactions rebuilt in the journal style (shutter, status line, swipeable stops, guided tour, anchor thud). See `polish.md` — **Dev B**
7. 🆕 **Staked provenance guesses ("the wager")** — NEW STELLAR FEATURE, verified on testnet 2026-10-26. The guess-the-maker-share beat becomes a staked pool: guess → SHA-256 commit anchored via `Memo.hash` (provably fair — no one can edit after reveal) → resolve ranks committed guesses → closest guess wins a **claimable balance** (pot on-ledger, not custodial). New: `base44/functions/guessPool` + `Guess` entity + MoneySplit commit/resolve/settle links. Verified txs: commit `3f90061a…` (ledger-confirmed, payment op + Memo.hash), settle `cfe9f2b9…` in **ledger 5393274** (memo `JEJAK-POOL:wager-te:WIN`, claimable balance).
8. 🆕 **The agentic layer** — the product stops handing over answers and starts showing its work. **TraceSteps**: the identifying screen now shows the trace landing one step at a time (read photo → match product type → pull import data → build route → estimate split), each line read from the same helpers the rest of the app uses, closing with a first-person verdict whose reasoning actually follows from the data. **ConfidenceShift**: a care tag visibly moves the origin from *fairly sure* to *sure* — and says what did **not** change (a label doesn't price a factory). **DelegationCard** + `src/lib/delegation.js`: a brand letter becomes a task with a clock-derived state (drafted → sent → awaiting reply → flagged after 14 days → escalated) and a drafted follow-up; the user keeps the send button. **Observations** + `src/lib/observations.js`: the journal opens with what the app noticed, derived from the user's own records — never generated. **GiveBackNote**: the maker payout moved out of the drawer into the money flow, as a claimable balance. **PassportSign**: the passport co-signs an anchored record, so the ledger shows the trace is yours. Full spec in [`agentic.md`](agentic.md) — **Dev B**
9. 🆕 **The social layer** — Jejak stops being a broadcast app and becomes an interaction app. **The wager, made correct**: identity is resolved server-side from auth (it used to be a client-supplied `"guest"` for everybody, so every winner shared one unclaimable demo address); the win-detection no longer tells you you won when you lost; and `action: "claim"` submits a real `claimClaimableBalance` signed by the winner's own key, so the pot can genuinely be collected. **GuessField**: the whole field on one hand-inked axis — a mark per person, your guess as the vermilion diamond, the app's estimate as a faint band, the truth as a solid rule. It shows where you *sat*, not a ranking, and never says who held which belief. **Corroboration**: the Atlas reports what people agree on — *5 of 7 got Bangladesh* — agreement reached independently instead of a rating, so there is nothing to moderate. **Engagement pass**: pools re-keyed to HS code so two people photographing the same jacket share a pool; no sign-up required to compete; a solo pool doesn't settle, it waits for company; the guesser count shown before you guess; and publishing to the Atlas offered where the trace has just proved itself. Full spec in [`social.md`](social.md) — **Dev B**
10. 🆕 **Design-system repair**: the `journal` palette was defined as plain CSS vars, so Tailwind could not apply an opacity modifier to it — **97 usages across 28 files** were silently dropped and rendering transparent. Repaired via `--j-*-rgb` channel vars; 44 opacity variants now generate where there were none — **Dev B**
11. 🆕 **A shared link that IS the trace**: `/t/:scanId` renders a published entry without a sign-in — route, split, story, proof, what people agreed on, and the field's beliefs — and the share button points there instead of at the app's front page. The share host was also pointing at a dead domain; the origin is now read at runtime so it can't drift again — **Dev B**

**Project status:** [`progress.md`](progress.md) — what's live, what's verified against production, and what isn't.

### What "built today" answer for judges:
> "Four things. `/room` — guest trace with no sign-up, plus a live counter and feed backed by the ledger, not the database. A provenance-legitimacy pass: the 'made in' stop is now checked against real UN Comtrade import data, label evidence lands on the correct stage, and the on-chain record (v2) includes the label photo's hash and the data source. A mobile harmonisation pass — a stamp shutter, swipeable stops and a guided tour in the journal style. And an agentic layer: the trace now shows its work step by step, a care tag visibly moves the estimate, a brand letter becomes a task the app follows up on, and the journal opens with what the app noticed on its own."

### Prior-work disclosure

`base44/functions/stellarFeeRelayer` and `stellarMakerPayout` predate this event (marked `@ts-nocheck — pre-existing Stellar code`). The journal/product shell, automations, `/room`, legitimacy pass, mobile harmonisation, **guessPool wager**, **agentic layer**, **social layer**, **design-system repair**, and video are new work during HackMeridian.

### Delta commits during the event (25 Oct, `17d9fa5` is pre-event baseline)
| Commit | What |
|---|---|
| `e8dfa74` | `/room` live floor mode + page transitions + perf (Dev A) |
| `20e3476` | Legitimacy audit + UN Comtrade snapshot (`src/data/trade/`) |
| `221051d` | Stage kinds, HS codes, shared provenance model (`src/lib/provenance.js`) |
| `34d995a` | Evidence assertions in `validate-data.mjs` |
| `2a0da1c` | Honest copy: drop photo-origin claims; split basis = AI inference |
| `9110476` | `TradeEvidence` — Comtrade supplier-share bars on the made-in stop |
| `6e8cc41` + `e276b36` | Mobile harmonisation: shutter, specimen strip, swipeable stops, 3-step tour, anchor thud |
| `ad43a99` | `MaterialsSwatch` — label fibre composition as a printed swatch |
| `24ed670` | Labour shares re-anchored to CCC + Deloitte/Oxfam; living-wage note |
| `5ae1785` + `0f02527` | Hotfixes: rebuild-era runtime crashes (landing blank, MoneySplit `basePrice`) |

On-chain evidence: wager-pool commits + settlement anchored during the event — commit `3f90061a…` (Memo.hash anchor) and settle `cfe9f2b9…` (claimable balance, ledger 5393274): https://stellar.expert/explorer/testnet/tx/cfe9f2b9dc2ee67f99c622bb861cd42957f3738bac78a16bd8222a2b64b4765f

A further commit was anchored against the **deployed** backend during the final verification pass, confirming the live `guessPool` writes a real `Memo.hash` anchor: tx `61b78270e882612c2b3c7d9ebdc469a043bc867e5f06b1da59af0bbcb185ae36`, **ledger 5399535**, `memo_type: hash`.

---

## Confirmed probes (Dev B verified at h0)

| Check | Result |
|---|---|
| Live site up | ✅ `https://jejak.base44.app` 200 |
| Landing crash fixes deployed | ✅ `cf00100` live |
| `traceAnything` unauthenticated | ✅ HTTP 200 ~4s — guest AI-trace viable |
| Public Scan entity reads | ✅ world-readable via RLS |
| `stellar_tx_hash` on Scan records | ✅ already persisted — no schema change for ledger counter |
| GitHub repo | ✅ public |
| MoneySplit render | ⚠️ was blank live (`basePrice` undefined since the rebuild); fixed in `0f02527` |
| Old vs new mobile screenshots | `/tmp/jejak-mobilecmp/{old,new}` (390×844) |

---

## 17-Hour Timeline

| Hour | Dev A | Dev B |
|---|---|---|
| 0–1 | Scaffold `/room`, verify traceAnything probe | Incognito smoke test, QR, social teaser, start Atlas seeding |
| 1–8 | Counter + feed (ledger-backed), guest trace (curated-first) | Floor push — 20 conversations, publish on their behalf |
| 8–10 | Checkpoint: attestation stretch or polish | Collect evidence: fresh anchor tx today, passport contract address |
| 10–11 | **Code freeze**, deploy, full smoke test | Record video (closing shot = `/room`) |
| 11–13 | Polish/buffer | Deck (5–7 slides), submission form |
| 13–15 | — | **Submit by h15** |
| 15–17 | Buffer | Buffer — portals crash at deadline |

**Hard rule:** code freeze at h10, video records at h11 regardless.

---

## Performance + Visual Polish (Dev A h8–10 if `/room` early, Dev B ongoing)

See `docs/polish.md` for the full list. Short version:

- Wire `pageVariants` + `AnimatePresence` properly in `AppLayout.jsx` so route changes fade/slide
- Apply `font-grotesk` consistently on body text in inner pages (currently falls back to Plus Jakarta Sans — the `--font-body` CSS var points to the wrong family)
- Surface the existing vivid `jejak.*` colour tokens (labour orange, freight blue, brand purple, retail pink) on inner page headings and accent elements — they're defined and used on Landing but not threaded through Journey/MoneySplit/Impact
- `PaperGrain` on all inner page backgrounds (already on Landing; inner pages use plain white)

---

## Judge Q&A

| Question | Answer |
|---|---|
| "Is the supply chain data real?" | "Category-level estimates, clearly labelled with confidence + basis. Scan a care label and that stage becomes a verified fact. Competitors pretend certainty — we show the seam." |
| "Why Stellar?" | "Anchoring a hash is easy anywhere — a wallet anyone can open isn't. Stellar's passkey smart accounts sign you in with a fingerprint, no seed phrase — natively, not via an account-abstraction stack. Around that: anchors cost fractions of a cent, and the built-in DEX is our price oracle. The same rail proves the record and pays the corridor." |
| "What did you build today?" | "The `/room` page — guest trace with no sign-up, plus a live counter and feed that are ledger-backed: it counts records anchored on Stellar today, not just rows in our DB." |
| "Business model?" | "Freemium consumer + brand-side co-signing. The EU Digital Product Passport makes brands publish provenance from 2027 — Jejak is the consumer half, and our estimate records are built to be upgraded into attested claims." |
| "Why not just trust the brand's QR code?" | "That's the brand's story. Jejak is the consumer's independent record — anchored on a ledger the brand can't edit." |
| "Isn't this blockchain for its own sake?" | "The anchor proves the estimate we show today is the same one we show next year — anti-greenwashing applied to ourselves. It's also the substrate for brand co-signing." |

---

## Success Metrics

| Metric | Target |
|---|---|
| Real conversations at the venue | 20+ |
| Public Atlas entries (non-sample) | 10+ |
| Sign-ups via `/room` CTA | 3+ |
| Fresh anchor tx today | ✅ — this IS the evidence of work |
| `/room` live | ✅ before h10 |
| Demo video | ✅ by h11 |
| Thematic track saved on team page | ✅ Stellar Composed |
| Submission filed | ✅ by h15 |

---

## Risk Register

| Risk | Mitigation |
|---|---|
| Stellar Testnet slow / down | Already handled — cached tx fallback with clear UI notice |
| Base44 cold start on demo | Keep a warm browser tab open before pitching |
| Guest trace breaks | Curated fallback (no backend, no auth) ships first |
| Nobody scans QR | Walk the room — opening line does the work |
| `/room` runs long | Ship counter + feed first (2h), add guest trace second |

---

## Stellar architecture overview

**Network:** Stellar **Testnet** only (`STELLAR_NETWORK = "TESTNET"`, never mainnet in demo). Endpoints: Horizon `https://horizon-testnet.stellar.org`, Soroban RPC `https://soroban-testnet.stellar.org`, Friendbot for testnet funding. Price oracle: mainnet XLM/USDC orderbook midpoint via Horizon (read-only).

**How Stellar is used (the Composed pitch):**

| Primitive | Where | What it does |
|---|---|---|
| OpenZeppelin **Smart Account Kit** (passkey/WebAuthn) | `src/lib/stellarConfig.js`, `JejakPassportSheet`, `stellarFeeRelayer` | "Your Jejak passport" — a smart wallet secured by a passkey, no seed phrase. The relayer sponsors fees so users never hold XLM. |
| **Fee-sponsored relayer** | `base44/functions/stellarFeeRelayer` | Sponsors gas for allowlisted smart-account actions (deploy, recovery signer, spending policy, session challenge). Rate-limited (10 ops/60s per caller), isolated sponsor keypair. |
| **Provenance memo-anchoring** | `base44/functions/stellarMakerPayout` (`anchor_provenance`, `anchor_estimate`) | SHA-256 of canonical `jejak.provenance.v1` JSON written as `Memo.hash` — an *anchored record of an estimate*, disclosed as such. Explorer links via stellar.expert. |
| **Claimable balances (CAP-23)** | `base44/functions/guessPool` | Wager-pool stakes + pot settlement: winner claims directly on-ledger — Jejak never holds funds. |
| **Commit-reveal fairness** | `guessPool` (`commit`/`resolve`) | Guess hash anchored at guess-time → provably un-edited before reveal. |
| Demo payment flows | `stellarMakerPayout` (cause wallets, maker payouts) | Deterministic testnet keypairs; all payouts labelled "Demo wallet (testnet)". |

**OpenZeppelin Protocol-27 testnet contract IDs** (`src/lib/stellarConfig.js`, upstream commit `1e513890`):

- Account WASM hash: `1b5f4534a76322da2ad7c745f6900857a6802b0ca79850c35a03561df997785a` (upload tx `889f0e23…`)
- WebAuthn verifier: `CC7EKIHQP3TN4CARQDND6CEOY2UXLWWC2X5GHTD5NLAT7BG5GPZIOM3F`
- Ed25519 verifier: `CAAVTMCBXEIBPR64EAASKFXERVPYFZA2JYP5A3BG6PESWEFUJX5IHKN4`
- Threshold policy: `CB3FATQKCIRIQOCYRUPCQ2KREQ7T4RPKS7EAEOZWPEPUKWEDRVROBCEG`
- Spending-limit policy: `CABXBYJNZ7IUW4G3D6BND5YCAQF3ASSDMDAOKQQ63UYFSO7WUU2TIP5G`

**Provenance record schema:** `jejak.provenance.v1` — `record_type: "anchored_record_of_an_estimate"`, disclaimer *"Anchored record of a supply-chain estimate and any label-read evidence — not verified fact."* The honesty is the feature.

**Verified onchain evidence (testnet, this event):**
- Wager commit: `3f90061a…` — payment op + `Memo.hash`
- Wager settle: `cfe9f2b9…` ledger 5393274 — claimable balance, memo `JEJAK-POOL:wager-te:WIN`
- [Prior-event anchor example: tx hash in `stellarMakerPayout` CACHED_FALLBACK_TX, ledger 5180822]

**Limits disclosed:** commit/resolve signatures use the backend pool keypair (user-signed anchors are future work); winner resolution is server-side in v1; testnet stakes are demo value; maker/cause wallets are derived demo addresses, not verified humans.
