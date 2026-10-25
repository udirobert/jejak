# Jejak — a field journal for the things you own

> **Every thing has a journey.**
> *jejak* /jə·dʒak/ (n.) Malay & Indonesian — a trace; a footprint left behind.

Snap anything you own and Jejak traces where it likely came from, who made it, and where your money went. It also tells you how sure it is. Every entry is a page in your field journal: a hand-drawn route, postmarks for each country, and a torn receipt showing how your £120 was split between materials, the people who made it, freight, the brand and the shop.

Built with **Base44** for the **#Base44Challenge**, and entered in **HackMeridian** (Scale · Stellar Composed). The frontend, data, auth, AI, automations and hosting all run on Base44; the Stellar proof layer is documented below and pitched in `docs/hackmeridian.md`.

## Why

Most of us have no idea that a £120 hoodie probably crossed six countries and 21,000 km, or that roughly £9 of it reached the people who sewed it. Jejak makes that visible without preaching. It gives a starting point, not a verdict: every figure is a range with a confidence level, and the app always says which facts were read from a label and which are estimates.

## What it does

| | |
|---|---|
| **Trace anything** | Take a photo, upload one, or just describe the item ("grey merino jumper from Uniqlo"). Base44 AI vision identifies it and sketches its likely supply chain: 2–5 stages, the countries, and a five-way cost split with low/mid/high ranges. |
| **Read the label** | Snap the care tag and the "made in" country becomes a fact. That stage is stamped *read from the label*; everything else stays *estimated*. |
| **Follow the money** | Guess first, then reveal. A torn receipt shows where the money went, with the labour line circled in red pen. |
| **Your journal** | Every trace is saved to your private journal. You can choose to publish any entry to the shared **Atlas** map. |
| **Proof, if you want it** | Any entry can be fingerprinted on a public ledger (Stellar), so no one can quietly change it later. |

## Automations: Jejak does the legwork

All three run as Base44 backend functions with **automations**. Nothing needs a manual step.

1. **A story written for every entry.** This is an entity automation on `Scan` create (`base44/functions/writeJourneyStory`). When you save a trace, an LLM writes a short second-person journal entry. It hedges estimated stages and states label facts plainly. The entry appears live in the app through a realtime subscription, and one tap turns it into a shareable postcard image.
2. **Snap a receipt and every item gets traced.** This is an entity automation on `Receipt` create (`base44/functions/processReceipt`). It reads the receipt photo, turns abbreviations like "MNS CTN TEE BLK" into "Men's black cotton t-shirt", skips fees and bags, then traces up to 8 items in parallel. Each traced item becomes a journal entry and gets its own story, because each new `Scan` triggers automation 1. The receipt fills in line by line on screen as each item finishes.
3. **Ask the brand, without the awkwardness.** `draftBrandLetter` writes a polite, specific transparency request built around the stages Jejak could only estimate. You send it from your own email app; Jejak never emails brands on your behalf. A **scheduled automation** (`brandFollowUps`, daily 09:00 UTC) emails you a nudge if the brand hasn't replied after 14 days.

What this saves: researching one product's supply chain by hand takes hours of reading trade data and brand reports. Jejak gives a first answer in seconds, turns a whole shopping receipt into a journal in about a minute, and does the follow-up for you.

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
| Entities: `Scan` (journal entries; private by default, `visibility` controls the Atlas), `Receipt`, `BrandRequest` | `base44/entities/` |
| AI prompts and JSON schemas (honesty rules live here) | `base44/shared/prompts.ts` |
| Trace engine and output normalisation (ranges fixed, mids always sum to 100, label rule enforced) | `base44/shared/trace.ts` (+ `trace.test.ts`) |
| Vision: product + care label | `base44/functions/identifyProduct` |
| Trace any described item | `base44/functions/traceAnything` |
| Automations | `writeJourneyStory`, `processReceipt`, `brandFollowUps` (see each `function.jsonc`) |
| Brand letters | `base44/functions/draftBrandLetter` |
| Proof layer (Stellar) | `stellarMakerPayout`, `stellarFeeRelayer` |

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
```

### Environment Variables (`.env.example`)
No secrets are required or committed to this repository — everything on-chain is **Stellar Testnet only**.

- `VITE_BASE44_APP_ID`, `VITE_BASE44_APP_BASE_URL` — identify your Base44 app to the frontend SDK client (`src/api/base44Client.js`). Supplied automatically by `base44 dev` / `base44 link`.
- `VITE_BASE44_FUNCTIONS_VERSION` *(optional)* — pin a deployed functions version.

The backend functions in `base44/functions/` take no env vars: the Stellar signer is a deterministic ephemeral Testnet keypair funded via Friendbot (`https://friendbot.stellar.org`), the fee relayer uses its own isolated deterministic Testnet account, and the demo cause wallets are public Testnet addresses committed in source.

---

## Every Claim & Number in the Data Files (and its Basis Label)

Allowed basis labels (`src/lib/tokens.js`): `public price benchmark`, `published brand disclosure`, `trade data`, `AI inference`.  
Provenance stage basis badges (`src/pages/Journey.jsx`): `Read from label` (high confidence, only when extracted from a care/Made-in label) and `Estimated` (medium/low confidence).

### 1. `src/data/hoodie.js` — Everyday Hoodie (GB £120 / SG S$100)
| Category / Stage | Value / Range | Confidence | Basis Label | Status / Source Needed |
|---|---|---|---|---|
| Materials split | 12% – **15%** – 18% | medium | `public price benchmark` | Category estimate; needs named apparel BOM benchmark |
| Labour split | 6% – **7.5%** – 10% | medium | `published brand disclosure` | Category estimate; needs cited brand tear-down |
| Freight & duties split | 7% – **9.5%** – 11% | medium | `trade data` | Category estimate; needs UN Comtrade / freight tariff citation |
| Brand margin split | 24% – **28%** – 32% | low | `AI inference` | Illustrative estimate |
| Retail margin split | 36% – **40%** – 44% | medium | `public price benchmark` | Category estimate |
| Transparent alternative | Mat 22%, Lab 18%, Frt 10%, Brd 20%, Ret 30% | low/medium | `AI inference` / `trade data` | Illustrative scenario (`transparentAlternative.note`) |
| Route (5 stops + final) | India (Cotton) → China (Spinning) → Bangladesh (Cut & sew) → Singapore (Hub) → Netherlands (Warehouse) → UK/SG (Sold) | medium | `Estimated` (final manufacture upgrades to `Read from label` when care tag scanned) | Illustrative route; no specific factory claimed |

### 2. `src/data/trainers.js` — Running Trainers (GB £90 / SG S$110)
| Category / Stage | Value / Range | Confidence | Basis Label | Status / Source Needed |
|---|---|---|---|---|
| Materials split | 20% – **25%** – 30% | medium | `public price benchmark` | Category estimate; needs footwear BOM source |
| Labour split | 6% – **8%** – 11% | medium | `published brand disclosure` | Category estimate; needs cited brand disclosure |
| Freight & duties split | 7% – **9%** – 12% | medium | `trade data` | Category estimate |
| Brand margin split | 26% – **30%** – 34% | low | `AI inference` | Illustrative estimate |
| Retail margin split | 24% – **28%** – 32% | medium | `public price benchmark` | Category estimate |
| Transparent alternative | Mat 30%, Lab 18%, Frt 10%, Brd 22%, Ret 20% | low/medium | `AI inference` / `trade data` | Illustrative scenario |
| Route (4 stops + final) | Vietnam (Rubber & foam) → China (Components) → Vietnam (Assembly) → Singapore (Freight hub) → UK/SG (Sold) | medium | `Estimated` | Illustrative route |

### 3. `src/data/coffee.js` — Coffee Bag (GB £6 / SG S$12)
| Category / Stage | Value / Range | Confidence | Basis Label | Status / Source Needed |
|---|---|---|---|---|
| Materials split | 16% – **20%** – 24% | medium | `public price benchmark` | Category estimate; needs ICO / specialty coffee benchmark |
| Labour split | 8% – **12%** – 16% | medium | `published brand disclosure` | Category estimate |
| Freight & duties split | 10% – **14%** – 18% | medium | `trade data` | Category estimate |
| Brand margin split | 20% – **24%** – 28% | low | `AI inference` | Illustrative estimate |
| Retail margin split | 26% – **30%** – 34% | medium | `public price benchmark` | Category estimate |
| Transparent alternative | Mat 34%, Lab 24%, Frt 13%, Brd 15%, Ret 14% | low/medium | `AI inference` / `trade data` | Illustrative scenario |
| Route (3 stops + final) | Ethiopia (Cherry harvest) → Ethiopia (Processing) → UK (Roasting) → UK/SG (Sold) | medium | `Estimated` | Illustrative route |

### 4. `src/data/phoneCase.js` — Phone Case (GB £25 / SG S$32)
| Category / Stage | Value / Range | Confidence | Basis Label | Status / Source Needed |
|---|---|---|---|---|
| Materials split | 14% – **18%** – 22% | medium | `public price benchmark` | Category estimate |
| Labour split | 7% – **10%** – 13% | medium | `published brand disclosure` | Category estimate |
| Freight & duties split | 8% – **12%** – 16% | medium | `trade data` | Category estimate |
| Brand margin split | 26% – **30%** – 34% | low | `AI inference` | Illustrative estimate |
| Retail margin split | 26% – **30%** – 34% | medium | `public price benchmark` | Category estimate |
| Transparent alternative | Mat 28%, Lab 22%, Frt 14%, Brd 20%, Ret 16% | low/medium | `AI inference` / `trade data` | Illustrative scenario |
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

---

## License
Released under the [MIT License](./LICENSE).