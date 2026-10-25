# HackMeridian 2026 — Jejak Hackathon Plan
**Event:** HackMeridian 2026, Lisbon · **Track:** Scale + Stellar Composed  
**Started:** 2026-10-25 · **Budget: ~17h hard deadline**

> Work is split between **Dev A** (new Stellar feature + `/room`) and **Dev B** (GTM + polish + submission). Read your individual file: `docs/dev-a.md` or `docs/dev-b.md`.

---

## The pitch in one sentence
> *"Jejak is the field journal for things you own — snap anything, trace where it came from, follow the money, and anchor the proof on Stellar forever."*

---

## Why we're on Scale track, and what "built today" means

We arrive with a working product. The Scale requirement is **clearly new work during the event**. That new work is:

1. 🆕 **`/room` — Hackathon Floor Mode**: ledger-backed live counter (reads from Stellar, not just DB), guest trace (no sign-up), live feed with anchored-on-Stellar chips → stellar.expert links — **Dev A**
2. 🆕 **Brand attestation stretch**: a second deterministic keypair `manageData`s a reference to the user's anchor hash — "estimate today, attested claim when the brand co-signs" — **Dev A stretch**
3. 🆕 **Fresh on-chain evidence**: anchor a trace during the event so the submission cites a hash timestamped today, not Oct 13 — **Dev B**
4. 🆕 **Performance + visual polish pass**: page transitions, colour system, font consistency — **both (context below)**

### What "built today" answer for judges:
> "The `/room` page — guest trace with no sign-up, plus a live counter and feed that are ledger-backed: it counts records anchored on Stellar today, reading the signer's transaction feed from Horizon, not just rows in our DB."

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
