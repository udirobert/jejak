# Jejak video v2 — beat sheet

Two deliverables from one capture session:

- **Social cut** — 4:5, ~36s (VO is 36.2s; see "open decisions" before locking)
- **Judges cut** — 16:9, ~96s (VO is 94.1s; edit is built to the audio, never `-shortest`)

Camera energy: **social C4** (every beat moves or cuts), **judges C2–3** (drift and holds, energy spent only on the three set pieces: route draw, receipt fill, globe flip).

Hard rules learned from v1:

1. Build the picture to the VO file durations below. `-shortest` clipped 23.4s of judges VO last time.
2. Every capture script: `Page.bringToFront` + a wheel-scroll before `rec.start()`, and an end-frame PNG per shot checked non-blank before moving on (a09 died to backgrounding).
3. Record 0.5s handles head and tail on every shot — transitions and ramps eat them.
4. Social framing comes from **per-shot region crops** in the composition, not one global center crop. Mark the intended 4:5 region at capture time and keep the subject inside it.

Transition vocabulary — three devices, used consistently:

- **Postmark slam-cut** — a stamp thunk is a hard cut. Cut lands on the thunk, not after it.
- **Route-dash wipe** — a drawn route line sweeps the frame edge-to-edge and carries us to the next shot.
- **Match cut** — photo→ink sketch, stamp→stamp, paper-map edge→globe curve. The app's transformations are the transitions.
- Page-tear wipe reserved for exactly one moment (judges montage into j07). No generic fades.

SFX ledger: stamp thunk ×3, pencil-scratch under draw-on, paper tick under receipt fill, one restrained music bed ducked under VO (carve ~−8dB under narration).

---

## Social cut (~36s, 4:5)

VO line timings measured from `audio/social/`:

| Shot | t in/out | VO | Visual | Camera | Transition out |
|------|----------|----|--------|--------|----------------|
| G1 | 0.0–2.6 | s01 (5.5s) | **Cold open:** globe mid-spin, colourful, still being dragged. No logo, no title. | Slow push 100→108% | The ink⇄globe **morph** itself — planet folds into ink atlas |
| G2 | 2.6–5.5 | s01 | Route pencils itself across the ink atlas as "crossed six countries" lands. | Hold, slight settle | **Route-dash wipe** along the drawn line |
| G3 | 5.5–11.1 | s02 (5.6s) | Trace card: the three honesty rows (label-read / trade-checked / estimated). | Slow vertical drift down the rows, 100→106% | Cut on stamp thunk |
| G4 | 11.1–15.0 | s03 (3.9s) | **Signature shot:** polaroid desaturates into self-drawing ink sketch; `IDENTIFIED` stamps on "seconds". | Locked until last stroke; punch to 110% on the thunk | Slam-cut on stamp |
| G5 | 15.0–20.3 | s04 (5.3s) | Guess slider drags down → money orbs/split reveal. | Push 100→112% during the drag, settle on reveal | Route-dash wipe |
| G6 | 20.3–26.3 | s05 (5.9s) | Receipt lines tick in beside the pinned photo — workflows confirmed live. | Lateral pan following the fill | Slam-cut |
| G7 | 26.3–30.0 | s06 (3.8s) | Proof drawer opens, Stellar anchor row. | Push 100→110% | — |
| G8 | 30.0–37.0 | s07 (6.2s) | Journal cards stagger → end card "A field journal for the things you own." | Pull-back 112→100% into end card | End |

Runtime ≈ 37s. Every cut lands inside motion (morph, thunk, reveal, stagger) — nothing cuts between static frames.

## Judges cut (~96s, 16:9)

VO line timings measured from `audio/judges/` — total 94.1s + ~2s of tail:

| Shot | t in/out | VO | Visual | Camera / notes |
|------|----------|----|--------|----------------|
| J1 | 0–3.0 | j01 (14.3s) | Title card resolves to hoodie polaroid | Gentle settle; this is the only title-card open |
| J2 | 3.0–9.0 | j01 | **Ambient sea establishing:** ships plying the Indian Ocean, wave shimmer, plane over the Gulf | Slow pan across the atlas; "six countries" |
| J3 | 9.0–14.3 | j01 | Full corridor route draws + distance counter rolls to 21,000 km; "under three pounds" lands on the money figure | Ramp: hold → accelerate through legs → decelerate into final postmark |
| J4 | 14.3–23.2 | j02 (8.9s) | Landing hero — JEJAK name stamp lands, "trace / footprint" copy | Hold on stamp, drift off |
| J5 | 23.2–33.4 | j03 (10.2s) | Trace detail: three fact rows stamped as VO enumerates them (read / checked / estimated) | Step-pan row to row, in rhythm with the line |
| J6 | 33.4–37.8 | j04 (4.5s) | Guess slider → reveal thunk | Short and sharp; cut on thunk |
| J7 | 37.8–44.5 | j05 (18.8s, 3 beats) | Describe an item → trace appears in seconds | Beat 1 of 3 |
| J8 | 44.5–51.0 | j05 | Receipt photo pinned beside lines ticking in — "entity automation on Base44" | Beat 2; **needs workflows live** |
| J9 | 51.0–56.6 | j05 | Each receipt item → journal card; story writes per entry — "second automation" | Beat 3; stagger carries the cut |
| J10 | 56.6–68.6 | j06 (12.0s) | AskBrandSheet: drafted letter → send → scheduled two-week follow-up chip | Slow push; let the letter type read |
| J11 | 68.6–74.5 | j07 (16.0s, montage) | Atlas ink⇄globe flip + live drag-spin | **Page-tear** in (the one use); match map-edge→globe-curve |
| J12 | 74.5–79.5 | j07 | Desktop editorial spread beside mobile pocket journal | Lateral dolly across the pair |
| J13 | 79.5–84.6 | j07 | Macro details: postmarks, paper grain, corridor ticker cycling, stamp ink | Quick inserts, 1.5–2s each |
| J14 | 84.6–96.0 | j08 (9.5s) | Streak chip → /impact pull → end card "Every thing has a journey." | Pull-back to end card; VO ends 94.1, card breathes to ~96 |

---

## Capture manifest

Re-shoot (new `video/ego/` scripts):

| Script | Shot(s) | Staging notes |
|--------|---------|---------------|
| `shot-globe-flip.mjs` | G1/G2, J11 | Atlas open → toggle Globe → slow drag-spin → morph back to ink. Frontmost tab, steady drag. |
| `shot-journey-draw.mjs` | G2, J3 | Fresh journey load; record from t=0 so the draw-on intro is captured whole. Don't click anything. |
| `shot-transform.mjs` | G4 | Identifying: sample item → polaroid → sketch draw → `IDENTIFIED`. Record through the stamp + 0.5s tail. |
| `shot-ambient-sea.mjs` | J2 | Atlas idle 10s at ocean-zoom; let ships/shimmer carry it. No cursor. |
| `shot-ticker.mjs` | J13 | Empty Atlas sheet, two full ticker rotations. |
| `shot-streak.mjs` | J14 | Home → tap streak chip → /impact lands. |
| `shot-letter.mjs` | J10 | AskBrandSheet open, letter drafted, follow-up chip visible. |
| re-run `a09` path | J7 | Was blank last time — bringToFront + scroll fix from the start. |
| re-run `a06` path | G5, J6 | Existing footage usable; re-shoot only if the orb reveal changed. |

Reuse from `video/raw/` if still accurate: `a01-hero` (J4), `a03`/`a05` (honesty rows), `a10-proof` (G7), `m01-mobile` (J12).

## Locked decisions

1. **Social runtime: ~37s accepted.** All 7 lines stay, including the Stellar lock (s06).
2. **Receipt beat: shot with manual trigger.** `base44 workflows list` shows no workflows — `processReceipt`/`writeJourneyStory`/`brandFollowUps` have never fired. The v2-receipt clip fires `processReceipt` manually with the real `{event:{entity_id}}` payload mid-shot; the fill is genuine function output. To make the "entity automation" VO literally true, the triggers still need wiring in the dashboard.
3. **VO is frozen.** Any script change means re-generating that line and re-timing its shots — `scripts/*.txt` are locked as recorded.
