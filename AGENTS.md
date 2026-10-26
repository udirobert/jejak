# AGENTS.md

## Project Context

This is a Base44 app repository. Treat it as user-owned application code, keep changes focused on the user's request, and preserve existing project conventions.

Start with `README.md` for local setup, environment variables, and publish workflow.

## Base44 References

- CLI overview: https://docs.base44.com/developers/references/cli/get-started/overview.md
- Agent skills: https://docs.base44.com/developers/backend/overview/skills.md

If your agent supports Agent Skills, install or update Base44 skills before Base44-specific work:

```bash
npx skills add base44/skills
```

## Key Files

- `src/`: frontend application source.
- `src/api/base44Client.js`: frontend Base44 SDK client.
- `vite.config.js`: Vite config and Base44 Vite plugin setup.
- `.env.local`: local-only environment values; never commit secrets.

## Working Notes

- Use `base44 dev` as the default local development command when you need the local Base44 backend. It can run the backend and frontend together.
- When docs or code mention the frontend being started automatically, that usually means the Base44 project config includes `site.serveCommand`, for example `"serveCommand": "npm run dev"` in `base44/config.jsonc`.
- Use `npm run dev` only for frontend-only work against the hosted Base44 backend.
- Prefer the existing Base44 CLI workflow over adding new npm scripts for Base44-specific tasks.
- Reuse the existing SDK client and Vite plugin patterns before adding new Base44 integration paths.
- Run the relevant checks from `package.json` before finishing code changes.

## Checks before finishing

- `npm run lint` and `npm run build`
- `deno test base44/shared/` (trace normalisation tests)
- `deno check base44/functions/*/entry.ts base44/shared/*.ts`. The two Stellar functions fail locally on `npm:@stellar/stellar-sdk` resolution only; that's expected, because Base44 resolves `npm:` specifiers at deploy. Never vendor node_modules into a function dir (deploy uploads every file in it).

## Design system ("field journal")

- Primitives: `src/components/journal/` (PaperGrain, Stamp, MarginNote, RouteMap, Receipt, JournalButton, Specimen, ProofDrawer, StoryCard, AskBrandSheet).
- Agentic primitives: `TraceSteps` (shows the trace's steps landing one at a time), `ConfidenceShift` (shows the estimate move when a label lands), `DelegationCard` (a handed-off letter with a state), `Observations` (what the app noticed), `PassportSign` (co-sign an anchored record), `GiveBackNote` (the maker payout, in the money flow).
- Social primitives: `GuessField` (the hand-inked axis of what everyone guessed), `WagerPanel` (the wager, its field, and the claim).
- Tokens: `journal-*` Tailwind colours / `--j-*` CSS vars; fonts `font-serif-display` (Fraunces), `font-grotesk`, `font-plexmono`, `font-hand` (Caveat, margin notes only).
- The `journal` palette is defined through `--j-*-rgb` channel vars so Tailwind can apply opacity modifiers (`bg-journal-ink/60`). A plain `var(--j-ink)` has no alpha channel and silently drops every rule that uses one — don't undo that.
- No emojis in UI. Plain copy: blockchain/hash terms only inside ProofDrawer and the Impact detail rows.
- Copy in the app speaks in the first person ("I'm fairly sure about Bangladesh") and always names the limitation next to the claim. See `docs/agentic.md`.
- Social copy rules: never attribute a belief to a person, never say the user staked anything (the pot is sponsored), and never show a count of one. See `docs/social.md`.
- AI prompts/schemas live in `base44/shared/prompts.ts`; their honesty rules are product requirements.

## Checks before finishing

- `npm run lint` and `npm run build`
- `deno test base44/shared/` (trace normalisation + the wager's field maths)
- `deno test src/lib/` (delegation lifecycle, observations, corroboration)
- `deno check base44/functions/*/entry.ts base44/shared/*.ts`. The two Stellar functions fail locally on `npm:@stellar/stellar-sdk` resolution only; that's expected, because Base44 resolves `npm:` specifiers at deploy. Never vendor node_modules into a function dir (deploy uploads every file in it).
