# AGENTS.md — Working on the Agentic OS Console codebase

> Instructions for AI agents (Claude Code, Cursor, Copilot, etc.) helping develop **this codebase**. End users don't read this file — they install via Hermes per the README.

## What this repo is

A Next.js 15 (App Router) web app that turns Hermes Agent into an AI-native operating system for solo founders. MIT-licensed lead-gen funnel for the paid Kodax appliance.

Not a SaaS. Not a chat app. Not a markdown-only template. The Console is a real Next.js application that talks to a locally-running Hermes via its `api_server` gateway platform.

## Source-of-truth documents (read first)

- **`wiki/draft-agentic-os-spec.md`** — full product spec. §10 has the positioning rules. §3 has the file tree. §6 has the bridge architecture.
- **`wiki/draft-skill-pack-design.md`** — 73-skill C-suite catalog. Migration map at Appendix B.
- **`wiki/draft-build-plan.md`** — execution plan for v1.
- **`wiki/methodology.md`** — the philosophy essay (also linked from the user-facing README).

## Tech stack

- Next.js 15 App Router · TypeScript · Tailwind · shadcn-style local components (no CLI dep)
- `better-sqlite3` for vault.db reads
- `gray-matter` + `remark` for markdown parsing
- `lucide-react` for icons
- No Radix beyond what shadcn primitives use; no heavy component libraries
- Python 3.11+ for the indexer (`scripts/index_vault.py`) and vector search (`scripts/search_vectors.py`)

## File layout (load-bearing parts)

```
app/                    Next.js routes (pages + API)
  api/                  REST endpoints; all require validateToken()
  page.tsx              Home dashboard
  skills/               Pack browser, runner
  wiki/                 Tree + page reader/editor
  sources/              Drag-drop ingest
components/
  ui/                   Local shadcn-style primitives (Button, Card, Input, …)
  home/, skills/, wiki/, sources/   Surface-specific components
lib/
  config.ts             Reads ~/.hermes/agentic-os/config.json
  auth.ts               Ephemeral token, localhost-bound
  vault.ts              Read/write markdown with frontmatter; zone access rules
  hermes.ts             Hermes API client (status, sessions, crons, runSkill stream)
  search.ts             Web search via ddgr → gogcli → browser fallback
  updater.ts            Semver check + applyUpdate
  packs.ts              Pack metadata + UI labels
  skills.ts             Server-side skill loader (shipped + vault overrides)
hermes/
  install.sh            Bootstrap script Hermes runs for the user
  start.sh, stop.sh, doctor.sh
  persona-template.md   Generic founder-friendly default
  bridge/               Hermes skill bundle (install/start/stop/update/doctor/vault-discover/cron-register/skill-register)
  skills/               Shipped skill packs (ceo/, cro/, cmo/)
scripts/
  index_vault.py        SQLite FTS5 + vector indexer
  search_vectors.py     Cosine similarity query helper
```

## Critical conventions

### Voice and vocabulary
- USE: leverage, own, compete, coordination overhead, second brain, pipeline, runway
- AVOID: productivity, efficient, automate, seamless, AI workforce, AI company, founding cohort, named-character mascots
- Match the spec's vocabulary map (§10.4). Every README/UI string must answer "what becomes possible?" not "what gets faster?"

### Skill markdown rules
- Every shipped skill has frontmatter: name, description, version, trigger[], integrations[], inputs[], output_artifact, frequency, pack
- Body has 5 H2 sections: When to run / What you'll get / Steps / Output format / Example output
- Content-generating skills (blog-post, newsletter-issue, etc.) MUST embed anti-AI-voice rules in their Steps section as numbered enforcement steps, not just style guidance.

### Zone access rules (lib/vault.ts enforces)
- `sources/` — read-only to agent
- `wiki/` — agent read+write
- `journal/` — agent reads, never writes (except via /daily skill scaffolding)
- `schema/` — read-only

### Hybrid skill override
- Shipped skills live in `hermes/skills/<pack>/<name>.md`
- User overrides live in `<vault>/skills/<pack>/<name>.md`
- Vault wins on name conflict. Don't ever clobber a vault override on update.

### Auth
- All `/api/*` routes call `validateToken()` first.
- Token is ephemeral, written to `~/.hermes/agentic-os/token` at server start.
- Browser receives via `?t=<token>` on initial launch URL, then via cookie.

### Search-via-CLI
- `lib/search.ts` shells out to `ddgr` and `gogcli` via Node's `execFileSync`. NO paid search APIs in this repo.
- If both are missing, fall back to the Hermes browser tool (proxied through `/api/hermes/...`).

### Mobile-first
- 44px+ tap targets globally. Add `dense` class to opt out (sidebars, tables).
- No horizontal scroll. Single-column stacking on the home dashboard mobile layout.

## Hermes bridge

The bridge is **the only thing** that mutates Hermes state. The Next.js app is read-mostly toward Hermes; all writes (cron register, skill install, server restart) flow through the bridge skills at `hermes/bridge/`.

Don't add new Hermes mutation paths in the Next.js app. Add a bridge skill instead.

## Don't do

- Don't add a chat surface to the app — Hermes already has chat (CLI/TUI/`hermes dashboard`/Telegram/etc.). Per Hermes' own AGENTS.md guidance, "do not re-implement the primary chat experience in React."
- Don't add paid-tier feature flags or upsell prompts in the OSS code. Kodax features live in a separate private repo.
- Don't run `git push` from any tool unless the user explicitly asks.
- Don't introduce paid search APIs (Tavily, Perplexity, Bing). The ddgr/gogcli/browser cascade is a deliberate differentiator.
- Don't anthropomorphize with named character mascots. The persona system is user-customizable, not a fixed cast.

## Testing

No vitest setup in v1. Type checking + Next.js build are the smoke tests:

```bash
npm install
npm run typecheck
npm run build
```

When adding tests in v2, use vitest + @testing-library/react. Don't write change-detector tests (see Hermes' own conventions).

## Branch and commit

- Working branch: `v1-rewrite` (will merge to `main` when v1 ships)
- Commit subjects: `feat(scope): subject`, `fix(scope): subject`, `docs(scope): subject`
- Don't squash-merge stale branches; rebase first

## Quick run

```bash
npm install                    # first time only
npm run dev                    # localhost:18443 in dev mode
npm run build && npm start     # production build
npm run typecheck              # tsc --noEmit, fast
```

The dev server expects `~/.hermes/agentic-os/config.json` to exist (created by `hermes/install.sh`). For local dev without going through the installer, write a minimal one:

```bash
mkdir -p ~/.hermes/agentic-os
cat > ~/.hermes/agentic-os/config.json <<EOF
{"vault_path": "$HOME/Documents/Second Brain", "port": 18443}
EOF
```
