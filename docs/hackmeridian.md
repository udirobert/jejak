# Jejak — HackMeridian submission kit

Track: **Genesis** (builder) · **Stellar Composed** (thematic).
Sibling doc: `docs/submission.md` covers the #Base44Challenge post and walkthrough.

**One-line pitch:** Jejak is a field journal for the things you own — snap anything and it traces where it came from, where your money went, anchors that record on Stellar so it can't be quietly changed, and opens your wallet with a fingerprint instead of a seed phrase.

---

## 0. Track rationale (why Composed, not Unlocked)

Jejak composes four ecosystem pieces into one product:

1. **OpenZeppelin Protocol 27 smart-account kit** — real `createContractV2` deployments with a WebAuthn secp256r1 signer (the Jejak Passport).
2. **The Stellar DEX** — mainnet XLM/USDC orderbook midpoint used as a live price oracle for the donation conversion.
3. **Horizon** — provenance verification (memo_hash decode + compare) and the Impact screen's live account telemetry.
4. **The payment/asset layer** — corridor cause-wallet payments + `createClaimableBalance`, with a documented SEP-24 anchor off-ramp as future work.

It also exercises core-protocol primitives (Unlocked-adjacent): `MEMO_HASH`, `manageData`, `createContractV2`, `ClaimableBalance`. Enter **Composed** as primary — the product is literally defined by the composition ("what none of them could do alone"), which is exactly what the track asks for.

## 1. The 2-minute demo arc (Stellar-forward)

Judges want meaningful use of Stellar, not a garnish. Lead with the product, land on the ledger.

| Time | On screen | Voiceover |
|---|---|---|
| 0:00–0:15 | Landing hero → scroll "Follow one hoodie" | "A £120 hoodie crosses six countries, and about £9 of it reaches the people who sewed it. Jejak traces that journey — and it says how sure it is." |
| 0:15–0:35 | Snap/label flow: stamp flips to *read from the label* | "Scan the care tag and that stage becomes a fact; everything upstream stays honestly labelled an estimate." |
| 0:35–1:05 | Proof drawer → **Anchor this trace on Stellar** → ledger + tx hash appear → **Verify hash on Horizon** → **Test altered JSON** → HASH MISMATCH | "One tap fingerprints the record — the JSON, the estimates, the label evidence — into a MEMO_HASH on Stellar Testnet. Anyone can re-verify it. Change one field and the hash fails. Brands change their stories; the ledger doesn't." |
| 1:05–1:30 | Jejak Passport: create wallet → FaceID → real `C…` contract address + stellar.expert link | "And the wallet isn't a wallet — it's a Soroban smart account deployed for your passkey. No seed phrase. That's the part only Stellar makes native." |
| 1:30–1:50 | Impact screen: live Horizon feed per corridor + send a £1 cause payment priced off the live DEX orderbook | "The same ledger proves the record and pays the corridor — priced off Stellar's own DEX orderbook, no external oracle." |
| 1:50–2:00 | Landing margin note / close card | "From 2027 EU law makes brands publish this data. Jejak is the consumer half of the Digital Product Passport." |

## 2. Judge Q&A cheat sheet

**Why Stellar?**
Anchoring a hash is easy anywhere — a wallet anyone can open isn't. Stellar's passkey smart accounts (OpenZeppelin kit, WebAuthn secp256r1 verifier) give users a fingerprint sign-in with no seed phrase — natively, not via an account-abstraction stack. Around that: MEMO_HASH anchors at ~0.00001 XLM make "anchor anything you own" economically real, and the built-in DEX is our price oracle with zero external dependencies. The same rail that proves the record settles the corridor payout.

**Why now?**
The EU DPP Registry went live 20 July 2026. Textiles are a first-priority group — delegated act expected 2027; battery passports mandatory Feb 2027; EUDR provenance obligations hit large operators 30 Dec 2026. Brands will be legally forced to publish this data; Jejak is the consumer-side wallet and journal ready to hold it. And the tech arrived with the law: vision models can read a care label from a photo, and passkey smart accounts just shipped.

**Market validation?**
Honest answer: pre-launch, so proxy + pull. Yuka's tens of millions of users prove mass-market scan-a-product behaviour. Brand pilots (Sheep Inc, Asket, Mulberry, Chloé) prove the supply side is spending on transparency UX. And Jejak's own brand-letter loop is a validation engine — every letter sent measures whether a brand answers within 14 days.

**"Isn't this blockchain for its own sake?"**
The anchor proves the estimate we publish today is the same estimate we show you next year — anti-greenwashing applied to ourselves. It's also the substrate for when brands co-sign records: their signature against our hash turns an estimate into an attested claim.

**"The routes are estimates — isn't that misleading?"**
It's the opposite. Every figure carries a confidence level and a basis label; label-scan facts are stamped *read from the label*; verification honestly returns *unverifiable* when the ledger can't be checked rather than faking a result. Competitors pretend to certainty — we show the seam. The prompts enforcing that live in `base44/shared/prompts.ts`.

**"What did you build during the event?"**
[Fill in before submission — list the delta clearly, e.g. "today: X". Judges on Scale/Genesis both want a crisp answer.]

## 3. Submission checklist (HackMeridian requirements)

- [ ] Public GitHub repo — README covers summary, problem, setup, env vars (`.env.example`: `VITE_BASE44_APP_ID`, `VITE_BASE44_APP_BASE_URL`, optional `VITE_BASE44_FUNCTIONS_VERSION`), demo instructions
- [ ] Architecture overview of Stellar usage — README "Proof layer" + contract ID table (`WEBAUTHN_VERIFIER`, account WASM hash, policy contracts)
- [ ] Live public URL judges can explore — [Base44 app URL]
- [ ] Video walkthrough (script above) showing the anchor → verify → tamper-mismatch loop live
- [ ] Onchain evidence on Testnet — [anchor tx hash], [passport contract `C…` address], stellar.expert links
- [ ] Disclose prior work — app predates the event (built for #Base44Challenge); the pitch must name what was built during HackMeridian vs. before
- [ ] Save thematic track on the team page: **Stellar Composed**

## 4. The framing sentence to reuse everywhere

> Jejak isn't a blockchain app — it's a consumer product that happens to need a ledger. The Stellar parts stay invisible until you tap *prove it*.
