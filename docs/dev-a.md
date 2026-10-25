# Dev A — HackMeridian 2026
**Your job today: ship the `/room` feature (new Stellar-composed work)**

> Read `docs/hackmeridian.md` for full context. This sheet is your personal task list.
> Budget: ~10h of build. **Code freeze at hour 10** — whatever is deployed then is what goes in the video.

---

## Your one deliverable: `/room` — Hackathon Floor Mode

A page at `/room` that works without sign-up and proves adoption live during the pitch. The differentiator vs a generic live wall: **the counter and the feed are ledger-backed**, not just DB reads. That is what makes this a Stellar deliverable and not just a page.

**Three parts, in priority order:**

### Part 0 — Auth probe (done: ✅ confirmed open)

Dev B verified: `POST https://jejak.base44.app/api/apps/6ace77fd3de4615d81326900/functions/traceAnything` with `{"description":"...","market":"GB"}` returns **HTTP 200 unauthenticated** (~4s, full AI trace). Guest AI-trace is viable — build it, keep the curated matcher as offline/no-match resilience. Public scans are also world-readable via the entity API (confirmed `GET /api/apps/.../entities/Scan` → 200), and `stellar_tx_hash` is already populated on some records — the ledger-backed feed works as specced.

### Part 1 — Live counter + live feed, ledger-backed (target: done by hour 5)

**New file:** `src/pages/Room.jsx`

- Use the `PaperGrain` background and `Stamp` component (existing design system)
- Query `Scan` entity: `visibility === "public"` AND `created_at >= today UTC` — copy the exact `filter` + `subscribe` pattern from `src/pages/Explore.jsx` (lines ~44–72)
- Display **two counters**, animate with framer-motion on increment:
  - **"X things traced today"** — count of today's public Scans
  - **"Y anchored on Stellar"** — count of those with `stellar_tx_hash` set (the Scan entity already persists `stellar_tx_hash`, `stellar_ledger`, `record_sha256` — no schema change needed)
- Below: a live ticker of the last 5–10 public entries, newest first
  - Each entry: product name, country flag chips, "3 min ago", and — when `stellar_tx_hash` exists — a small **"Anchored · ledger NNNNN"** chip linking to `https://stellar.expert/explorer/testnet/tx/{hash}`
  - Animate new entries in from the top (`AnimatePresence`)

**Add the route to `src/App.jsx`:**
```jsx
<Route path="/room" element={<Room />} />
```
No auth guard — this page must load for strangers. (Public Scans are world-readable per the entity RLS — `visibility != private` — so this works; verify incognito.)

### Part 2 — Guest trace (target: done by hour 8)

Below the counters, a text input:

```
[ Brand + item description, e.g. "Uniqlo hoodie, £60" ] [ Trace it → ]
```

Two paths — **curated-first**, AI second:

1. **Curated match (primary, no auth needed).** Fuzzy-match the input against the four client-side products in `src/data/` (hoodie, trainers, coffee, phone_case — keywords like "hoodie", "sweatshirt", "coffee", "trainers", "sneakers", "phone case"). On match, render `RouteMap` + `Receipt` straight from the data file — instant, works on bad venue wifi, zero backend.
2. **AI trace (only if the Part-0 probe says unauthenticated invoke works).** Otherwise fall through to curated match; on no match, show a friendly "can't estimate that one — try a hoodie, trainers, coffee or phone case" rather than an error.

Then a CTA below the result: **"Save this to your journal →"** → `/register`.

Guest results live in component state only — nothing persisted, nothing hits the Atlas.

**Rate limit:** a simple client-side cooldown (one trace per ~20s per session) plus, if AI-invoke is public, a per-IP cap in the function or a `is_room_guest` flag — a public AI form is spam bait.

### Part 3 — Wire it up to the nav (target: done by hour 9)

- Small "Live" badge/link in `src/components/TabBar.jsx` or `AppLayout.jsx`
- And a landing-page banner: *"See what people are tracing at HackMeridian →"*

---

### Stretch — brand attestation (pick at the hour-8 checkpoint, before USDC)

A second anchor proving the estimate→attested-claim upgrade:

- New deterministic "brand" keypair in `stellarMakerPayout` (same `deriveDeterministicKeypair` pattern, e.g. `jejak-demo-brand-signer-v1`)
- New action `anchor_attestation`: payment + `manageData({name: "jejak_attest_<product>", value: "<userTxHash prefix>"})` + memo text `ATTEST:<PRODUCT>` to the same corridor wallet
- UI: a "Simulate brand co-sign" button on an anchored record, clearly labelled **demo** — consistent with the honesty system
- Demo beat: *"Estimates today; when the brand co-signs, it becomes an attested claim."*

### Stretch 2 — USDC tip (moonshot, only if attestation ships early)

⚠ **Known landmine before you start:** `DEMO_CAUSE_WALLETS` — only **Vietnam and China have `seedTag`** (derivable signers that can create USDC trustlines). Bangladesh and Ethiopia are public-key-only → **no trustline possible**. USDC tips would work for 2 of 4 corridors, plus the sender needs a trustline + testnet USDC balance. Do not start this without budgeting the plumbing.

If you do it: "Tip in USDC" alongside XLM in `MakerBridgeCard`, priced via the existing DEX oracle call, memo `TIP:JEJAK:<PRODUCT>:<REGION>`, clearly labelled Testnet.
Pitch line (honest version): *"tip the corridor cause wallet in USDC, settled on the Stellar DEX for fractions of a cent"* — NOT "tip garment workers" (overclaims; the wallets are labelled demo).

---

## Acceptance criteria before handoff

- [ ] `https://[your-app]/room` loads in a private window (no login)
- [ ] Both counters show real numbers; anchored count increments after a real anchor
- [ ] Live feed shows last 5 public entries, anchored chips link to stellar.expert
- [ ] Guest trace returns a result without login (curated path at minimum)
- [ ] "Save to journal" CTA redirects correctly
- [ ] `npm run lint && npm run build` pass
- [ ] **Deployed to live by hour 10** — Dev B records the video at hour 11 regardless

## When you're done

Tell Dev B — `/room` is the closing shot of the demo video.

Commit message suggestion: `feat: /room hackathon floor mode — guest trace, on-chain counter, live feed`
