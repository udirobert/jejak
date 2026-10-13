# Jejak — Trace what you pay for

A photo-first **receipt for the physical supply chain**. Photograph a product (or pick a demo chip) and Jejak shows (1) its likely route across the world on a rotating globe and (2) how your payment splits into **materials, labour, freight & duties, brand margin and retail margin**.

Built for the Fintech Hackathon London (13 Oct 2026, Payments track).

> Tagline: _"Trace what you pay for."_

Currency-agnostic: each product carries its own price and split per market — **Singapore dollars (S$)** and **British pounds (£)**, switchable in the header. We never convert via an exchange rate.

---

## What's real vs mocked

**Real (the working app):**
- The full demo flow: Home/Camera → Identifying → Journey → Money split → detail drawers → Compare mode.
- Currency handling and per-market pricing (GBP & SGD via `Intl.NumberFormat`).
- The rotating orthographic globe (d3-geo + world-atlas/topojson, no API keys), route arcs, travelling coin.
- The 100-coin money split, stacked bar, compare-mode reflow, and all motion.
- The embedded banking-feed **concept** screen (clearly labelled as a concept).
- Trust/labelling: every figure is "Estimated", shown as a range, with a confidence badge and a basis label.

**Mocked (illustrative, not fact):**
- **Supply-chain data** — all percentages, routes, countries and context notes are curated estimates for the demo. They are labelled "Estimated" and carry confidence badges. They are **not** sourced from specific factories or suppliers.
- **Product matching** — the camera/file path currently routes to the chosen demo product (photo → hoodie unless another chip is picked). Optional AI recognition is stubbed behind a flag (see below).
- The banking feed is a generic mock with no real bank logos or integration.

## How to run locally

```bash
npm install
npm run dev      # Vite dev server
npm run build    # production build
node scripts/validate-data.mjs   # asserts every split sums to 100
```

### Environment variables
None are required for the core demo. The optional AI recognition path would use a server-side `ANTHROPIC_API_KEY` (never exposed to the client); it is not wired in this prototype — the app gracefully falls back to the product picker, which is the default behaviour.

## Demo script (≈90s)
1. **Home** — tap the gold shutter (or a "Hoodie" chip). Switch currency to £ or S$ in the header.
2. **Identifying** — scanning overlay + rotating status text (~2.5s).
3. **Journey** — globe spins, arcs draw stop by stop, coin travels the route, country chips pop in. Tap **Replay** or **See where your money went**.
4. **Money split** — 100 coins drop into 5 columns; stacked bar; headline garment-worker share (e.g. 6–10p per £1). Tap any column → detail drawer.
5. **Compare mode** — toggle "what if direct from a transparent brand?"; coins reflow, brand/retail shrink, labour/materials grow.
6. **How we estimate this** — open from any screen (the ? in the header) for methodology, confidence meaning, basis types, and what we do **not** know.
7. **Embedded concept** — open `/embedded` for the mock banking feed; tap the **Trace** chip on the hoodie transaction to open the Jejak receipt as a bottom sheet.

---

## Every number and its basis label

Basis labels come only from: `public price benchmark`, `published brand disclosure`, `trade data`, `AI inference`.

### Everyday Hoodie (GB £120 / SG S$100)
| Category | Low–Mid–High % | Confidence | Basis |
|---|---|---|---|
| Materials | 12 / 15 / 18 | medium | public price benchmark |
| Labour | 6 / 7.5 / 10 | medium | published brand disclosure |
| Freight & duties | 7 / 9.5 / 11 | medium | trade data |
| Brand margin | 24 / 28 / 32 | low | AI inference |
| Retail margin | 36 / 40 / 44 | medium | public price benchmark |

Transparent alternative (illustrative): Materials 22, Labour 18, Freight 10, Brand 20, Retail 30 — all `AI inference` except Freight `trade data`.

### Running Trainers (GB £90 / SG S$110)
Materials 25 (public price benchmark), Labour 8 (published brand disclosure), Freight 9 (trade data), Brand 30 (AI inference), Retail 28 (public price benchmark). Transparent: 30/18/10/22/20.

### Coffee Bag (GB £6 / SG S$12)
Materials 20, Labour 12, Freight 14, Brand 24, Retail 30. Transparent: 34/24/13/15/14.

### Phone Case (GB £25 / SG S$32)
Materials 18, Labour 10, Freight 12, Brand 30, Retail 30. Transparent: 28/22/14/20/16.

All **mid** values sum to exactly 100 for every product and scenario (verified by `scripts/validate-data.mjs`).

### Still needing a real source
- Every percentage above is currently an estimate. None is backed by a named, verifiable source.
- Country/stage assignments are illustrative; specific factory or supplier identities are deliberately **not** claimed.
- When real sources are verified, add a `sources` array (title + url) to each product file with a TODO for the team to fill.

---

## Assumptions & what's not finished
- **AI recognition** is not wired (optional, behind a flag in the spec). The camera path routes to the chosen demo product; any failure falls back to the product picker with a low-confidence badge, matching the spec's graceful-fallback requirement.
- **No persistence / no localStorage** — state lives in React context, as specified.
- **Tests**: a runnable validation script (`scripts/validate-data.mjs`) covers split sums and currency formatting. A full vitest suite was not added to avoid adding a dependency; the script gives the same guarantees.
- The globe uses the 110m world atlas for performance; on very low-end devices it still renders (reduced-motion disables the spin).
- Designed mobile-first at 390px; desktop shows the app in a phone-width column centred on a lilac-to-peach backdrop.