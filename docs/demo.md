# The demo

> **Four beats.** Each one has a thing to show, a thing to say, and the failure mode to watch for. The whole thing is about ninety seconds.

---

## Before you start

### Two windows, not two accounts

Both social beats need a field of at least two people, and **seeded records don't count** — they're excluded from corroboration and from the live counts, because seeded data is not a person.

Competing needs **no sign-up**: a guess made signed out is bound to a browser-local id, and two guesses in the same browser are one belief (your latest counts). So:

1. **Window A** — the demo, main browser.
2. **Window B** — a **private/incognito window** of the same browser.

Both trace the same item and both guess. That's a field of two, with no sign-up and no second account.

If you can only manage one window for the live demo, the **Atlas** beat still works at the event: `/room` exists precisely so a room full of people can all trace the same jacket. The field fills itself.

### What has to be live

Everything below needs the deployed backend — the wager's commit, resolve and claim are Base44 functions. See [`deploy.md`](./deploy.md). If the backend is down, the app still works: the split reveals locally, and the wager panel says *"the ledger commit failed — your guess is still revealed locally"* with a retry. That's honest, but it's not the demo.

---

## Beat 1 — The trace shows its work

**Open:** `/trace` → tap the Hoodie specimen.

**What happens:** the identifying screen runs the trace one step at a time — *I read your photo → I matched it to a product type → I pulled import data for the UK → I built the route → I estimated the split* — then a first-person verdict in the margin.

**Say:** *"It doesn't hand you an answer. It shows you what it did — and every number in it is the one it'll show you later."*

**Watch for:** the whole trace takes about six seconds. Don't narrate over it; let it land. The verdict is the payoff — *"I'm fairly sure. Bangladesh supplies 20.9% of the UK's jumpers, sweatshirts & hoodies (knitted), so I routed the final stage there — that's the category though, not your item."*

---

## Beat 2 — A label changes its mind

**Do:** on the journey, scroll to the evidence stop (Stop 03, Cut & sew) and tap **Try a sample label**.

**What happens:** the stop's basis flips from *trade data* to *sample label*, and a margin note appears.

**Say:** *"This is a demo label, and the app knows that — it won't count it as evidence. A real care tag would flip this from 'fairly sure' to 'sure' and say exactly what did not change: one label doesn't price a factory."*

**Watch for:** the label is a *sample*. Point at the stamp. If a judge asks, the answer is that the app deliberately excludes demo labels from the confidence shift, because a demo is not evidence. That's the honesty rule, and it's a feature.

---

## Beat 3 — The wager, and the field

**Do:** continue to the money screen. Slide the guess. Tap **Reveal the split**.

**What happens:** the truth appears on the receipt — and on the same breath the whole field lands on a hand-inked axis: a mark per person, your guess as the vermilion diamond, the app's estimate as the faint band, the real number as the solid rule.

**Say:** *"My guess was committed to a public ledger as a hash before the split was shown. So nobody — including the app — can move it afterwards. And here's the other fourteen people who guessed."*

**Watch for:** if you're the only one in the pool, the copy says *"You're the only one in the pool. The pot opens when somebody else guesses"* — with a **Get someone to beat me** button right there. That's not a dead end; it's the mechanic. **Have window B guess the same item before you present**, so the pool settles and the pot is real.

**If the claim works:** when you're closest, the panel offers **Claim the 10 XLM**. Press it and open the transaction. That's the moment the pot becomes real — a claimable balance on the public ledger, claimable by you and nobody else.

**Say on the claim:** *"The pot is sponsored — no XLM of mine was staked. But the claim is signed by my key, and the balance goes to an address derived from my account, so nobody else can take it."*

**Watch for:** the claim is the least-tested path in the app. **Test it before the demo.** If it fails, the panel says so and offers nothing else — don't pretend.

---

## Beat 4 — What people agree on

**Do:** open the Atlas, or open a shared trace link.

**What happens:** the row says *"5 of 7 got Bangladesh"* — agreement, not approval. Or, on a shared trace, the public page shows the same line plus the field.

**Say:** *"That's not a rating. It's the same conclusion reached independently, which is worth more than any opinion — and because it's agreement, there's nothing to moderate."*

**Watch for:** the Atlas only shows this when two or more *real* people have traced the same product. If it says *"2 traced this · 2 different origins"*, that's the disagreement case — also good copy, and arguably more interesting.

---

## The share loop (if there's time)

**Do:** on the money screen, tap **Challenge a friend to beat it**.

**What it does now:** shares a link to *your actual trace* — `/t/<scanId>` — not the app's front page. The recipient lands on a page showing your route, your split, and what other people agreed on, with a **Trace one like this** button.

**Say:** *"A shared link has to BE the thing. This used to point at the app's home page, which is the same as sharing nothing."*
---

## The fallback

If the backend or testnet is down:

- The trace, the split and the label scan all still work — they're local.
- The wager panel degrades to *"the ledger commit failed — your guess is still revealed locally"* with a retry.
- The proof drawer falls back to a cached, real verified testnet transaction and says so.

Everything still works. Don't pretend the ledger is doing something it isn't.

---

## The four sentences

If you only get to say four sentences, say these:

1. *"It shows you its work — every number is the one it'll show you later."*
2. *"A label moves the estimate. A demo label doesn't, and it knows the difference."*
3. *"My guess went to a public ledger before the answer, so nobody can move it afterwards — and here's everyone else's guess."*
4. *"Not a rating: the same conclusion, reached independently."*
