# Agentic OS

**Your AI C-suite. On your machine. Yours to keep.**

A way of working with AI — give your solo-founder operation a running C-suite (CEO, Revenue, Marketing, Product, Engineering, AI Ops, Finance) on top of a second brain that owns your knowledge. Free. Open source. MIT. Runs on your laptop.

→ [How it works](#the-idea) · [Install](#install) · [Read the methodology](wiki/methodology.md) · [Want it managed for your team? → Kodax](#kodax)

---

## The idea

Solo founders don't lack ambition, they lack a C-suite. Most of the work that drowns a founder isn't strategy — it's coordination overhead. Twenty Claude windows, a Notion stack, six SaaS subscriptions, all of which forget yesterday's context every Monday.

Agentic OS replaces that with one system: a **vault** that holds your knowledge, **skills** that turn rough requests into polished artifacts, an **agent** that runs them, and a **console** that shows you what's open, what's done, and what's next.

The system runs on your machine. You own every file. Every skill is a markdown document you can read, edit, or delete. When you walk away, you walk away with the whole thing — the vault is yours, the persona is yours, the customizations are yours. Cancel and you keep all of it.

That's the structural difference. Read the [methodology essay](wiki/methodology.md) for the full pitch.

## What you get

The Console is a Next.js 15 web app that runs locally on `127.0.0.1:18443` and talks to the [Hermes Agent](https://github.com/NousResearch/hermes-agent) runtime under the hood. Light mode by default, dark mode one click away.

Seven primary surfaces:

- **Today** — Hero zone with a generated standup, a vault activity timeline with relative dates, ⌘1–4 keyboard quick-launch for pinned skills, a 30-day vault-write sparkline, and a Hermes status panel with a live countdown to the next scheduled run.
- **Skills** — All seven C-suite packs as cards. Click into a pack, click a skill, fill the form, hit Run. Output streams back; the artifact reveals into an accent-bordered panel with a one-click "Open in Wiki."
- **Wiki** — Tree view of your second brain on the left, recently-updated list on the right with status-tinted pills (draft / reviewed / stable). Markdown view with `[[wikilinks]]` resolved, code highlighting, frontmatter editor.
- **Journal** — Daily entries by date. You own this zone — agent reads only.
- **Sources** — Drag-drop PDFs, URLs, or transcripts. They land as `unread` and your agent ingests them into wiki pages.
- **Automations** — Live view of every cron job registered with Hermes, with last-run status and next-run timestamp.
- **Settings** — Runtime config, theme toggle, update check, search-tool detection.

## Install

The fastest path: ask [Hermes](https://github.com/NousResearch/hermes-agent) to install it for you.

```
> install agentic-os from github.com/aporb/agentic-os
```

That's it. Hermes clones the repo, runs the bootstrap script, asks you where to put your vault, and prints a one-time launch URL. Total time: under three minutes on a warm machine.

The bootstrap does this:

1. Verifies prereqs (Node 20+, Python 3.11+, git, jq)
2. Asks where your vault should live (default `~/Documents/Second Brain/`)
3. Optionally backs the vault up to a private GitHub repo (`gh` CLI required if you say yes)
4. Walks a 3-question persona wizard, writes `~/.hermes/persona.md`
5. Copies the shipped skill packs into `~/.hermes/skills/agentic-os/`
6. Runs `npm install && npm run build`
7. Generates an ephemeral session token at `~/.hermes/agentic-os/token`
8. Starts the server on port 18443

If you want to install manually, see [`hermes/install.sh`](hermes/install.sh).

### Enable the Hermes API server

The Console reads from Hermes' OpenAI-compatible HTTP API on port 8642. That platform is off by default in Hermes. Enable it once via:

```bash
mkdir -p ~/.config/systemd/user/hermes-gateway.service.d
cat > ~/.config/systemd/user/hermes-gateway.service.d/api-server.conf <<'EOF'
[Service]
Environment=API_SERVER_ENABLED=true
Environment=API_SERVER_HOST=127.0.0.1
Environment=API_SERVER_PORT=8642
EOF
systemctl --user daemon-reload
systemctl --user restart hermes-gateway.service
```

The Console degrades gracefully when api_server is offline — sessions and cron jobs still load by reading `~/.hermes/state.db` and `~/.hermes/cron/jobs.json` directly.

## The C-suite

All seven packs ship now. **60 skills total.** Each pack is a folder of plain-English markdown skill files your agent reads and follows.

| Pack | Dir | Skills | Examples |
|------|-----|--------|----------|
| **CEO** | `ceo/` | 7 | Daily standup · Weekly review · Meeting prep · Competitor research · Strategic decision brief · Investor update · OKR check |
| **Revenue** | `cro/` | 7 | Prospect research · Cold outreach email · Follow-up sequence · Sales call prep · Proposal draft · Pipeline health report · Win-loss debrief |
| **Marketing** | `cmo/` | 6 | Blog post · Newsletter issue · LinkedIn post set · Content calendar · SEO keyword research · Case study draft |
| **Product** | `cpo/` | 11 | Feature spec · User feedback synthesis · Backlog prioritization · Sprint planning brief · User story mapping · Release notes · Bug triage · Competitor product audit · Roadmap narrative · Onboarding analysis · NPS synthesis |
| **Engineering** | `cto/` | 11 | Technical spec · OpenCode delegation · Code review · Dependency audit · Security review · ADR · Infrastructure cost audit · Incident postmortem · Dev onboarding doc · Smart commit · Tech debt register |
| **AI Ops** | `caio/` | 11 | AI stack audit · Agent workflow design · Skill file authoring · Prompt library update · Model benchmarking · AI vendor research · LLM cost optimization · Automation failure triage · AI risk assessment · Data pipeline design · AI adoption briefing |
| **Finance** | `cfo/` | 7 | Monthly financial summary · Unit economics · Pricing strategy brief · Investor metrics package · Expense audit · Runway scenario model · Tax prep data pull |

Customize any skill by dropping an edited copy into `<vault>/skills/<pack>/<name>.md`. **Vault overrides always win.** `git pull` on the Console code never clobbers your customizations.

In the UI, packs use functional labels: **CEO · Revenue · Marketing · Product · Engineering · AI Ops · Finance**. Internal directory names stay stable (`ceo/cro/cmo/cpo/cto/caio/cfo`).

## The vault

Your second brain has four zones, each with different ownership and access rules:

| Zone | Path | Who writes | Agent access |
|------|------|-----------|--------------|
| Sources | `sources/` | You | Read only |
| Wiki | `wiki/` | Agent | Read + write |
| Journal | `journal/` | You | Read only |
| Schema | `schema/` | You | Read only |

Sources are immutable raw materials (articles, transcripts, PDFs). The agent synthesizes them into wiki pages you review. Wiki pages move through `draft → reviewed → stable`. Journal entries belong to you. Schema files are the rules.

The vault is markdown all the way down. Open it in Obsidian, sync it to GitHub, back it up however you want. We provide a SQLite full-text + vector index at `vault.db` (built by `scripts/index_vault.py`, refreshed by a nightly cron) for fast agent search; everything else is files you can `cat`.

Vault scaffold ships in [aporb/second-brain-starter-template](https://github.com/aporb/second-brain-starter-template).

## Why no API keys for search

Most AI front-ends require Tavily, Perplexity, or Bing API keys for web research. Cost adds up. Keys to manage. Vendor lock.

Agentic OS uses two free CLI tools instead:

- [`ddgr`](https://github.com/jarun/ddgr) — DuckDuckGo from the terminal. Primary search.
- [`gogcli`](https://gogcli.sh/) — Google from the terminal. Fallback.

Skills shell out via the agent's terminal tool. No API keys, no monthly bill, no rate-limit dashboards. If both are unavailable, the agent escalates to its built-in browser tool.

```bash
brew install gogcli   # macOS
pip install ddgr      # cross-platform
```

## The methodology

Agentic OS is the methodology. The Console is the reference implementation. Read the essay: **[wiki/methodology.md](wiki/methodology.md)**

Throughline: solo founders don't lack ambition, they lack a C-suite. Coordination overhead is the hidden tax on solo growth. The OS is how you stop paying it.

## Hermes

The Console is opinionated about its agent runtime: it runs on **[Hermes Agent](https://github.com/NousResearch/hermes-agent)** by Nous Research. Hermes ships with cron, webhooks, multi-platform messaging gateways (Telegram / Discord / Slack / WhatsApp / Signal / Email), Honcho memory, six terminal backends, and 200+ models via OpenRouter. It's the right runtime because it already does what we'd otherwise rebuild — and it's MIT-licensed, model-agnostic, and runs on your hardware.

The Console talks to Hermes' OpenAI-compatible HTTP API server (the `api_server` platform) on port 8642. Endpoints used:

- `GET /health/detailed` — gateway state and connected platforms
- `GET /api/jobs` + full cron CRUD (POST / PATCH / DELETE / pause / resume / run)
- `POST /v1/runs` + `GET /v1/runs/{run_id}/events` (SSE) — async skill execution
- `POST /v1/chat/completions` — OpenAI-compat one-shot prompts

When api_server is offline, the Console reads sessions from `~/.hermes/state.db`, jobs from `~/.hermes/cron/jobs.json`, and gateway state from `~/.hermes/gateway_state.json` — direct disk fallbacks that work without HTTP.

If you want to use a different agent (Claude Code, Cursor, Copilot), the markdown skills are agent-portable; the Next.js Console is Hermes-coupled.

## Other agent instruction files

For SEO discoverability and partial portability of the markdown skills:

| Agent | File |
|-------|------|
| Hermes | `hermes/bridge/*` (canonical) |
| Claude Code | `CLAUDE.md` (developer-facing — for agents working *on* the Console codebase) |
| Cursor | `.cursorrules` (same) |
| GitHub Copilot | `copilot-instructions.md` (same) |
| Any other | `AGENTS.md` (same) |

The non-Hermes files describe the codebase for agents helping you build features. They are not the user-facing path.

## Roadmap

- **v1 (shipped now)** — 7 packs, 60 skills, 7 screens, install-via-Hermes flow, real Hermes api_server integration, light/dark mode.
- **v1.x** — The remaining 13 skills from the v2 design (CEO 3, Revenue 4, Marketing 6) → 73 total. Inline wiki body editor (CodeMirror). SSRF protection on the URL ingester. Supply-chain hardening on the in-app updater.
- **v2** — Multi-agent orchestration (skills chain across packs into Sunday-evening runs). Skill marketplace for community-contributed packs. Optional cloud vault sync.

## Kodax

Want this set up for you, hosted somewhere reliable, with white-glove onboarding, multi-user team vaults, and industry-specific premium skill packs? That's **Kodax** — a paid managed offering on top of the same OSS engine. The Console you install today is the same Console Kodax customers run, minus the hosting and the curation.

You don't need Kodax to use Agentic OS. The OSS path is complete on its own. Kodax exists for founders who want someone else to operate the AI for them.

## Contributing

The first public release is just out. Bugs are expected. Open issues at [github.com/aporb/agentic-os/issues](https://github.com/aporb/agentic-os/issues). PRs welcome on:

- New skills (any pack, any role) — see `hermes/skills/_skill-template.md`
- Voice / prompt improvements to existing skills
- Bug fixes in the Next.js app
- Better SQLite queries in the indexer

If you're proposing a new pack or major UX change, open an issue first to align on direction.

Voice rules across all surfaces (README, UI strings, skill files):

- Use: leverage, own, compete, coordination overhead, second brain, pipeline, runway
- Avoid: productivity, efficient, automate, seamless, AI workforce, founding cohort, named-character mascots, em-dash abuse, hedging language

## License

MIT — see [LICENSE](LICENSE).

## Credits

Built on the [Second Brain Starter Template](https://github.com/aporb/second-brain-starter-template). Runs on [Hermes Agent](https://github.com/NousResearch/hermes-agent) by Nous Research.
