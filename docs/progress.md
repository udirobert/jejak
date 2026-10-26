# Where the project is

> **A status document, not a plan.** What's live, what's verified, what isn't, and what comes next. Updated as things actually ship.

**As of:** 26 Oct 2026, HackMeridian (Genesis · Stellar Composed)

**Live app:** https://jejak.base44.app
**Base44 app id:** `6ace77fd3de4615d81326900`

---

## 1 · What the product is now

A traceability app that **shows its work**. The differentiator was never the map or the receipt — it's that the app tells you how sure it is, why, and what would change its mind.

Five behaviours, in the order they matter:

| | |
|---|---|
| **It shows its labour** | The identifying screen renders the trace one step at a time — *I read your photo → I matched it to a product type → I pulled import data for the UK → I built the route → I estimated the split* — each line read from the same helpers the rest of the app uses, closing with a first-person verdict whose reasoning actually follows from the data. |
| **It speaks as a someone** | *"I'm fairly sure. Bangladesh supplies 20.9% of the UK's jumpers, sweatshirts & hoodies (knitted), so I routed the final stage there — that's the category though, not your item."* |
| **It changes its mind** | A care tag moves the origin from *fairly sure* to *sure*, and says what did **not** change: one label doesn't price a factory. |
| **It takes things off your plate** | A brand letter becomes a task with a clock-derived state — *drafted → sent → awaiting reply → flagged after 14 days*. The follow-up is drafted; the send button stays yours. |
| **It says something you didn't ask for** | The journal opens with what it noticed — two of your items from the same country, a letter nobody answered, a set of traces with no label. All derived from your own records. |

Specs: [`agentic.md`](./agentic.md) · [`social.md`](./social.md)

---

## 2 · What's live and verified

Checked against production, not against the repo.

| Thing | Status | Evidence |
|---|---|---|
| Frontend deploy | **Live** | The deployed bundle contains the trace steps, the wager panel, the observations, the shared-trace route and the corroboration line. |
| `guessPool` deploy | **Live** | `POST /api/apps/6ace77fd3de4615d81326900/functions/guessPool` returns the new response shape (`eligible_count`, `revealed`, `field_pcts`, `settlement`). |
| Guess commit | **Verified on testnet** | Tx `61b78270e882612c2b3c7d9ebdc469a043bc867e5f06b1da59af0bbcb185ae36`, **ledger 5399535**, `memo_type: hash` — the guess hash is on the public ledger before the reveal. |
| Pool resolve | **Verified** | Returns the field, the distribution, the median, your rank, and `you_won` computed server-side. |
| Reveal lock | **Verified** | `pool_state` returns the *count* of guessers before the reveal but an empty `distribution` — the crowd can't be copied before the answer is out. |
| Claim path | **NOT verified** | The `claim` action exists and is wired (it refuses correctly with `nothing_to_claim`), but a successful claim has never executed. See §4. |
| Sign-up-free competing | **Pending deploy** | The change that lets a signed-out visitor compete landed after the last deploy. |
| Category-wide pools | **Pending deploy** | Same. |

**Checks:** lint clean · build clean · 62 deno tests pass · data validation OK · `deno check` OK on every non-Stellar function.

---

## 3 · What changed most recently

**The social layer was correct but unusable.** Four things stopped people meeting each other in it, all now fixed:

1. **Pools were keyed by product instance.** An AI-traced id is `ai-${slug}-${hash(description)}` — so two people photographing *the same jacket* landed in different pools. Pools are now keyed by **HS code**, which is what "the same kind of product" actually means. And because everyone in a pool must be compared against the same truth, the truth is the category's estimate rather than whichever person's trace resolved it.
2. **A solo pool settled instantly.** The first person through the door won a contested-looking pot alone, which makes the wager a note to yourself. A pool of one now doesn't settle — it says so and offers a share button right there.
3. **Signed-out visitors couldn't win.** A booth where nobody signs up had a permanently empty field. Competing now needs no account.
4. **Every shared link was dead.** The code pointed at `jejak-trace-flow.base44.app`; the app is served from `jejak.base44.app`. The origin is now read at runtime so it can't drift again.

Plus two discoverability fixes: the count of guessers shows **before** you guess, and publishing to the Atlas is offered where the trace has just proved itself (it was a toggle in the far column, which is why the shared map stayed empty).

**A design-system bug worth knowing about:** the `journal` palette was defined as plain CSS vars, so Tailwind could not apply an opacity modifier to it — every `bg-journal-ink/60` / `border-journal-stamp/40` rule in the app was silently dropped. **97 usages across 28 files** were rendering transparent. Fixed by defining the palette through `--j-*-rgb` channel vars; 44 opacity variants now generate where there were none.

---

## 4 · What's still open

| | |
|---|---|
| **The claim has never run** | The one thing in the app that moves money. Run §2.3 of [`deploy.md`](./deploy.md) before you demo it. The symptom table says what each failure means. |
| **The pot needs two people** | By design. Two private windows are enough — no sign-up needed. |
| **Kudos tips to another person** | The pot is claimable by a demo cause wallet, never by a Jejak user. Making a user claimable needs the passport to be a *claimant* on a claimable balance, which the fee relayer can't do — it journals on the sponsor account. The Stellar primitives are right; the plumbing isn't. |
| **No profiles, comments, followers, ratings** | Deliberate. They need moderation, moderation needs a team, and a traceability app has no reason to become a network. Corroboration gets the value without the cost. |
| **Social copy is client-side** | The OG tags are injected by JavaScript, which crawlers don't run. The share *card image* is what carries the preview. A real server-rendered OG card needs a prerender step this stack doesn't have. |

---

## 5 · The next three things

1. **Deploy** and run the testnet script in [`deploy.md`](./deploy.md) — especially the claim.
2. **Run the demo** — [`demo.md`](./demo.md) has the four beats, what to say, and the failure mode for each.
3. **Capture the video** — the `video/jejak-vid` project is in the repo; the `StellarCut` impl is the shot list to extend.

The one-line version for judges:

> *"Three things. `/room` — guest trace with no sign-up, plus a live counter and feed backed by the ledger, not the database. A provenance-legitimacy pass: the 'made in' stop is checked against real UN Comtrade import data, label evidence lands on the correct stage, and the on-chain record includes the label photo's hash and the data source. And an agentic layer: the trace shows its work step by step, a care tag visibly moves the estimate, a brand letter becomes a task the app follows up on, and the journal opens with what the app noticed on its own."*

---

## 6 · Where everything lives

| | |
|---|---|
| Design system primitives | `src/components/journal/` |
| The agentic layer — spec | [`agentic.md`](./agentic.md) |
| The social layer — spec | [`social.md`](./social.md) |
| Demo script | [`demo.md`](./demo.md) |
| Deploy + testnet runbook | [`deploy.md`](./deploy.md) |
| Hackathon submission | [`hackmeridian.md`](./hackmeridian.md) · [`../HACKMERIDIAN.md`](../HACKMERIDIAN.md) |
| Provenance audit | [`legitimacy.md`](./legitimacy.md) |
| Polish plan | [`polish.md`](./polish.md) |
| Wager field maths | `base44/shared/guess.ts` |
