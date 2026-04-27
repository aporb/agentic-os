# CLAUDE.md — for Claude Code working on this repo

This is a pointer file. The full developer-facing instructions live in [`AGENTS.md`](AGENTS.md). Read that first.

## Quick context for Claude Code

- **What:** Next.js 15 web app that turns Hermes Agent into an AI-native operating system for solo founders.
- **Audience:** End users install via Hermes (`> install agentic-os from github.com/aporb/agentic-os`); they don't read this file. THIS file is for AI agents helping develop the codebase.
- **Source of truth:** `wiki/draft-agentic-os-spec.md` for product, `wiki/draft-skill-pack-design.md` for skills, `wiki/draft-build-plan.md` for execution plan, `wiki/methodology.md` for philosophy.

## Voice and vocabulary (strict)

- USE: leverage, own, compete, coordination overhead, second brain, pipeline, runway, retention
- AVOID: productivity, efficient, automate, seamless, AI workforce, AI company, founding cohort, named-character mascots, em-dash abuse, hedging language ("we think," "you might find"), corporate jargon

Apply these rules in:
- README, AGENTS.md, any user-facing copy
- All shipped skill files in `hermes/skills/`
- UI strings, button labels, empty states

## Don't

- Don't add a chat surface to the Next.js app — Hermes already has chat
- Don't introduce paid search APIs (Tavily / Perplexity / Bing) — use the `ddgr` → `gogcli` → browser cascade in `lib/search.ts`
- Don't add paid-tier feature flags — Kodax features live in a separate private repo
- Don't push to git remote unless the user asks
- Don't anthropomorphize with named character agents — the persona system is user-customizable

## Working scripts

```bash
npm install
npm run dev            # localhost:18443
npm run typecheck      # tsc --noEmit
npm run build          # production build smoke test
```

See `AGENTS.md` for full conventions.
