# Polish — Performance, Transitions & Visual Colour

> **Owner:** Dev A (h8–10 if `/room` ships early) or Dev B as a parallel track during floor push downtime.  
> None of these are blockers for submission. All are **judging multipliers** — especially UX (10% of score) and the demo video.

---

## 1. Page Transitions (1–2h, highest ROI)

### The problem
`AppLayout.jsx` wraps `<Outlet />` in `<AnimatePresence>` but without a `mode` prop or a `key` prop on the outlet — so route transitions don't actually fire. Every page just cuts instantly.

### The fix
Wire `pageVariants` (already defined in `src/lib/motion.js`) as the standard entry/exit for each inner page:

**`src/components/AppLayout.jsx`** — add `mode="wait"` and pass location as key:

```jsx
import { AnimatePresence } from "framer-motion";
import { useLocation, Outlet } from "react-router-dom";

export default function AppLayout() {
  const { immersive } = useApp();
  const location = useLocation();
  return (
    <>
      <AnimatePresence mode="wait">
        <Outlet key={location.pathname} />
      </AnimatePresence>
      <AnimatePresence>
        {!immersive && <TabBar key="tabbar" />}
      </AnimatePresence>
    </>
  );
}
```

**Each inner page** — wrap its root element:

```jsx
import { motion } from "framer-motion";
import { pageVariants } from "@/lib/motion";

// At the top of the return:
<motion.div
  variants={pageVariants}
  initial="initial"
  animate="animate"
  exit="exit"
  transition={{ duration: 0.22, ease: "easeOut" }}
>
  {/* existing content */}
</motion.div>
```

Pages to update: `Flow.jsx`, `Journey.jsx`, `MoneySplit.jsx`, `Journal.jsx`, `Impact.jsx`, `Explore.jsx`, `Room.jsx` (new).

> **Reduced motion:** `pageVariants` should respect `useReducedMotion` — check `src/lib/motion.js` and add a guard if missing.

---

## 2. Font Consistency (30min, cosmetic but noticeable)

### The problem
`tailwind.config.js` defines `font-grotesk` (Schibsted Grotesk), `font-serif-display` (Fraunces), `font-plexmono` (IBM Plex Mono), and `font-hand` (Caveat). The `--font-body` CSS variable and `body { font-family }` in `index.css` both point to **Plus Jakarta Sans** — a font that's not in the Google Fonts `<link>` in `index.html`. This means body text falls back to `ui-sans-serif` (system font) on pages that don't manually set `font-grotesk`.

### The fix
In `src/index.css`, update the body declaration:
```css
body {
  @apply bg-background text-foreground antialiased;
  font-family: "Schibsted Grotesk", ui-sans-serif, system-ui, sans-serif;
}
```

And remove the `Plus Jakarta Sans` references from `--font-heading`, `--font-body`, `--font-display` in the `:root` block (or update them to Schibsted Grotesk / Fraunces as appropriate). The `font-heading` and `font-display` tailwind keys can also be updated in `tailwind.config.js`.

---

## 3. Surface Vivid Colour Tokens on Inner Pages (1–2h, visual impact)

### The problem
The five printing-ink colours (`--j-materials` fern, `--j-labour` turmeric, `--j-freight` indigo, `--j-brand` plum, `--j-retail` rose madder) are used beautifully on Landing in the receipt and map. The inner pages — Journey, MoneySplit, Impact — use them for data only. Headings, section dividers, and accent elements on inner pages are monochrome `journal-ink`.

A parallel set of more vivid `jejak.*` Tailwind tokens (`materials: #2FBF71`, `labour: #FF7A1A`, `freight: #2D5BFF`, `brand: #8B5CF6`, `retail: #FF3D81`) is defined in `tailwind.config.js` but almost entirely unused in inner pages.

### Where to apply (targeted, not wholesale)
- **Journey.jsx** — the stage confidence badge border, and the "Read from label" stamp border, should use `text-journal-stamp` (already done). The route stage heading for each country could use a subtle left-border in the stage's category ink.
- **MoneySplit.jsx** — already uses category inks for the receipt lines. Check that the receipt bar chart uses `var(--j-*)` not hardcoded hex.
- **Impact.jsx** — section headings for the Stellar proof section could use `text-journal-stamp` accent colour.
- **`/room` (new)** — the two counters: "X traced" in `journal-ink`, "Y anchored" in `text-journal-stamp` (the Stellar red). The live feed chips for "Anchored" should be `border-journal-stamp text-journal-stamp` to match the existing stamp system.

---

## 4. PaperGrain on Inner Pages (30min)

### The problem
`PaperGrain` (the subtle paper texture overlay) is only on Landing. Inner pages use `bg-white` or plain background.

### The fix
`PaperGrain` is a lightweight SVG filter overlay — add it to the root element of `Journal.jsx`, `Journey.jsx`, `Impact.jsx`, and `Room.jsx`:

```jsx
import { PaperGrain } from "@/components/journal";

// Inside the page root:
<div className="relative min-h-screen bg-journal-paper">
  <PaperGrain />
  {/* existing content */}
</div>
```

Check if there are performance concerns (it's a CSS filter, not a canvas) — should be fine on modern devices.

---

## 5. Drawer/Sheet Slide Animation (30min)

### The problem
Modal drawers (`DetailDrawer`, `HowWeEstimateDrawer`, `AskBrandSheet`) animate with a simple `opacity: 0 → 1`. On mobile this looks flat — a sheet should slide up from the bottom.

### The fix (already using vaul in deps — use it)
The `vaul` drawer component (already a dependency) handles sheet-from-bottom correctly with spring physics. These drawers are currently hand-rolled with framer-motion. Consider switching the bottom-sheet variants to `vaul`'s `<Drawer>` for correct mobile feel, or update the framer-motion transition:

```jsx
// For bottom sheets:
initial={{ opacity: 0, y: "100%" }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: "100%" }}
transition={{ type: "spring", stiffness: 380, damping: 34 }}
```

---

## Priority Order (if time-constrained)

| # | Item | Time | Impact |
|---|---|---|---|
| 1 | Page transitions (AppLayout + pageVariants) | 1h | High — visible on video |
| 2 | PaperGrain on inner pages | 30min | High — design coherence |
| 3 | Font body fix (Schibsted Grotesk) | 30min | Medium — typography |
| 4 | Colour token surface (Journey/Impact) | 1–2h | Medium — visual richness |
| 5 | Sheet slide animation | 30min | Low — mobile only |

> **Do not spend more than 2h total on polish today.** Ship `/room` first.

---

## Delight Restoration (stretch — only after `/room` + items 1–2 above)

The rebuild (`17d9fa5`) stripped the old mobile app-shell's "delight layer" (viewfinder, guided tour, onboarding, streaks, ambient sea map) to land the editorial system. The architecture already supports the split this restores: **`manifest.json` has `start_url: "/trace"` + `display: standalone`** — an installed PWA skips the landing and opens straight into the app. Web = editorial front door; PWA = camera-first product.

For a hackathon, interaction joy is the differentiator — judges remember how it *feels*. Do NOT resurrect deleted components (they predate the journal system and would clash). Re-create in the new design language:

| Item | What it is in journal-speak | Effort |
|---|---|---|
| **Coin-tap scan affordance** on `/trace` mobile | A big inked "J coin" / specimen-medallion button as the primary camera entry — tap ripples ink, then opens camera | ~1h |
| **Guided micro-tour** on first `/trace` visit | 3 margin notes that point + fade ("snap it", "read the label", "anchor it") — reuse `MarginNote`, `useInView` | ~1.5h |
| **Anchor thud** on ProofDrawer success | The ledger stamp *stamps* down (scale 1.6 → 1, rotate, ink splat) when the tx hash lands — reuse `Stamp` | ~30min |

Hard rule: **max 2h, after `/room` ships and code freeze is met — this is polish-tier, not feature-tier.** If `/room` slips, all of this goes.
