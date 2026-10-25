# Provenance legitimacy: audit and fixes (25 Oct, during HackMeridian)

Jejak's pitch is honesty: every figure shows what it rests on. This audit checks that claim against the code. Several places didn't hold up. Everything below was found and fixed during the event.

## What the audit found

### 1. The "four locations" weren't based on data
- Four hand-written products (`src/data/*.js`) each map to one demo cause wallet: Bangladesh, Vietnam, Ethiopia, China. Vision could only match a photo to one of those four.
- The map only knew 10 hardcoded countries (`ORIGIN_COORDS`). Any other origin an AI trace produced never got a dot.
- The Atlas defaulted unknown origins to Bangladesh (`s.origin || "Bangladesh"`, and the sea-route fallback used Bangladesh's coordinates).
- A scan's `origin` was `route[0]`, the raw-material stop (cotton farm), but a care label names the country where it was made. The two disagreed.
- Real trade data shows what was missing. UK imports of HS 6110 (knitted jumpers, sweatshirts and hoodies) in 2024 were $2.78B. China 27.7%, Bangladesh 20.9%, Türkiye 9.8%, Cambodia 9.6%, Pakistan 6.4%, Italy 6.4%. Türkiye, Pakistan, Italy and Portugal weren't on the map.

### 2. Vision does less than the copy claimed
- `identifyProduct` (vision model through Base44 `InvokeLLM`) sorts the photo into one of four products. If it's sure, you get that product's fixed route, so every hoodie photo got the same India → China → Bangladesh route. If it isn't sure, it writes a one-line description and a text-only AI writes the trace.
- Label reading (`mode: "label"`) is the one genuinely evidence-based step. It reads the "Made in" country and the materials off the tag.
- The loading copy ("Detecting edges & colour…") described processing that doesn't happen. "Likely origin" from a photo was a guess presented as a reading. You can't tell where something was made by looking at it.

### 3. The source labels were self-assigned
- The AI picked its own basis label from `{public price benchmark, published brand disclosure, trade data, AI inference}`. Nothing ever looked up trade data or a disclosure.
- The hand-written products claimed "published brand disclosure" and "trade data" with no sources (`// TODO: add sources`).
- Known open risk: the hand-written labour shares (for example 7.5% for the hoodie) are well above commonly cited garment price breakdowns, where wages are often around 1% of the retail price. Treat the split figures as AI estimates until they're re-sourced.

### 4. Label evidence went to the wrong stop
- Journey and the proof record treated `route.length - 2` as the "made in" stop. That index is the warehouse (Netherlands) for the hoodie, Singapore for trainers and the phone case, and UK roasting for coffee. So "Made in Bangladesh" relabelled the warehouse.
- Sample labels (the demo button) were anchored as `"Read from label"`, confidence `high`.

## Fixes

| # | Fix | Effect |
|---|---|---|
| 1 | Honest labels: every split figure says `AI inference` unless a real source was used. Removed the scan-theatre copy. Stopped showing "likely origin" from a photo. | No label claims a source we didn't use |
| 2 | Trade data: a UN Comtrade snapshot (`src/data/trade/imports.json`, made by `scripts/fetch-trade-snapshot.mjs`) of each market's import shares by country, for 14 product codes. The "made in" stop shows who actually supplies the UK or Singapore with that product. A label scan narrows it to one confirmed country. | Estimates rest on public data with a citation and a year |
| 3 | Explicit stage kinds (`raw_material / processing / final_manufacture / logistics`). The label and the trade data apply to the right stop. | Fixes the warehouse bug |
| 4 | Proof record v2: label photo SHA-256, sample-label flag, trade-data citation and method notes are all anchored. | The ledger records what evidence the claim stood on |
| 5 | Map: country table expanded to 45 countries (`src/data/trade/countries.json`). No Bangladesh default. Origin = the country where it was made. | The Atlas shows real diversity |

## How trade data is used, and its limits
- Source: UN Comtrade public preview API, imports by partner country, primary value in USD, latest year available (2024). Snapshot committed; no live calls at runtime. Regenerate with `node scripts/fetch-trade-snapshot.mjs`.
- It shows the country the market imports from, which is usually where the product was last substantially transformed. It does not show which factory made your item.
- Coffee uses green (unroasted) beans (HS 090111) so it shows where coffee is grown, not where it's roasted.
- Phone cases use HS 392690 ("other plastic articles"), a broad stand-in flagged as such in the UI.
- An AI trace picks its product code itself. The UI says "matched by AI" so that step isn't presented as fact.

## Roadmap (not built)
- Open Supply Hub: real factory lists by brand (API is paid or trial).
- Open Food Facts: origins from food barcodes.
- Brand attestation through SEP-1 `stellar.toml`: the brand's signing key is published on its own website, so its co-signature is tied to a real domain. That's the honest route from "estimated" to "attested".
