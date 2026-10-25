# Dev B — HackMeridian 2026
**Your job today: GTM, floor presence, demo video, pitch deck, and submission**

> Read `docs/hackmeridian.md` for full context. This sheet is your personal task list.
> Total budget: **~17h**. Hard deadlines: Dev A code-freezes at **h10**, video records at **h11**, submission filed by **h15** — leave h15–17 as buffer.

---

## Hours 0–1: Verify + launch artifacts (do these NOW)

### 1. Incognito smoke test of the live URL

Open the live Base44 URL in a **private/incognito window** (no account):
- [ ] Landing page loads — hoodie scroll story plays
- [ ] `/atlas` shows public entries on the map (proves RLS public-read works for strangers — `/room` depends on the same read path)
- [ ] At least 5–8 sample entries visible (the `is_sample: true` ones)
- [ ] **Auth probe for Dev A:** from devtools console, try an unauthenticated `base44.functions.invoke("traceAnything", {...})` (or curl the functions endpoint with no token). Report result to Dev A — it decides whether guest AI-trace ships or the curated fallback does.
- [ ] After login: `/trace` works, ProofDrawer opens, anchor flow reaches the explorer link

If anything is broken, flag it to Dev A immediately — it outranks `/room`.

### 2. QR code

Generate a QR pointing at the live URL (the app already uses `api.qrserver.com` — same service keeps it consistent):
`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=<encoded-live-url>`

Caption: **"Scan to trace what you're wearing"** — laptop lid or table card.

### 3. Social teaser NOW, hero post when `/room` ships

Post a build-in-public teaser immediately (recording below), and hold the hero post for when `/room` + a fresh anchor are live — the better artifact gets the bigger post.

**X / Twitter (teaser):**
```
My £120 hoodie crossed 6 countries and ~21,000 km.
Probably under £3 reached the people who sewed it.

I built Jejak — snap anything you own, trace where it came from,
and anchor the proof on @StellarOrg Testnet forever.

Try it → [YOUR LINK]

#HackMeridian #Stellar #Base44
```

**LinkedIn (teaser):** keep the version already drafted — attach a **15-second screen recording** of the receipt guess→reveal moment (record it now; it's the hook).

### 4. Seed the Atlas

Create and publish 3–5 real traces (set `visibility: public`):
- What you're wearing right now (type brand + price)
- Coffee from the venue
- Your bag/lanyard
- One item with a **care label scan** — the "Read from label" stamp looks great on the map

---

## Hours 1–8: Floor GTM push (parallel to Dev A's build)

### The opening line
> *"What are you wearing right now? Give me a brand and roughly what you paid — I'll show you where it came from and how the money was split."*

Let them guess the labour % before the reveal — the gap is the emotional hook.

### Friction note
Guests on `/room` can't publish (state only). Two ways to log real traces:
- Drive sign-up via the "Save to your journal" CTA (the real funnel — count it)
- Or trace on your own account for them and title it e.g. *"Maria's Allbirds"*, set public, screenshot the Atlas + post it

**Target: 20 real conversations, ≥10 public entries, ≥3 sign-ups — not just entries.**

### Judge / SDF conversations
Lead with the human story, not the tech — then land the ledger.

---

## Hours 8–11: Evidence + deploy gate

- [ ] **Fresh on-chain evidence TODAY** — anchor a trace on the live app so the submission cites a tx hash created during the event (the cached README hashes are Oct 13 — they're the fallback, not the evidence). Save: tx hash, ledger, stellar.expert link.
- [ ] **Pre-deploy one Jejak Passport** so the "verified contract on Soroban Testnet" badge + `C…` explorer link render reliably in demos. Save the contract address.
- [ ] Dev A checkpoint at h8: attestation stretch yes/no. At h10: code freeze, deploy, re-smoke the full loop incognito (anchor → verify → tamper-mismatch → passport → cause payment).
- [ ] Fill in "what did you build during the event" in `docs/hackmeridian.md` §2 — with real commit refs (`git log --since=<event-start>`).
- [ ] **Thematic track saved on the team page: Stellar Composed** — easy to forget, required by the rules.

### If you have downtime during the floor push (parallel polish)

Dev A is heads-down. If you have 30 minutes between conversations, run items 1–2 from `docs/polish.md` (page transitions + PaperGrain) — they're frontend-only changes that don't conflict with Dev A's `/room` work. Skip if the floor is busy — GTM > polish.

## Hours 11–13: Demo video

Record on a **real device** (phone or 1440px desktop). The feel of the app is a selling point.

| Timestamp | On screen | What to say |
|---|---|---|
| 0:00–0:20 | Landing hero — route draws, stamps thud in | "A £120 hoodie probably crossed 21,000 km. Our estimate: under £3 reached the people who sewed it." |
| 0:20–0:50 | Photo → identify → route draws → postmarks drop | "Snap anything. Jejak traces where it came from and says how sure it is." |
| 0:50–1:20 | Money split → guess → reveal → receipt tears | "Guess first. The gap between your guess and the estimate is the whole point." |
| 1:20–1:45 | Anchor on Stellar → Horizon verify → **Test altered JSON** → MISMATCH | "One tap. Anchored on Stellar. Change one field and the hash fails — nobody can quietly change it." |
| 1:45–2:00 | Jejak Passport: fingerprint → real `C…` contract → `/room` live feed | "A wallet that opens with your fingerprint — no seed phrase. And these are real traces from today. Live." |

**If `/room` isn't deployed by h11, record anyway** — close on the Passport contract on stellar.expert instead. No reshoots.

**Prep:** signed in · Reduce motion OFF · 60fps · notifications silenced · ≥10 Atlas entries live.

## Hours 13–15: Pitch deck + submission

### Pitch deck (REQUIRED on Scale track — cover problem, solution, users, value prop, team, vision, business model, market, GTM; ~8 slides is enough)

| # | Slide |
|---|---|
| 1 | **"Under £3."** Full bleed. "Of a £120 hoodie, our estimate of what reached the hands that made it. Published breakdowns say under 1%." |
| 2 | **Solution.** Snap, trace, anchor — three screens. |
| 3 | **Stellar integration.** Five primitives, one product: MEMO_HASH, manageData, ClaimableBalance, DEX oracle, Soroban smart accounts. |
| 4 | **Why now.** EU DPP Registry live July 2026 · textiles delegated act expected 2027 · EUDR obligations Dec 2026 — brands must publish provenance; Jejak is the consumer half. |
| 5 | **Traction.** X traces today · Y Atlas entries · Z people tried it at this event (real numbers). |
| 6 | **New work at this hackathon.** `/room` — guest trace, live ledger-backed counter & feed [+ attestation if it shipped]. |
| 7 | **Model + team.** Freemium consumer + future brand-side co-signing/dashboard. |

### README check (verify only — already done)

The `## Why Stellar, and why now` section + deployed-contract table + proof-layer details are already in `README.md`. Tick the box; only add the `/room` line under "new work".

### Submission checklist

- [ ] GitHub repo is **public**; commits today are clean and attributable
- [ ] README: Why-Stellar section, contract ID table, `/room` note
- [ ] Demo video uploaded (native upload > Loom link)
- [ ] Live URL re-verified incognito
- [ ] On-chain evidence: **fresh** anchor tx + passport contract `C…` + explorer links
- [ ] **Thematic track saved on the team page: Stellar Composed**
- [ ] Prior-work disclosure written: pre-existing app + named delta built today
- [ ] **Submit by h15** — portals crash at deadline; h15–17 is buffer + dry runs

---

## Judge Q&A — your lines (updated)

| Question | Your answer |
|---|---|
| "Is the supply chain data real?" | "Category-level estimates, clearly labelled with confidence + basis. Scan a care label and that stage becomes a verified fact. Competitors pretend certainty — we show the seam." |
| "Why Stellar?" | "Anchoring a hash is easy anywhere — a wallet anyone can open isn't. Stellar's passkey smart accounts sign you in with a fingerprint, no seed phrase — natively, not via an account-abstraction stack. Around that: anchors cost fractions of a cent, and the built-in DEX is our price oracle. The same rail proves the record and pays the corridor." |
| "What did you build today?" | "The `/room` page — guest trace with no sign-up, plus a live counter and feed that are ledger-backed: it counts records anchored on Stellar today, not just rows in our DB." |
| "Business model?" | "Freemium consumer + brand-side co-signing. The EU Digital Product Passport makes brands publish provenance from 2027 — Jejak is the consumer half, and our estimate records are built to be upgraded into attested claims." |
| "Why not just trust the brand's QR code?" | "That's the brand's story. Jejak is the consumer's independent record — anchored on a ledger the brand can't edit." |
| "Isn't this blockchain for its own sake?" | "The anchor proves the estimate we show today is the same one we show next year — anti-greenwashing applied to ourselves. It's also the substrate for brand co-signing." |

---

## Success metrics

| Metric | Target |
|---|---|
| Real conversations at the venue | **20+** |
| Public Atlas entries (non-sample) | **10+** |
| Sign-ups via `/room` CTA | **3+** |
| Social posts | teaser now + hero post when `/room` ships |
| QR code on table | ✅ |
| Fresh anchor tx today | ✅ — this IS the evidence of work |
| Demo video | ✅ by h13 |
| Submission filed | ✅ by h15 |
