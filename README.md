# Jejak — Know the story behind what you buy

> **Lead:** _"Know the story behind what you buy: where your clothes, coffee and gear really came from."_  
> **Layer 2:** _"Follow the money."_

Jejak is an open-source, photo-first **supply-chain provenance and cost-split receipt** built on **Stellar Testnet** for the **Stellar "Find Your Way" Hackathon (General Track)**.

Photograph an item (or pick a sample product), scan its **care / Made-in label** to attach high-confidence provenance facts, inspect its multi-stage route across a 3D globe, and **anchor a tamper-evident SHA-256 provenance record (`MEMO_HASH`) on Stellar Testnet**—verifiable in one click against Stellar Horizon. Then step into Layer 2 ("Follow the money") to see the estimated 5-way cost split and optionally send a Testnet payment to a demo cause wallet.

---

## Architecture & Meaningful Use of Stellar

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
   - In Layer 2 ("Follow the money"), users can send an optional Testnet XLM payment or create an unconditional `ClaimableBalance` (`Operation.createClaimableBalance`) to a **Demo cause wallet (testnet)** with a structured `MEMO_TEXT` (`CAUSE:<PRODUCT>:<REGION>`).
   - Small cross-border payments are costly on card and bank rails; Stellar network fees are a fraction of a cent (`0.00001 XLM` base fee).

4. **Zero-Fail Testnet Resilience:**
   - Every Stellar Testnet and Horizon call has an automatic fallback to a cached, real verified Testnet transaction (`976dc854593180c819797b3606963c4ecbccd83ae8cbec0b9ca47db5c1407ff3` / `d1a60c45d14ad388bcfc4f6194e8bec19fd01035a903e6e81e7181f0ee3caa43`) with a clear notice (*"Testnet is slow right now — here's a recent verified testnet transaction"*), ensuring the app never hard-fails during a live judge run.

5. **Passkey Smart Wallet — "Jejak Passport" (Soroban Smart Accounts):**
   - The Embedded bank view (`/embedded`) offers a **Jejak Passport**: a WebAuthn passkey-backed smart wallet built on the OpenZeppelin `smart-account-kit` architecture (Protocol 27) on Soroban Testnet — no seed phrase or browser extension required (`src/lib/wallet.js`, `src/lib/stellarConfig.js`).
   - **Real contract deployment:** the fee-sponsoring relayer (`base44/functions/stellarFeeRelayer/entry.ts`) deploys a real `multisig-account-example` contract instance via `createContractV2`, constructed with the passkey's secp256r1 public key + credential ID as a `Signer::External` for the audited WebAuthn verifier contract. Every passport gets a **real, resolvable `C...` contract address** on Soroban Testnet (deterministic salt `sha256("jejak-passport:" + credentialId)`), viewable on stellar.expert.
   - The relayer is isolated (its own deterministic Friendbot-funded account), rate-limited per IP, and enforces an allow-list of actions and Protocol 27 contract addresses — users never need to acquire XLM.
   - **Honest limitation:** account admin operations (`add_recovery_signer`, `set_spending_policy`, `sign_session_challenge`) are journaled on the sponsor account via `manageData` — executing them on-chain requires a passkey-signed `__check_auth` authorization that only the client can produce (full smart-account-kit signing flow is future work). If a deployment fails, the relayer falls back to the same journal and the UI marks the account "deployment pending".
   - Users can alternatively **connect an external wallet (Freighter)** for read-only address binding.

6. **Stellar DEX as Price Oracle:**
   - The Layer-2 payment converts the user's fiat amount to XLM using the **live XLM/USDC orderbook midpoint on the Stellar DEX** (mainnet Horizon read-only), rather than a fixed estimate — falling back to a documented heuristic if the orderbook is unreachable.

---

## What's Real vs. Mocked

### Real (Live in this build)
- **Product & Care-Label AI Vision (`base44/functions/identifyProduct/entry.ts`):**
  - `mode: "product"`: classifies photographed items into the curated product set (`hoodie`, `trainers`, `coffee`, `phone_case`) and extracts visual attributes (`colour`, `material`, `category`, `likely_origin`). Unsafe or unmatched images return `unknown` and fall back to the manual picker.
  - `mode: "label"`: extracts `country_of_manufacture`, `fibre_composition`, and `care_or_brand_text` from photographed care tags or "Made in" labels as structured JSON.
- **Private-by-Default Photo Handling:**
  - Product and label photos for vision recognition use `UploadPrivateFile` + short-lived `CreateFileSignedUrl` (stored privately).
  - Community sharing defaults to **Private (`shareMode = "private"`)**. Switching to **Public feed** requires an explicit confirmation before a product photo is uploaded to a public URL (label photos are never uploaded publicly).
- **Live Stellar Testnet & Horizon Integration (`base44/functions/stellarMakerPayout/entry.ts`):**
  - Real `MEMO_HASH` provenance anchoring, live Horizon transaction lookup and SHA-256 verification, live `payment` and `createClaimableBalance` operations on Stellar Testnet, and live Horizon account telemetry on the Impact screen.
- **Jejak Passport Smart Wallet (`src/lib/wallet.js`, `base44/functions/stellarFeeRelayer/entry.ts`):**
  - **Real** Soroban Testnet contract deployment via `createContractV2` — each passport is a real `C...` smart-account instance, fee-sponsored by an isolated relayer account. Admin actions (recovery signer, spending policy) are journaled on the sponsor account rather than executed — labelled honestly as such.
- **Live Explore Feed & "Others Traced This":**
  - Backed by the `Scan` entity with realtime subscriptions. Seeded records carry `is_sample: true` and are badged **Sample** in the UI; single-person real counts (`count === 1`) are hidden so an individual cannot be singled out.

### Mocked / Illustrative (Clearly labelled in the UI)
- **Supply-Chain Route & Cost-Split Percentages:**
  - Upstream stages, country routes, and 5-category cost-split ranges (`low` / `mid` / `high`) are curated category-level estimates, not data from specific named factories or suppliers. Every stage and figure is labelled **Estimated** (unless a care label was scanned for the final-manufacture stage, which is labelled **Read from label**).
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

## 3-Minute Pitch Video Demo Script (Provenance-First)

- **0:00 – 0:25 · The Hook & Scan (Home → Identifying):**
  - Open Jejak on mobile: *"Know the story behind what you buy: where your clothes, coffee and gear really came from."*
  - Tap the shutter to photograph a hoodie (or tap the **Everyday Hoodie** sample card). Show the private AI vision scan extracting visual attributes and launching into the 3D globe.
- **0:25 – 1:10 · Provenance & Care-Label Evidence (Journey Screen):**
  - Spin the 3D route globe across India → China → Bangladesh → Singapore → Netherlands → UK. Point out that each stage carries an honest provenance badge: **Estimated (Medium)**.
  - Tap **Scan label** (or **Try sample label**) on the *Add provenance evidence* card. Show how Jejak extracts `"Made in Bangladesh · 80% cotton, 20% recycled polyester"` and upgrades the final-manufacture stage badge to **Read from label (High)** while keeping upstream stages **Estimated**.
- **1:10 – 2:05 · Core Stellar Feature: Anchor & Verify On-Chain Provenance Record:**
  - Tap **Preview JSON** to show the canonical `jejak.provenance.v1` JSON (stages, label facts, estimate ranges, basis, timestamp — no photos or personal data).
  - Tap **Anchor this trace on Stellar**. Show the SHA-256 digest written as a `MEMO_HASH` transaction on Stellar Testnet, complete with ledger number, QR code, and `stellar.expert` link.
  - Tap **Verify hash on Horizon** — show the live **HASH MATCH** against Horizon Testnet. Then tap **Test altered JSON** to demonstrate how altering a single field in the off-chain JSON produces an immediate **HASH MISMATCH**.
- **2:05 – 2:40 · Layer 2: Follow the Money & Demo Cause Wallet (Money Split Screen):**
  - Tap **Follow the money** to drop the 100 coins across Materials, Labour, Freight, Brand, and Retail.
  - Switch to **Flow & Boost** and send a Testnet payment (or Claimable Balance) to the **Demo cause wallet (testnet)**, noting that Stellar fees are a fraction of a cent (`0.00001 XLM`).
- **2:40 – 3:00 · Explore & Honest Methodology:**
  - Open **Explore** to show community traces with clickable `stellar.expert` links and **Sample** badges on seeded items, then open the **?** drawer to highlight the **What's real vs. mocked** transparency box.

---

## License
Released under the [MIT License](./LICENSE).