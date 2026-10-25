# Jejak — HackMeridian pitch deck (Scale · Stellar Composed)

Slide-by-slide script, ready to drop into Keynote/Figma. Voice-over notes under each slide. Placeholders marked **[TBD]** — fill before submission.

---

## Slide 1 — Hook
**"Under £3."**

> Of a £120 hoodie, that's our estimate of what reached the people who sewed it. Published breakdowns say under 1%.

**Visual:** field-receipt fragment, labour line circled in red.
**Say:** "This hoodie crossed six countries before it reached me. The people who sewed it saw under £3 of the £120 I paid. Jejak is a field journal for the things you own — it shows that journey, and shows how sure it is."

---

## Slide 2 — The problem
**Nobody can see a supply chain — not consumers, and soon not brands either.**

- Consumers buy with zero provenance; "ethical" is a marketing claim.
- Supply-chain data is scattered: labels, trade statistics, NGO reports, supplier lists.
- Brands will be forced to publish provenance (EU Digital Product Passport) — but there's no consumer-side counterpart.

**Visual:** six-country route sketch, mostly dashed lines.

---

## Slide 3 — The product
**Snap it → trace it → prove it.**

- **Snap:** photo or label of anything you own; vision model identifies it.
- **Trace:** route of likely countries + where the price went (materials/labour/freight/brand/retail), every figure a range with a confidence level.
- **Prove:** one tap anchors a SHA-256 record on Stellar; verification recomputes the hash live from Horizon.

**Three tiers of certainty** — the differentiator:
1. **Read from label** — fact extracted from your item's own tag.
2. **Trade data** — "made in" stop checked against real UN Comtrade import shares (1 in 5 UK hoodies come from Bangladesh — 20.9% of HS 6110 imports by value, 2024).
3. **Estimated** — honest AI inference, labelled as such.

**Visual:** three-screen strip.

---

## Slide 4 — Target user & value proposition
**The shopper who reads the label but can't read the supply chain.**

- Curious buyers who scan things already (Yuka: ~60M users barcode-scanning food; provenance is the same gesture).
- ESG/regulatory tailwind: brands, not consumers, will generate the data — Jejak is the human-readable front-end.
- Value: a private journal of what you own + the strongest honesty guarantee in the category: it shows you where the evidence ends.

---

## Slide 5 — Why Stellar (Stellar Composed)
**Five ecosystem primitives, one product:**

| Piece | Role |
|---|---|
| MEMO_HASH + `manageData` | 32-byte provenance anchoring — no custom contract to audit |
| Soroban smart accounts + WebAuthn verifier | "Jejak Passport" — passkey wallet, no seed phrase, fingerprint sign-in |
| Built-in DEX (XLM/USDC orderbook) | Price oracle for cause payouts — no external API, no Chainlink |
| Fee-sponsored relayer | Users anchor without holding XLM |
| Payment rails + anchors | Corridor cause wallets can cash out to bank accounts on mainnet |

**The real answer:** anchoring a hash is easy anywhere. A fingerprint wallet for a normal person is only native on Stellar.

---

## Slide 6 — Built at HackMeridian (Scale requirement)
**Pre-event:** working Base44 app, first-pass Stellar anchoring.
**During the event** (commits, 19 today):

- **`/room`** — live floor mode: guest trace with no sign-up, ledger-backed counter + feed read from Horizon, stellar.expert links.
- **Provenance legitimacy pass** — UN Comtrade snapshot grounding the "made in" stop; stage-kind model so label evidence lands on the right stage; v2 on-chain record (label photo hash + data-source citation + methods).
- **Re-sourced labour figures** — swapped a 7.5% guess for published wage breakdowns (CCC, Deloitte/Oxfam) + a living-wage line with source.
- **Mobile harmonisation** — stamp shutter, swipeable stops, guided tour, materials swatch.

**On-chain evidence:** anchor tx `[TBD hash]` — timestamped today; verify on stellar.expert.
**Prior work disclosed:** app shell, AI trace engine, automation suite pre-date the event; delta listed above and in `docs/hackmeridian.md`.

---

## Slide 7 — Why now
**Regulation just switched on:**

- EU DPP Registry operational **July 2026**.
- **Battery Passports mandatory Feb 2027** — first live DPP category.
- **Textiles Delegated Act expected 2027** — textiles are a first-priority group.
- **EUDR applies 30 Dec 2026** — provenance proof for commodity supply chains.

Brands must publish provenance in 18–36 months. Jejak is the consumer half of the passport: it holds, verifies, and humanises that data.

---

## Slide 8 — Market & traction
- **Validation by proxy:** barcode-scan-for-info is proven mass behavior (Yuka ~60M users); brands already pay for transparency UX (Sheep Inc, Asket, Chloé DPP pilots).
- **Compliance pull, not push:** DPP data must exist regardless of consumer demand — strongest validation a startup can claim this early.
- **Two-sided loop built in:** brand letter automation + 14-day follow-up measures brand response rate — every letter is a market experiment.
- **Today:** `[TBD: X traces, Y anchored, Z atlas entries]` — numbers taken at submission.

---

## Slide 9 — Business & sustainability model
- **Consumer:** free trace journal; Passport+ for unlimited anchoring & Atlas publishing.
- **Brands:** attestation service — a brand co-signs a record via SEP-1 `stellar.toml` so its signature is bound to its domain; estimate becomes attested claim.
- **Referral:** links only to brands that publish supplier lists (Open Supply Hub contributors, Fashion Transparency Index) — monetisation aligned with the thesis.
- **Corridor payouts:** the cause-wallet rail doubles as verified disbursement infrastructure (Stellar anchors → local bank cash-out).

**Moat:** the anchored evidence record — accumulated provenance history that can't be quietly rewritten.

---

## Slide 10 — Team & roadmap
**Team:** `[TBD names/roles]`

**Next:**
- Brand attestation (SEP-1 stellar.toml) — estimate → attested claim.
- Open Supply Hub integration — real factory lists behind labels.
- Open Food Facts barcodes for food categories.
- DPP interop — ingest published passport data when textiles go live (2027).

**Ask:** judge us on whether a consumer product can make a ledger feel like a paper journal — because that's the adoption path for everything else Stellar wants to do.

**Visual:** closing postcard stamp — "Every thing has a journey."
