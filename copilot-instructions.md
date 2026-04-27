# GitHub Copilot — Agentic OS Console

Read [AGENTS.md](AGENTS.md) first.

This repo is a Next.js 15 (App Router) web app that turns Hermes Agent into an AI-native operating system for solo founders. End users install via Hermes (`> install agentic-os from github.com/aporb/agentic-os`).

When suggesting code, follow these rules:

**Voice (apply to comments, copy, skill files):**
- USE: leverage, own, compete, coordination overhead, second brain, pipeline, runway
- AVOID: productivity, efficient, automate, seamless, AI workforce, AI company, founding cohort, em-dash abuse, hedging language

**Don't:**
- Add a chat surface to the Next.js app (Hermes has chat)
- Use paid search APIs — use `lib/search.ts` (ddgr → gogcli → browser fallback)
- Add paid-tier feature flags
- Push to git remote without explicit instruction
- Anthropomorphize with named character agents

**Architecture:**
- Frontend: Next.js 15 App Router + TypeScript + Tailwind + shadcn-style local components
- Backend: Next.js API routes that talk to a local Hermes runtime
- Vault: markdown files at the user's configured path; SQLite FTS5 + vector index at `vault.db`
- Hermes integration: standalone Next.js app + Hermes skill bridge at `hermes/bridge/`

See AGENTS.md for full conventions.
