# Jejak — a field journal for the things you own

> **Every thing has a journey.**
> *jejak* /jə·dʒak/ (n.) Malay & Indonesian — a trace; a footprint left behind.

Snap anything you own and Jejak traces where it likely came from, who made it, and where your money went. It also tells you how sure it is. Every entry is a page in your field journal: a hand-drawn route, postmarks for each country, and a torn receipt showing how your £120 was split between materials, the people who made it, freight, the brand and the shop.

Built with **Base44** for the **#Base44Challenge**, and entered in **HackMeridian** (Genesis · Stellar Composed). The frontend, data, auth, AI, automations and hosting all run on Base44; the Stellar proof layer is documented below and pitched in `docs/hackmeridian.md`.

**Live app:** https://jejak.base44.app · **Project status:** [`docs/progress.md`](./docs/progress.md)

## Why

Most of us have no idea that a £120 hoodie probably crossed six countries and 21,000 km, or that published breakdowns put the sewers' wages at under 1% of the price. Jejak makes that visible without preaching. It gives a starting point, not a verdict: every figure is a range with a confidence level, and the app always says which facts were read from a label, which rest on trade data, and which are estimates.

## What it does

| | |
|---|---|
| **Trace anything** | Take a photo, upload one, or just describe the item ("grey merino jumper from Uniqlo"). Base44 AI vision identifies it and sketches its likely supply chain: 2–5 stages, the countries, and a five-way cost split with low/mid/high ranges. |
| **Watch it work** | The trace doesn't arrive finished. It shows its steps one at a time — *I read your photo · I matched it to a product type · I pulled import data for the UK · I built the route · I estimated the split* — each with the real figures attached, then a one-line verdict in the margin. |
| **Read the label** | Snap the care tag and the "made in" country becomes a fact. That stage is stamped *read from the label*; everything else stays *estimated*. |
| **Change its mind** | A care tag moves the origin from *fairly sure* to *sure* — and the app shows the shift: what it was, what it is now, and what did **not** change. |
| **Follow the money** | Guess first, then reveal. A torn receipt shows where the money went, with the labour line circled in red pen. |
| **The wager** | Your guess is hashed onto a public ledger *before* the split is revealed, so nobody can move it afterwards. When the pool settles you see the whole field on one hand-inked axis — where everyone stood, where you stood, and where the trade data thought. The pot is a claimable balance you can actually collect. |
| **Corroboration** | The Atlas says what people agree on: *5 of 7 got Bangladesh*. Agreement, not approval — same conclusion reached independently, which is worth more than any rating. |
| **Hand things off** | Ask a brand a transparency question and it becomes a task on your desk — *drafted → sent → awaiting reply → flagged after 14 days*. Jejak drafts the follow-up; you press send. |
| **Notice things on its own** | The journal opens with what the app noticed — two of your items from the same country, a letter nobody answered, a whole set of traces with no label in them. |
| **Your journal** | Every trace is saved to your private journal. You can choose to publish any entry to the shared **Atlas** map. |
| **Live Floor Mode (`/room`)** | Guest trace station for live event attendees: instant curated or AI trace without login, real-time count of today's traces, and verified Stellar-anchored transaction feed. |
| **Proof, if you want it** | Any entry can be fingerprinted on a public ledger (Stellar), so no one can quietly change it later — and signed with your passport, so the ledger shows the record is yours. |

## Automations: Jejak does the legwork

All three run as Base44 backend functions with **automations**. Nothing needs a manual step.

1. **A story written for every entry.** This is an entity automation on `Scan` create (`base44/functions/writeJourneyStory`). When you save a trace, an LLM writes a short second-person journal entry. It hedges estimated stages and states label facts plainly. The entry appears live in the app through a realtime subscription, and one tap turns it into a shareable postcard image.
2. **Snap a receipt and every item gets traced.** This is an entity automation on `Receipt` create (`base44/functions/processReceipt`). It reads the receipt photo, turns abbreviations like "MNS CTN TEE BLK" into "Men's black cotton t-shirt", skips fees and bags, then traces up to 8 items in parallel. Each traced item becomes a journal entry and gets its own story, because each new `Scan` triggers automation 1. The receipt fills in line by line on screen as each item finishes.
3. **Ask the brand, without the awkwardness.** `draftBrandLetter` writes a polite, specific transparency request built around the stages Jejak could only estimate. You send it from your own email app; Jejak never emails brands on your behalf. A **scheduled automation** (`brandFollowUps`, daily 09:00 UTC) emails you a nudge if the brand hasn't replied after 14 days.

What this saves: researching one product's supply chain by hand takes hours of reading trade data and brand reports. Jejak gives a first answer in seconds, turns a whole shopping receipt into a journal in about a minute, and does the follow-up for you.

## Showing its work

A traceability tool that hands you a finished answer reads like a lookup table. Jejak is built so you can watch it reason, argue with it, and leave with it doing something.

Full spec in [`docs/agentic.md`](./docs/agentic.md).

**1 · The trace, in steps.** `src/components/journal/TraceSteps.jsx` renders the labour of a trace as a list that fills in one line at a time. Every line is work the app actually did, read from the same helpers the rest of the app uses (`getTradeEvidence`, `getRoute`, `routeDistance`, `computeSplit`), so the trace can't drift from the numbers shown later:

```
✓ I read your photo          navy · cotton · hoodie
✓ I matched it to a product type
                            Everyday Hoodie · HS 6110 — jumpers, sweatshirts & hoodies (knitted)
✓ I pulled import data for the UK
                            8 supplying countries · 2024 · UN Comtrade · China alone is 27.7%
✓ I built the route         6 stops · 29,038 km to the UK
✓ I estimated the split     makers get 0.5–4% of what you paid · I'm fairly sure
```

It closes with a first-person verdict that has to actually follow from the data — the share quoted is the origin's own share of the market, not the biggest supplier's: *"I'm fairly sure. Bangladesh supplies 20.9% of the UK's jumpers, sweatshirts & hoodies (knitted), so I routed the final stage there — that's the category though, not your item."*

**2 · A voice instead of a chip.** Where the app used to say *fairly sure*, it now says *"I'm fairly sure about Bangladesh — that's the category's usual supplier, not your item."* Reasoning lives in `MarginNote` — handwritten, in the margin, where a person would scribble the thought. Plain copy stays plain; it just has a subject now.

**3 · Evidence that changes the estimate.** Scan a care tag and `ConfidenceShift` shows the move: `fairly sure → sure · where it was made`. It also states what did *not* change — *the money split is unchanged, one label doesn't price a factory* — because a label pins down where something was made, not what it cost. A **sample** label is a demo and is deliberately excluded from this.

**4 · Things you handed off.** `src/lib/delegation.js` turns a brand letter into a task with a state. Stored status is coarse (`drafted` / `sent` / `replied` / `escalated` / `closed`); everything else — *awaiting reply*, *no reply in 14 days* — is derived from the clock, so it ages on its own without a cron writing to the database. `DelegationCard` shows the letter on a three-stage rail and drafts the follow-up. Jejak still never emails a brand; the send button stays with you.

**5 · What it noticed.** `src/lib/observations.js` derives observations from the journal's own records on every render, so an observation can never claim something the app doesn't know — two of your items from the same country, a letter nobody answered, a set of traces with no label in them, a brand you've never asked anything. The journal opens with these instead of a catalogue.

**6 · Empty states that promise work.** The journal's empty state is now a promise rather than a shop window: *"Give me one label. I'll trace the route, price the labour share, tell you how sure I am, and anchor the whole thing to a public ledger you can check without me."* The specimen shelf stays, but as the second option.

**7 · Consequence, up front.** The money card in the story now states the wager plainly: your guess is hashed and written to a public ledger *before* the split is shown, so nobody — including the app — can change it afterwards. The maker payout moved out of the drawer into the money flow (`GiveBackNote`), and the passport can co-sign an anchored record so the ledger shows the trace is yours, not just that Jejak wrote it down.

## The social layer

Full spec in [`docs/social.md`](./docs/social.md).

Jejak was a **broadcast** app — you published an anonymised trace to a shared map — with no way to see anyone else. It is now an **interaction** app in two places, and only two:

- **The wager** (`base44/functions/guessPool`). Your guess is committed to the ledger as a hash before the real maker-share is known, so nobody can move it afterwards. Identity is resolved server-side from auth, so the pool is genuinely shared and the winner can genuinely claim the pot: `action: "claim"` submits a real `claimClaimableBalance` operation signed by the winner's own key. When the pool settles, `GuessField` draws the whole field on one hand-inked axis — a mark per person, your guess as the vermilion diamond, the app's estimate as a faint band, the truth as a solid rule. It shows *where you sat*, not a ranking.
- **Corroboration** (`corroboration()` in `src/components/explore/exploreUtils.js`). The Atlas reports what people agree on — *5 of 7 got Bangladesh*. Agreement reached independently, not approval, and with nothing to moderate.

Three rules hold all of it together: we never say **who** held which belief, we never say you **staked** anything (the pot is sponsored), and a count of one is never shown as a count.

**And a shared link is the trace itself.** `/t/:scanId` renders a published entry without a sign-in — route, split, story, proof, what people agreed on, and the field's beliefs — and the share button points there instead of at the app's front page.

**And the field fills up.** A pool is keyed by **category** (HS code), not by product instance — so two people who photograph the same jacket land in the same room. Competing needs **no sign-up**: a signed-out guess is bound to a browser-local id, a signed-in one to your account. And a pool of one doesn't settle: the pot opens when somebody else guesses, which is what makes it a wager rather than a note to yourself.


## Design

The art direction is *a field journal of things*: warm paper with grain, ink, vermilion postmarks, hand-drawn routes and honest notes in the margins.

- **Type:** Fraunces for headlines (variable: SOFT/WONK/opsz), Schibsted Grotesk for body text, IBM Plex Mono for stamps and data, Caveat for margin notes only.
- **Colour:** paper `#F3EDE2`, ink `#1E1B16`, stamp `#C8442B`, plus one printing ink per money category (fern, turmeric, indigo, plum and rose madder).
- **Signature interactions:** routes that draw themselves (an SVG map built with d3-geo, no 3D engine), postmarks that thud into place, a scroll-driven "Follow one hoodie" story, a guess-then-reveal receipt, and a live receipt that fills in as it's traced.
- **Responsive:** desktop is a real editorial website, not a phone in a frame, and mobile is a first-class single column. Reduced motion is respected everywhere.
- Shared design pieces live in `src/components/journal/`.

## Architecture (Base44)

| Piece | Where |
|---|---|
| Entities: `Scan` (journal entries; private by default, `visibility` controls the Atlas), `Receipt`, `BrandRequest`, `Guess` | `base44/entities/` |
| AI prompts and JSON schemas (honesty rules live here) | `base44/shared/prompts.ts` |
| Trace engine and output normalisation (ranges fixed, mids always sum to 100, label rule enforced) | `base44/shared/trace.ts` (+ `trace.test.ts`) |
| Vision: product + care label | `base44/functions/identifyProduct` |
| Trace any described item | `base44/functions/traceAnything` |
| Automations | `writeJourneyStory`, `processReceipt`, `brandFollowUps` (see each `function.jsonc`) |
| Brand letters | `base44/functions/draftBrandLetter` |
| Proof layer (Stellar) | `stellarMakerPayout`, `stellarFeeRelayer` |
| Staked guess pool (commit → resolve → claim → claimable balance) | `base44/functions/guessPool` (+ `Guess` entity) |
| The wager's field maths (bucketing, median, one-belief-per-person) | `base44/shared/guess.ts` (+ `guess.test.ts`) |
| Delegated-letter lifecycle (pure, clock injected) | `src/lib/delegation.js` (+ `src/lib/agentic.test.ts`) |
| Unprompted observations (pure, derived from the journal's own records) | `src/lib/observations.js` |
| Corroboration — what the field agrees on | `src/components/explore/exploreUtils.js` (+ `src/lib/corroboration.test.ts`) |
| Shared-trace links and page metadata | `src/lib/share.js` (+ `src/lib/share.test.ts`), `src/pages/PublicTrace.jsx` |
| Agentic UI primitives | `src/components/journal/TraceSteps.jsx`, `ConfidenceShift.jsx`, `DelegationCard.jsx`, `Observations.jsx`, `PassportSign.jsx`, `GiveBackNote.jsx` |
| Social UI primitives | `src/components/journal/GuessField.jsx`, `WagerPanel.jsx` |

Row-level security: entries, receipts and letters are owner-only. An entry is readable by everyone only once its owner publishes it to the Atlas.

## Deploying

```bash
base44 login          # with the account that owns the app
base44 link           # choose "Link an existing project"
base44 deploy         # entities, functions + automations, site
```

Optional function env var: `JEJAK_APP_URL` (e.g. `https://your-app.base44.app`) adds an "Open your journal" link to the reminder emails. Set it as an environment variable or secret for the app in the Base44 dashboard.

Note: Base44 rejects `function.jsonc` automations (HTTP 409) on apps that have **Workflows** enabled. If that happens, recreate the three triggers as Workflows (`Scan` created → `writeJourneyStory`, `Receipt` created → `processReceipt`, daily 09:00 → `brandFollowUps`) and deploy the functions without their `automations` blocks.

---

## Why Stellar, and why now

Anchoring a hash is easy on any chain — that alone is not the answer. The three things Jejak actually needs all point at Stellar:

- **A wallet a normal person can open.** Jejak Passport is a real Soroban smart account (OpenZeppelin Protocol 27 kit) deployed via `createContractV2` and secured by a WebAuthn passkey: fingerprint in, no seed phrase, no extension, fees sponsored by a relayer. On other chains this takes an account-abstraction stack; on Stellar it's the native kit.
- **Near-zero cost per anchor.** `MEMO_HASH` + `manageData` are right-sized provenance primitives at ~0.00001 XLM a write. "Anchor anything you own" only works if the marginal cost is effectively zero.
- **One rail for proof and payment.** The built-in DEX orderbook is the XLM/USDC oracle for the donation amount, and the same ledger settles the corridor payout that Stellar anchors could cash out to a bank account on mainnet.

And the timing is regulatory, not vibes. The EU Digital Product Passport Registry went operational **20 July 2026**; textiles are a first-priority DPP group (delegated act expected **2027**, obligations after a ≥18-month transition); battery passports are mandatory **18 Feb 2027**; EUDR provenance obligations apply to large operators from **30 Dec 2026**. Brands will have to publish provenance whether or not consumers ask for it — Jejak is the consumer half of the Digital Product Passport: the journal that holds it, the ledger that timestamps it, the letter that asks for it early.

Validation today is proxy + pull: Yuka's tens of millions of users prove mass-market scan-a-product behaviour; brand transparency pilots (Sheep Inc's Connected Dot, Asket, Mulberry, Chloé) prove the supply side is already spending on this; and Jejak's brand-letter loop is a live validation metric — every letter sent measures whether a brand answers.

---

## Proof layer: Stellar

Stellar is a **first-class provenance and settlement primitive** in Jejak:

1. **Tamper-Evident On-Chain Provenance Record (`MEMO_HASH` + `manageData`):**
   - When a user completes a trace and clicks **Anchor this trace on Stellar**, the browser builds a deterministic canonical JSON document (`schema_version: "jejak.provenance.v1"`) containing:
     - Product category & market (`GB` / `SG`)
     - Multi-stage origin route with per-stage provenance basis (`"Read from label"` for label-verified final manufacture vs `"Estimated"` for upstream stages) and confidence (`high` / `medium` / `low`)
     - Extracted care-label evidence (`country_of_manufacture`, `fibre_composition`, `care_or_brand_text`), if scanned
     - 5-category cost-split estimate ranges (`low`, `mid`, `high`), confidence, and basis labels
     - UTC ISO-8601 timestamp
     - **Zero photos or personal data**
   - The canonical JSON is hashed with **SHA-256** (32 bytes) in the browser and submitted to Stellar Testnet (`base44/functions/stellarMakerPayout/entry.ts`, `action: "anchor_provenance"`) using:
     - `Memo.hash(recordHashHex)` (`MEMO_HASH`) — stores the exact 32-byte SHA-256 digest in the transaction header.
     - `Operation.manageData({ name: "jejak_prov_<product>", value: "<origin>:<hashPrefix>" })` — indexes the provenance entry on the account ledger.
     - `Operation.payment` (`0.0000100 XLM`) to the corridor's Demo Cause Wallet (Testnet) so the transaction appears in the corridor's Horizon feed.
   - Users can download the off-chain JSON (`jejak-provenance-<product>.json`) and scan a QR code linking directly to `stellar.expert/explorer/testnet/tx/{hash}`.

2. **Cryptographic Verification Step (`action: "verify_provenance"`):**
   - Clicking **Verify hash on Horizon** recomputes the SHA-256 hash from the off-chain canonical JSON in the browser, fetches the transaction directly from Stellar Horizon Testnet (`GET https://horizon-testnet.stellar.org/transactions/{txHash}`), decodes the base64 `memo` (`memo_type: "hash"`) back to hex, and compares the two digests byte-for-byte.
   - Includes a **Test altered JSON** toggle that modifies one field in the off-chain JSON and re-runs verification against Horizon to prove that any post-anchor tampering triggers a **HASH MISMATCH**.

3. **Secondary Maker Bridge (`Operation.payment` & `Operation.createClaimableBalance`):**
   - On the money view, users can send an optional Testnet XLM payment or create an unconditional `ClaimableBalance` (`Operation.createClaimableBalance`) to a **Demo cause wallet (testnet)** with a structured `MEMO_TEXT` (`CAUSE:<PRODUCT>:<REGION>`).
   - Small cross-border payments are costly on card and bank rails; Stellar network fees are a fraction of a cent (`0.00001 XLM` base fee).

4. **Zero-Fail Testnet Resilience:**
   - Every Stellar Testnet and Horizon call has an automatic fallback to a cached, real verified Testnet transaction (`976dc854593180c819797b3606963c4ecbccd83ae8cbec0b9ca47db5c1407ff3` / `d1a60c45d14ad388bcfc4f6194e8bec19fd01035a903e6e81e7181f0ee3caa43`) with a clear notice (*"Testnet is slow right now — here's a recent verified testnet transaction"*), ensuring the app never hard-fails during a live judge run.

5. **Passkey Smart Wallet — "Jejak Passport" (Soroban Smart Accounts):**
   - The Embedded bank view (`/embedded`) offers a **Jejak Passport**: a WebAuthn passkey-backed smart wallet built on the OpenZeppelin `smart-account-kit` architecture (Protocol 27) on Soroban Testnet — no seed phrase or browser extension required (`src/lib/wallet.js`, `src/lib/stellarConfig.js`).
   - **Real contract deployment:** the fee-sponsoring relayer (`base44/functions/stellarFeeRelayer/entry.ts`) deploys a real `multisig-account-example` contract instance via `createContractV2`, constructed with the passkey's secp256r1 public key + credential ID as a `Signer::External` for the audited WebAuthn verifier contract. Every passport gets a **real, resolvable `C...` contract address** on Soroban Testnet (deterministic salt `sha256("jejak-passport:" + credentialId)`), viewable on stellar.expert.
   - The relayer is isolated (its own deterministic Friendbot-funded account), rate-limited per IP, and enforces an allow-list of actions and Protocol 27 contract addresses — users never need to acquire XLM.
   - **Honest limitation:** account admin operations (`add_recovery_signer`, `set_spending_policy`, `sign_session_challenge`) are journaled on the sponsor account via `manageData` — executing them on-chain requires a passkey-signed `__check_auth` authorization that only the client can produce (full smart-account-kit signing flow is future work). If a deployment fails, the relayer falls back to the same journal and the UI marks the account "deployment pending".
   - Users can alternatively **connect an external wallet (Freighter)** for read-only address binding.

   **Deployed contract surface (Soroban Testnet, OpenZeppelin Protocol 27):**

   | Piece | Identifier |
   |---|---|
   | Smart account WASM hash | `1b5f4534a76322da2ad7c745f6900857a6802b0ca79850c35a03561df997785a` |
   | WebAuthn (secp256r1) verifier | `CC7EKIHQP3TN4CARQDND6CEOY2UXLWWC2X5GHTD5NLAT7BG5GPZIOM3F` |
   | Ed25519 verifier | `CAAVTMCBXEIBPR64EAASKFXERVPYFZA2JYP5A3BG6PESWEFUJX5IHKN4` |
   | Threshold policy | `CB3FATQKCIRIQOCYRUPCQ2KREQ7T4RPKS7EAEOZWPEPUKWEDRVROBCEG` |
   | Spending-limit policy | `CABXBYJNZ7IUW4G3D6BND5YCAQF3ASSDMDAOKQQ63UYFSO7WUU2TIP5G` |
   | Each Jejak Passport | deterministic `C…` address per passkey (`sha256("jejak-passport:" + credentialId)` salt), printed at deploy and linked to stellar.expert |

   APIs used: Horizon Testnet (accounts, transactions, `manageData` feed), Soroban RPC Testnet (deploy + simulation), Horizon **mainnet** (read-only XLM/USDC orderbook), Friendbot (testnet funding), stellar.expert (explorer links).

6. **Stellar DEX as Price Oracle:**
   - The Layer-2 payment converts the user's fiat amount to XLM using the **live XLM/USDC orderbook midpoint on the Stellar DEX** (mainnet Horizon read-only), rather than a fixed estimate — falling back to a documented heuristic if the orderbook is unreachable.

---

## What's Real vs. Mocked

### Real (Live in this build)
- **Product & Care-Label AI Vision (`base44/functions/identifyProduct/entry.ts`):**
  - `mode: "product"`: matches photographed items to the curated product set (`hoodie`, `trainers`, `coffee`, `phone_case`), extracts visual attributes, and returns a plain-English `description` and any visible `brand`. Items outside the curated set are traced by the AI trace engine (`traceAnything`); unsafe images are refused.
  - `mode: "label"`: extracts `country_of_manufacture`, `fibre_composition`, and `care_or_brand_text` from photographed care tags or "Made in" labels as structured JSON.
- **Private-by-Default:**
  - Product and label photos for vision recognition use `UploadPrivateFile` + short-lived `CreateFileSignedUrl` (stored privately).
  - Journal entries save with `visibility: "private"`. Publishing to the Atlas is an explicit per-entry toggle; label photos are never uploaded publicly.
- **Live Stellar Testnet & Horizon Integration (`base44/functions/stellarMakerPayout/entry.ts`):**
  - Real `MEMO_HASH` provenance anchoring, live Horizon transaction lookup and SHA-256 verification, live `payment` and `createClaimableBalance` operations on Stellar Testnet, and live Horizon account telemetry on the Impact screen.
- **Jejak Passport Smart Wallet (`src/lib/wallet.js`, `base44/functions/stellarFeeRelayer/entry.ts`):**
  - **Real** Soroban Testnet contract deployment via `createContractV2` — each passport is a real `C...` smart-account instance, fee-sponsored by an isolated relayer account. Admin actions (recovery signer, spending policy) are journaled on the sponsor account rather than executed — labelled honestly as such.
- **Trade data (UN Comtrade snapshot):**
  - Import shares by partner country for 14 HS product codes in both markets (`src/data/trade/imports.json`), from the UN Comtrade public preview API, latest year. Committed snapshot, no live calls at runtime — regenerate with `node scripts/fetch-trade-snapshot.mjs`. It shows which countries supply a market, not which factory made your item.
- **Live Atlas (`/atlas`):**
  - A shared paper map backed by the `Scan` entity with realtime subscriptions. Only records with `visibility: "public"` appear; new public entries animate in live. Seeded records carry `is_sample: true` and are badged **Sample** in the UI; single-person real counts (`count === 1`) are hidden so an individual cannot be singled out.

### Mocked / Illustrative (Clearly labelled in the UI)
- **Supply-Chain Route & Cost-Split Percentages:**
  - Upstream stages, country routes, and 5-category cost-split ranges (`low` / `mid` / `high`) are curated category-level estimates, not data from specific named factories or suppliers. Every stage and figure is labelled **Estimated** (unless a care label was scanned for the final-manufacture stage, which is labelled **Read from label**).
  - **AI-traced items** (anything outside the four curated samples, and every receipt line) are generated by an LLM following typical trade patterns. Their confidence is capped at *medium*/*low*, their basis labels come from the same fixed set, and `normalizeTrace` enforces the rules in code: mids sum to exactly 100, low ≤ mid ≤ high, and *Read from label* applies only when the stage's country matches a scanned label. Prices for the second market are converted at a fixed rate (1 GBP = 1.70 SGD).
- **Journal stories and brand letters** are AI-written from the trace data and use hedged language for estimated stages.
- **Demo Cause Wallets & Future Off-Ramps:**
  - Destination wallets (`Bangladesh`, `Vietnam`, `Ethiopia`, `China`) are **Demo cause wallets (testnet)**, not real partner cooperatives, and funds do not reach individual workers. Local-currency anchor off-ramps (SEP-24) are described strictly as a **future integration**.
- **Embedded Bank Screen (`/embedded`):**
  - An illustrative concept preview showing how provenance and cost splits could appear inside a consumer bank feed.
- **The agentic layer:**
  - **Observations are derived, not generated.** Everything in "What I noticed" comes from the user's own scans and letters via `src/lib/observations.js` — there is no model in the loop, so an observation can only ever say something the journal already knows. The wording is deliberately plain (country-level, not "the same mill") because the data is country-level.
  - **The delegated follow-up is a template.** The *first* letter is AI-written by `draftBrandLetter`. The follow-up nudge drafted by `nudgeDraft` is a fixed template with the brand, item and date filled in — it does not read the original letter back.
  - **"Awaiting reply" and "no reply in 14 days" are derived from the clock**, not written by a job. The daily `brandFollowUps` automation only emails the user; it does not change the stored status.
  - **A care tag changes provenance confidence, not the money split.** `ConfidenceShift` says so explicitly in the UI. The split percentages are a category-level estimate and a label does not reprice them.
  - **A sample label is a demo and is excluded from the confidence shift.** Only a label read from a real photo counts as evidence.
  - **A passport co-sign journals the signature on the fee-sponsoring account**, the same honest limitation as the other passport admin actions (see the proof layer above) — it proves the record was signed by your key; it does not yet execute as a smart-account authorisation on-chain.
- **The social layer:**
  - **The wager's pot is sponsored.** No XLM of the guesser's is locked — the pot is funded by Jejak and `sponsored: true` says so in the data. The UI never uses the word "stake" about the user's own money.
  - **A guess needs no sign-up.** A signed-out visitor guesses with a browser-local anonymous id and can claim the pot by presenting that id; a signed-in guesser is bound to their account id instead. On mainnet both would be the passport wallet. Requiring an account to compete empties the field exactly where you want it full.
  - **The pot waits for a second person.** A pool of one doesn't settle — the first person through the door would otherwise win a contested-looking pot alone. Their guess stays committed, so the next reveal settles against everyone in it.
  - **The winner's claim address is derived from their account id** and the claim is signed by that key — on testnet the backend holds the derived key and submits the claim on the caller's behalf after verifying who they are. On mainnet this would be the user's own wallet signing it.
  - **The field shows beliefs, never people.** The distribution is unattributed: you see the shape of what people guessed, not who guessed what.
  - **Corroboration is agreement, not approval.** *5 of 7 got Bangladesh* is the same conclusion reached independently — it needs no moderation and can't be gamed by spamming.
  - **The maker payout is not a tip to a person.** The recipient is always one of four demo cause wallets; a Jejak user can never receive. The tip is kept out of the split on purpose (`SupplyFlowPipe` gets `makerTip={0}`), so the estimate isn't quietly inflated — it gets its own line instead.

---

## How to Run Locally

```bash
npm install                  # also installs git hooks (husky): pre-commit runs lint-staged + secretlint
base44 dev                   # Recommended: runs the Base44 backend + frontend together
# or, frontend only against a hosted Base44 app:
cp .env.example .env         # fill in VITE_BASE44_APP_ID / VITE_BASE44_APP_BASE_URL
npm run dev                  # Start Vite dev server

npm run build                # Production build check
npm run lint                 # ESLint
node scripts/validate-data.mjs   # Asserts every product split sums to 100%
deno test base44/shared/         # Tests for the AI trace engine's normalisation rules
deno test src/lib/               # Tests for the delegation lifecycle + observations
deno test base44/shared/ src/lib/  # Both suites
```

### Environment Variables (`.env.example`)
No secrets are required or committed to this repository — everything on-chain is **Stellar Testnet only**.

- `VITE_BASE44_APP_ID`, `VITE_BASE44_APP_BASE_URL` — identify your Base44 app to the frontend SDK client (`src/api/base44Client.js`). Supplied automatically by `base44 dev` / `base44 link`.
- `VITE_BASE44_FUNCTIONS_VERSION` *(optional)* — pin a deployed functions version.

The backend functions in `base44/functions/` take no env vars: the Stellar signer is a deterministic ephemeral Testnet keypair funded via Friendbot (`https://friendbot.stellar.org`), the fee relayer uses its own isolated deterministic Testnet account, and the demo cause wallets are public Testnet addresses committed in source.

---

## Every Claim & Number in the Data Files (and its Basis Label)

Split basis labels (`src/lib/tokens.js`): every cost-split figure is `AI inference` — a category-level estimate, not sourced.
Provenance stage basis badges (`src/pages/Journey.jsx`): `Read from label` (high confidence, only when extracted from a care/Made-in label), `Sample label` (demo label), `Trade data` (country matches UN Comtrade import partners) and `Estimated` (medium/low confidence).

### 1. `src/data/hoodie.js` — Everyday Hoodie (GB £120 / SG S$100)
| Category / Stage | Value / Range | Confidence | Basis Label | Status / Source Needed |
|---|---|---|---|---|
| Materials split | 12% – **15%** – 18% | medium | `AI inference` | Category estimate; needs named apparel BOM benchmark |
| Labour split | 0.5% – **2%** – 4% | medium | `AI inference` | Anchored to Clean Clothes Campaign (~0.6% workers' share) & Deloitte/Oxfam (~2% factory labour in BD); still an estimate |
| Freight & duties split | 7% – **9.5%** – 11% | medium | `AI inference` | Category estimate; needs UN Comtrade / freight tariff citation |
| Brand margin split | 24% – **29%** – 32% | low | `AI inference` | Illustrative estimate |
| Retail margin split | 40% – **44.5%** – 48% | medium | `AI inference` | Category estimate |
| Transparent alternative | Mat 20%, Lab 10%, Frt 10.5%, Brd 18.5%, Ret 41% | low/medium | `AI inference` | Illustrative scenario (`transparentAlternative.note`) |
| Route (5 stops + final) | India (Cotton) → China (Spinning) → Bangladesh (Cut & sew) → Singapore (Hub) → Netherlands (Warehouse) → UK/SG (Sold) | medium | `Estimated` (final manufacture upgrades to `Read from label` when care tag scanned) | Illustrative route; no specific factory claimed |

### 2. `src/data/trainers.js` — Running Trainers (GB £90 / SG S$110)
| Category / Stage | Value / Range | Confidence | Basis Label | Status / Source Needed |
|---|---|---|---|---|
| Materials split | 20% – **25%** – 30% | medium | `AI inference` | Category estimate; needs footwear BOM source |
| Labour split | 2% – **4%** – 7% | medium | `AI inference` | Anchored to Deloitte/Oxfam (~4% factory labour in Vietnam) |
| Freight & duties split | 7% – **9%** – 12% | medium | `AI inference` | Category estimate |
| Brand margin split | 26% – **30%** – 34% | low | `AI inference` | Illustrative estimate |
| Retail margin split | 24% – **32%** – 32% | medium | `AI inference` | Category estimate |
| Transparent alternative | Mat 30%, Lab 14%, Frt 10%, Brd 22%, Ret 24% | low/medium | `AI inference` | Illustrative scenario |
| Route (4 stops + final) | Vietnam (Rubber & foam) → China (Components) → Vietnam (Assembly) → Singapore (Freight hub) → UK/SG (Sold) | medium | `Estimated` | Illustrative route |

### 3. `src/data/coffee.js` — Coffee Bag (GB £6 / SG S$12)
| Category / Stage | Value / Range | Confidence | Basis Label | Status / Source Needed |
|---|---|---|---|---|
| Materials split | 16% – **20%** – 24% | medium | `AI inference` | Category estimate; needs ICO / specialty coffee benchmark |
| Labour split | 4% – **7%** – 11% | medium | `AI inference` | Farm wages on picking; farm-gate is already a small share of shelf price |
| Freight & duties split | 10% – **14%** – 18% | medium | `AI inference` | Category estimate |
| Brand margin split | 20% – **24%** – 28% | low | `AI inference` | Illustrative estimate |
| Retail margin split | 26% – **35%** – 34% | medium | `AI inference` | Category estimate |
| Transparent alternative | Mat 34%, Lab 18%, Frt 13%, Brd 15%, Ret 20% | low/medium | `AI inference` | Illustrative scenario |
| Route (3 stops + final) | Ethiopia (Cherry harvest) → Ethiopia (Processing) → UK (Roasting) → UK/SG (Sold) | medium | `Estimated` | Illustrative route |

### 4. `src/data/phoneCase.js` — Phone Case (GB £25 / SG S$32)
| Category / Stage | Value / Range | Confidence | Basis Label | Status / Source Needed |
|---|---|---|---|---|
| Materials split | 14% – **18%** – 22% | medium | `AI inference` | Category estimate |
| Labour split | 2% – **4%** – 7% | medium | `AI inference` | Anchored to Deloitte/Oxfam (~4% factory labour in China); moulding is less labour-intensive |
| Freight & duties split | 8% – **12%** – 16% | medium | `AI inference` | Category estimate |
| Brand margin split | 26% – **30%** – 34% | low | `AI inference` | Illustrative estimate |
| Retail margin split | 26% – **36%** – 34% | medium | `AI inference` | Category estimate |
| Transparent alternative | Mat 28%, Lab 14%, Frt 14%, Brd 20%, Ret 24% | low/medium | `AI inference` | Illustrative scenario |
| Route (3 stops + final) | China (Plastic & silicone) → China (Assembly) → Singapore (Freight hub) → UK/SG (Sold) | medium | `Estimated` | Illustrative route |

### 5. `src/lib/metrics.js` — Receipt Context Equivalents
| Metric | Formula / Value | Confidence | Basis / Source | Status |
|---|---|---|---|---|
| Distance travelled | Great-circle Haversine sum across route coordinates | high | `Route data` (computed from stops) | Exact math on estimated stops |
| Hours to earn shelf price | Shelf price ÷ ~US$0.55/hr (range $0.45–$0.65/hr, 12,500 BDT/month ÷ 208 hrs) | low | `Bangladesh garment min wage, Dec 2023` | Statutory minimum wage citation; cross-rate fixed at 1.27 USD/GBP, 0.74 USD/SGD |
| Where the tax went | UK VAT 20% (`price × 0.2 / 1.2`), SG GST 9% (`price × 0.09 / 1.09`) | high | `gov.uk` (UK VAT) / `IRAS` (SG GST) | Verified statutory tax rates |
| What the payment cost | UK ~1.5% all-in card processing, SG ~2.0% | medium | `PSD2 interchange cap` | Estimate of merchant acquiring + interchange |

---

## Walkthrough video & social post

See [`docs/submission.md`](./docs/submission.md) for the 30-second and 2-minute walkthrough scripts, the shot list, and post copy for X and LinkedIn.

See [`docs/demo.md`](./docs/demo.md) for the four-beat live demo script, and [`docs/deploy.md`](./docs/deploy.md) for deploying and testnet-verifying the wager before you show it.

---

## License
Released under the [MIT License](./LICENSE).