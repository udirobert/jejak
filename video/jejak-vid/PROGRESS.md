# jejak-vid — fframes build state

## Decisions
- Framework: **fframes** (Rust+SVG, Skia/Metal). ffmpeg for segment prep; fframes for direction.
- Deliverables: social 4:5 1080×1350 (~37s, all 7 VO lines) + judges 16:9 1440×900 (~96s).
- Footage is 1440×900 → judges canvas matches 1:1; social needs per-shot region crops.
- Beat sheet: `video/beat-sheet.md` (shot list, camera moves, transitions, VO timings — locked).
- Transition vocabulary: postmark slam-cut, route-dash wipe, match cut, ONE page-tear (into judges montage J11).
- Camera dial: social C4, judges C2–3.

## Footage (video/raw/, all verified non-blank)
- v2-flow-intro.mp4 18s — polaroid→sketch→IDENTIFIED→journey draw-on; journey mounts at 5.7s
- v2-split.mp4 7s — guess slider→orb reveal
- v2-letter.mp4 6s / v2-letter2.mp4 ~28s — ask-brand sheet open / drafted letter
- v2-ambient.mp4 8s — ships+plane+shimmer · v2-ticker.mp4 12s — corridor ticker (empty-sheet via Scan 404)
- v2-globe.mp4 14.5s — ink⇄planet morph @~1.5-4s, drag spin, morph back
- v2-streak.mp4 5s — chip→/impact (Stellar anchor visible) · v2-describe.mp4 ~35s (journeyAt 10.1)
- v2-receipt.mp4 ~28s — upload 1.6s, manual processReceipt invoke 13.1s, lines traced 15.6s
- Reusable v1: a01-hero, a05-label, a10-proof, m01-mobile · cards: cards/title-169.png, end-169.png
- VO: audio/social/s01-07.mp3 (36.2s total), audio/judges/j01-08.mp3 (94.1s total)

## fframes API gotchas (verified in spike)
- `get_synced_video_frame(ctx, name, &SyncVideoFrameInput{start_from:scene_secs, looping, editor_fallback_image})`
  → `Arc<impl FFramesSyncedVideoFrame>`; import trait `fframes::FFramesSyncedVideoFrame`; `clip.into_image().href()`
- `start_from` = SCENE TIME when clip starts, NOT source seek → pre-trim every shot to its own mp4 via ffmpeg
- Clip shorter than scene → blank (returns None at end). Always trim with tail padding.
- `frame.animate(&self.anim)` needs `&KeyFramesAnimation` — store `timeline!(...)` fields on scene structs (scenes need `#[derive(Debug)]`).
- Scenes: `Scenes::from(vec![&self.a as &dyn Scene, &self.b])`; `Overlap::Previous(0.45)` renders both scenes during handoff.
- Runtime media: `MediaDirectory::read_folder("assets")` + `CombinedMediaProvider::from([&static_media, &runtime])` in main.rs; video struct keeps `&static_media`.
- Verify loop: `cargo run --release -- timeline | inspect | strip all -n N | frame T | render -o x.mp4` (9s ≈ 23.5s render).

## Audio assets staged (jejak-vid/assets/)
- sfx/: whoosh-short, whoosh, whoosh-cinematic, click, click-soft, key-press, typing, chime, ping, riser, impact-bass-1/2
- bgm/: elcaro-bed.mp3 79.7s, music-bed.mp3 170s, music-bed-196/-23 200s, alpaca-bed 8s (drop)
- TODO: copy jejak VO mp3s into assets/ for both cuts.

## App state notes
- Fixed+deployed: DetailDrawer null-product crash; guards on markets[market] reads. Deploy = `base44 build` THEN `base44 deploy --yes` (never plain npm run build + deploy — bakes appId=undefined).
- Workflows DON'T exist server-side (receipt was manual-triggered on camera). writeJourneyStory/brandFollowUps also absent.

## Next
1. Conform pass: script trims all G*/J* segments with padding into assets/seg-*.mp4
2. Two Video impls: social (1080×1350, per-shot crop) + judges (1440×900)
3. Audio: VO per beat timing, bed duck_under_voice(), impact-bass on slam-cuts, whoosh on wipes
4. Loop: inspect → strip per scene → audio analyze → render; user previews via `preview Ns`

## Build state (post-spike)
- `video/conform.sh` cut 18 segments into `assets/seg-*.mp4` (all 1440×900 @30fps) + VO mp3s copied to assets/
- `src/lib.rs` rewritten: `Shot` scene type (clip/still + eased focus-rect camera: z0→z1 zoom, fx/fy pan, whip_in, tear, label), `SocialCut` (1080×1350, 8 shots) + `JudgesCut` (1440×900, 14 shots); `src/main.rs` `--cut social|judges` selects impl + gpu ctx size.
- VO cue times in `social_vo::S` / `judges_vo::S` consts. Beds: elcaro-bed (social), music-bed (judges), duck_under_voice, whoosh/impact-bass SFX.
- KNOWN RISKS to check on first compile/render: (a) `Overlap::Previous(0.)` may need a None variant instead of 0; (b) CSS `clip-path: polygon()` likely unsupported by usvgr — page-tear may need SVG `<clipPath>`; (c) `ImageData::href()` may return non-str type; (d) label text needs IBM Plex Mono font file in media/ (missing → inspect warning); (e) `run()` fn in main.rs is dead code — safe to delete on cleanup; (f) unused imports warnings ok to fix.
- social focus: 4:5 cover = scale 1.5 on 1440×900 src; fy/fx choose the visible region.

## v2 renders done
- `video/out/jejak-judges-v2.mp4` — 96.0s, 1440x900, all 8 VO lines, music-bed ducked, SFX placed. Render ~590s.
- `video/out/jejak-social-v2.mp4` — 36.9s, 1080x1350 (4:5), all 7 VO lines, elcaro-bed. Render ~170s.
- Audio: -15.0 LUFS integrated, -1.0 dBTP, 0 clipped (master_gain_db: 5.5 in RenderOptions).
- Fixed en route: `tpad` needs `stop_duration` (secs) not `stop` (frames); v2-flow-intro is only 11.6s so honesty beat needed dedicated recapture -> `video/raw/v2-honesty.mp4` (16.3s parked on drawn journey); `Shot` needs manual `Default` impl with fx/fy=0.5 (derive gives 0.0 = top-left crop bug); inspect clean both cuts; rendered-frame spot checks all non-blank and correctly framed.
- Preview for user: `cd video/jejak-vid && cargo run --release -- preview Ns` / `-- --cut social preview Ns`.

## HackMeridian plan
- Full submission plan written to `/Users/udingethe/Dev/jejak/HACKMERIDIAN.md` — Genesis + Stellar Composed, "why Stellar" stack, wager-pool feature spec (commit→stake→reveal→settle), StellarCut video plan, repo checklist.
- Workflows now LIVE: all 3 fired end-to-end (Receipt→processReceipt 14.6s; Scan→writeJourneyStory ×4). "Automation" VO is now literally true.

## Wager feature (HackMeridian) — built, deploying next
- `base44/functions/guessPool/entry.ts` — new fn, actions: `commit` (SHA-256 guess hash → Memo.hash anchor tx on testnet, Guess entity create), `resolve` (rank committed guesses vs labour_pct, winner gets claimable balance POT_XLM=10 to derived winner addr), `pool_state`. Signer seed: `jejak-guess-pool-signer-v1`. deno check fails locally on npm:@stellar/stellar-sdk — expected like the other stellar fns; esbuild syntax check passed.
- `src/pages/MoneySplit.jsx` — `handleReveal` now: setGuessedLabourPct + invoke guessPool commit → resolve(labour.pct.mid); renders "guess anchored onchain · sha:…" + "pool won/settled · settle tx" links under the receipt (state: guessProof/poolResult).
- TODO: npm run lint + build → `base44 build` → `npx base44 deploy --yes` (build FIRST for app id) → invoke commit+resolve via /api/apps/{id}/functions/guessPool to verify → check tx on stellar.expert.

## Wager DEPLOYED + verified on testnet
- guessPool + Guess entity live. Commits anchor via Memo.hash payment (pool signer `jejak-guess-pool-signer-v1`); resolve pays winner via claimable balance (10 XLM pot). Verified txs: commit `3f90061a…`, settle `cfe9f2b9…` ledger 5393274. MoneySplit reveals "guess anchored onchain" + settle links.
- Memo.hash takes hex STRING not bytes (fixed). Entities need base44/entities/*.jsonc + deploy (not auto-created). Page-eval timeouts in ego: calls still land — check pool_state instead of awaiting.
- Remaining for submission: README arch section, repo public check, real anchor tx evidence, prior-work disclosure, StellarCut video.

## StellarCut captures (v3)
- `video/raw/v3-explorer.mp4` GOOD — stellar.expert settle tx cfe9f2b9 live page (Successful + claimable-balance op).
- v3-passport/v3-stake FAILED: navigation never left journey screen. Real selectors: Journey→split = JournalButton "Where did the {price} go? →" (clickText("where did the")); passport opens via ImpactOnChainView card (setPassportOpen at lines 339/373 — not a plain-text "passport" button; check element around there). Journey screen chain: identifying→journey draws→[Where did the £X go?] button. For passport shot: /impact → find card containing "Your Jejak passport"/"open" text.
- StellarCut scene plan: passport sheet → stake/commit on split (guess anchored onchain + settle tx links) → explorer tx page → end card. ~30-40s.

## v3 capture status
- v3-explorer.mp4 GOOD (settle tx live on stellar.expert).
- v3-stake.mp4: reached split + reveal w/ guess=18 (£21.60), BUT commit never created a Guess (pool_state shows only API-test guesses) → frontend `base44.functions.invoke("guessPool")` path failed silently (.catch swallows) or timed out >40s. Debug: add console logging or invoke via REST in capture like the API test (works reliably — used for all verified txs).
- v3-passport.mp4: /impact has NO passport card for this account (no wallet session → card doesn't render). Options: create passport session first via sheet, or /embedded route exposes JejakPassportSheet (src/pages/Embedded.jsx imports it).

## StellarCut — invoke bug root-caused + stake capture landed (2026-10-26)
- Root cause found: NOT auth/session. `base44.functions.invoke` returns an
  axios-style envelope — payload is at `res.data.ok`, not `res.ok`. The commit
  was landing onchain all along (Guess "hoodie"/18%/tx dcf786e5 confirmed in
  entity list); the UI discarded the result and never fired resolve.
- A parallel session's rewrite of the same section had the identical bug —
  reconciled to their structure (commitGuess + retry) with the `r?.data || r`
  unwrap fixed in both places.
- Redeployed. v3-stake.mp4 reshot (251 frames): anchor link + settle tx both
  render on the receipt at ~14s. anchoredAt=14.4s.
- Still missing: v3-passport (needs a wallet session — this test account has
  none; sheet only renders with a session or via /embedded).

## v3 captures — FIXED & VERIFIED (2026-10-26)
- MoneySplit.jsx: silent .catch removed; anchorState idle|anchoring|anchored|failed with visible states + retry button. Deployed.
- v3-stellar3.mjs: auth-wait on /journal before any invoke; passport via /impact -> "The record" tab -> "Create passport".
- v3-stake.mp4: anchored in 12.4s, 0 retries. Receipt shows GUESS ANCHORED ONCHAIN + POOL SETTLED beats. GOOD.
- v3-passport.mp4: sheet open, "no seed phrase" copy visible. GOOD.
- v3-explorer.mp4: already good (settle tx on stellar.expert, Successful, claimable-balance op).
- All three StellarCut captures now exist. Next: StellarCut impl in jejak-vid.

## StellarCut v2 (2026-10-26)
- Rebuilt from critique: title-card cold open, primitive-named labels
  (OZ Smart Account Kit / memo-hash commit / CAP-23 claimable balance),
  bridge card ("your guess is hashed before the reveal — the pot goes to
  the closest guess"), explorer stretched to 4.2s pushing on the op row,
  end card = end-stellar-169.png ("BUILT ON STELLAR" + primitives line).
- Cards added to video/assets/cards.html (#bridge, #end-stellar),
  screenshotted via ego-browser -> cards_media/ + assets/.
- Found+fixed real bug: shots longer than their clips render BLANK past
  EOF (fframes returns None, no hold-last-frame). Fixed by extending
  source clips: tpad=stop_mode=clone on stake (7.2s) and explorer (4.5s).
- Final: 22.5s, 6 shots. Rendered to stellar-cut.mp4 ->
  ~/Downloads/jejak-stellar-cut-v2.mp4

## JudgesCut woven with Stellar block (2026-10-26) — SUBMISSION CUT
- J15-17 inserted before end card: stellar-passport 4s (label: OZ Smart
  Account Kit) -> stellar-stake 4.5s whip (MEMO-HASH COMMIT·SHA-256) ->
  stellar-explorer 4.0s push on op row (CAP-23 CLAIMABLE BALANCE).
- End card swapped to end-stellar-169.png (BUILT ON STELLAR + primitives).
- j08 (Base44 closer) replaced by j09 — ElevenLabs eleven_v4, George voice,
  17.1s, cue 86.4: "...the wager proves it on Stellar. Guesses hash
  on-ledger, the pot settles by claimable balance, the wallet is a passkey
  smart account. Built on Base44. Anchored on Stellar." Ends ON the card.
- SFX retimed: whoosh 89.3 (stake whip), impact-bass-2 93.5 (explorer).
- Render: video/out/jejak-judges-stellar.mp4 — 104.7s, 3141f, 37MB ->
  ~/Downloads/jejak-judges-stellar.mp4

## j07 swapped to Stellar composition line (deadline pass)
- Design narration replaced (user call): "Underneath, it composes Stellar
  primitives: an OpenZeppelin passkey account, no seed phrase; guesses
  hash-committed on-ledger; pots settling by claimable balance. The
  protocol holds it, not us." — eleven_v4, George, 14.6s over same montage
  (globe-flip/ticker/streak, 70.1–86.1s). Same filename = no code change.
- Rerendered -> out/jejak-judges-stellar.mp4 -> ~/Downloads/. 104.7s.
- Structure now: product story -> j07 "how it composes" -> J15-17 visual
  proof block -> j09 closer on end-stellar card.

## Pitch deck (deadline pass)
- docs/pitch-deck.html — 10 slides, field-journal design (same system as
  video cards): cover / problem (£120→£2.40) / solution / the-wager-new /
  why-Stellar 4 primitives / evidence txs / users+value / market+model /
  vision+team / end card. Print-ready 1280x720.
- PDF via headless Chrome -> docs/jejak-pitch-deck.pdf (10p, 369KB) ->
  ~/Downloads/. Fonts render correctly.
