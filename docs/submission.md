# Jejak — #Base44Challenge submission kit

Everything needed for the three submission parts: the product (live link), the process (video) and the post. For the HackMeridian (Stellar) submission kit see `docs/hackmeridian.md`.

**One-line pitch:** Jejak is a field journal for the things you own. Snap anything and it traces where it came from, who made it, and where your money went, and it tells you how sure it is.

---

## 1. The 30-second walkthrough (for the social post)

Format: screen recording with voiceover, 1080×1350 (4:5) for LinkedIn and X. Record the landing page on desktop, then the app on a phone or at a 390px browser width. Use captions, since most people watch on mute.

| Time | On screen | Voiceover / caption |
|---|---|---|
| 0:00–0:04 | Landing hero: "Every thing has a *journey*." The route draws itself and the stamps thud in. | "My hoodie crossed six countries before it reached me — and probably pennies reached the people who sewed it." |
| 0:04–0:09 | Scroll "Follow one hoodie": the map advances stop by stop; the *trade data* bars show who really supplies the UK and *read from the label* stamps in red. | "Jejak traces where things come from, and says how sure it is — including what it can't verify." |
| 0:09–0:14 | Phone: tap the **SNAP** stamp, take a photo. The scan types out the attributes and IDENTIFIED stamps in. | "Snap anything. Base44 AI sketches its supply chain." |
| 0:14–0:19 | Money split: drag the guess slider, tap Reveal. The receipt draws and the labour line gets circled; the living-wage note fades in underneath. | "Then guess how much reached the people who made it — against figures anchored in published wage data." |
| 0:19–0:25 | Journal: upload a shop receipt and watch the lines fill in with TRACED stamps one by one. The story card writes itself. | "Snap a receipt and every item gets traced, with a story written for each. All automatic." |
| 0:25–0:28 | Optional: tap **Proof** — the seal stamps down on the entry. One line of caption, no jargon. | "And you can lock any entry so it can't be quietly changed later." |
| 0:28–0:30 | Closing title card: "Jejak — a field journal for the things you own. Built with @Base44." + small credit line: "entities · functions · automations · auth · hosting". | "Built end to end on Base44." |

> Framing note for the Contra crowd: keep blockchain invisible except the one seal beat — it's a utility, not a topic. The Stellar cut of the same footage shows the technical layer instead (`docs/dev-b.md` §11).

## 2. The 2-minute walkthrough (process and purpose; the judges' "story" score)

Tone: personal, calm, specific. Show the product first, then how it was built.

**0:00–0:20 · Why.**
"I bought a £120 hoodie and realised I had no idea where it came from. The answer: probably six countries, 21,000 km, and — if published breakdowns are right — under £3 to the people who sewed it. Jejak means *trace* or *footprint* in Malay. I wanted a tool that shows that journey honestly, as a starting point rather than a verdict."
*Show:* the landing hero, then the dictionary entry.

**0:20–0:50 · The experience.**
Trace the hoodie sample: the route draws itself, and the *Who supplies the UK* bars appear under "Cut & sew" — real trade data under the estimate.
"There are three kinds of fact here: what we read from your label, what we check against real trade data, and what we can only estimate. It's honest about which is which."
Tap **Try a sample label** and the Bangladesh stop flips to *read from the label* with a stamp — and the materials swatch prints.
Then the guess-then-reveal receipt: "Guess first, because the gap between your guess and the estimate is the whole point."
Optional 5s beat: tap **Proof** — the seal stamps the entry. "And you can lock an entry so it can't be quietly changed later." No jargon.

**0:50–1:30 · Automations, the legwork.**
1. *Describe it:* type "grey merino jumper from Uniqlo" and an AI trace appears in seconds.
2. *Receipt:* upload a real receipt; it fills in live, line by line. "That's an entity automation on Base44. Each item becomes its own journal entry, and each entry triggers a second automation that writes its story."
3. *Ask the brand:* draft the letter, then open it in Mail. "Jejak never emails brands for you. A scheduled automation checks in after two weeks if they haven't replied."
*Optional overlay:* the three `function.jsonc` automation blocks.

**1:30–1:50 · Design process.**
"The art direction is a field journal: paper, ink, postmarks, routes drawn by hand. Four typefaces, one red stamp colour, and one printing ink per money category. Desktop is a real editorial site; mobile is a pocket journal — a stamp shutter you press with your thumb, swipeable stops, and a 20-second tour that drives the app for you."
*Show:* desktop and mobile side by side, and the Atlas.

**1:50–2:00 · Close.**
"Every thing has a journey. Jejak helps you see it. Built end to end on Base44 — entities, functions, automations, auth, hosting."
*Show:* the live URL on screen.

### Shot list / prep checklist
- [ ] Sign in before recording so the journal, stories and receipts work.
- [ ] Prepare a real, readable shop receipt with 3–5 physical items (clothing, food, a gadget).
- [ ] Have a real garment with a visible care label for the label scan.
- [ ] Trace 2–3 items beforehand and publish them to the Atlas so it isn't empty.
- [ ] Make sure the OS "Reduce motion" setting is off so animations play; record at 60fps.
- [ ] Desktop browser at 1440×900 at 100% zoom; phone in light mode with notifications silenced.

---

## 3. The post (tag #Base44Challenge and @Base44)

### X
> My £120 hoodie crossed 6 countries and ~21,000 km before it reached me. Probably under £3 went to the people who sewed it.
>
> I built Jejak, a field journal for the things you own. Snap anything and it traces where it came from and where your money went, and says how sure it is.
>
> Built end to end on @Base44 #Base44Challenge
> [video] [link]

### LinkedIn
> Every thing has a journey. Most of us never see it.
>
> I built **Jejak** (Malay for "trace" or "footprint"), a field journal for the things you own. Snap a photo, describe an item or upload a whole shop receipt, and Jejak sketches its likely supply chain: the countries it passed through, the people who made it, and where each pound of the price probably went.
>
> What I cared about most:
> • **Honesty.** Every figure is a range with a confidence level. Label facts are stamped *read from the label*; the "made in" stop is checked against real UN Comtrade import data; everything else says *estimated*.
> • **Design.** Paper, ink and postmarks: routes that draw themselves, a receipt that fills in as it's traced.
> • **Automation.** Built on @Base44: receipts are read and every item traced automatically, each entry gets an AI-written story, and if you write to a brand, Jejak reminds you two weeks later if they haven't replied.
>
> Not a verdict. A starting point.
>
> Try it: [link] · Walkthrough below.
> #Base44Challenge @Base44

---

## 4. Submission checklist
- [ ] `base44 deploy` from the account that owns the app (see README → Deploying)
- [ ] Smoke test on the live URL: landing → sample trace → label → reveal (signed in) → story appears → receipt upload → letter draft
- [ ] Set the app's social image and favicon in the Base44 dashboard (a postcard export works well as the social image)
- [ ] Record and upload the 30s video (Loom or a native upload; native uploads perform better on X and LinkedIn)
- [ ] Publish the posts with #Base44Challenge and @Base44, then submit the links on the Contra challenge page
