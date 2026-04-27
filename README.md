# Agentic OS

**Your AI C-suite. On your machine. Yours to keep.**

A way of working with AI — give your solo-founder operation a running C-suite (CEO, Revenue, Marketing) on top of a second brain that owns your knowledge. Free. Open source. MIT. Runs on your laptop.

→ [How it works](#how-it-works) · [Install](#install) · [Read the methodology](wiki/methodology.md) · [Want it managed for your team? → Kodax](#kodax)

---

## The idea

Solo founders don't lack ambition, they lack a C-suite. Most of the work that drowns a founder isn't strategy — it's coordination overhead. Twenty Claude windows, a Notion stack, six SaaS subscriptions, all of which forget yesterday's context every Monday.

Agentic OS replaces that with one system: a **vault** that holds your knowledge, **skills** that turn rough requests into polished artifacts, an **agent** that runs them, and a **dashboard** that shows you what's open and what's done.

The system runs on your machine. You own every file. Every skill is a markdown document you can read, edit, or delete. When you walk away, you walk away with the whole thing — the vault is yours, the persona is yours, the customizations are yours. Cancel and you keep all of it.

That's the structural difference. Read the [methodology essay](wiki/methodology.md) for the full pitch.

## What you get

The Console is a Next.js web app that runs locally on `127.0.0.1:18443` and talks to the [Hermes Agent](https://github.com/NousResearch/hermes-agent) runtime under the hood. Four primary surfaces:

- **Home dashboard** — Today's standup, recent vault activity, quick-launch your most-used skills, Hermes status.
- **Skill runner** — Browse the C-suite packs, fill a form, hit Run, watch streaming output, get a wiki page or Gmail draft.
- **Wiki browser** — Tree view of your second brain. Frontmatter-aware editor (status: draft → reviewed → stable, tags, citations).
- **Sources inbox** — Drag PDFs, URLs, transcripts. They land as `unread` and your agent ingests them into wiki pages.

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

## The C-suite

Three packs ship in v1. Each pack is a folder of plain-English markdown skill files your agent reads and follows.

| Pack | Skills | Examples |
|------|--------|----------|
| **CEO** (`ceo/`) | 7 | Daily standup · Weekly review · Meeting prep · Competitor research · Strategic decision brief · Investor update · OKR check |
| **Revenue** (`cro/`) | 7 | Prospect research · Cold outreach email · Follow-up sequence · Sales call prep · Proposal draft · Pipeline health report · Win-loss debrief |
| **Marketing** (`cmo/`) | 6 | Blog post · Newsletter issue · LinkedIn post set · Content calendar · SEO keyword research · Case study draft |

Customize any skill by dropping an edited copy into `<vault>/skills/<pack>/<name>.md`. **Vault overrides always win.** `git pull` on the Console code never clobbers your customizations.

Four more packs (CPO, CTO, CAIO, CFO) ship in v2. Roadmap in [`wiki/draft-skill-pack-design.md`](wiki/draft-skill-pack-design.md).

## The vault

Your second brain has four zones, each with different ownership and access rules:

| Zone | Path | Who writes | Agent access |
|------|------|-----------|--------------|
| Sources | `sources/` | You | Read only |
| Wiki | `wiki/` | Agent | Read + write |
| Journal | `journal/` | You | Read only |
| Schema | `schema/` | You | Read only |

Sources are immutable raw materials (articles, transcripts, PDFs). The agent synthesizes them into wiki pages you review. Wiki pages move through `draft → reviewed → stable`. Journal entries belong to you. Schema files are the rules.

The vault is markdown all the way down. Open it in Obsidian, sync it to GitHub, back it up however you want. We provide a SQLite full-text + vector index at `vault.db` for fast agent search; everything else is files you can `cat`.

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

If you want to use a different agent (Claude Code, Cursor, Copilot), the markdown skills are agent-portable; the Next.js Console is Hermes-coupled in v1.

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

- **v1 (now)** — 3 packs, 20 skills, 4 MVP screens, install-via-Hermes flow.
- **v2** — Add CPO, CTO, CAIO, CFO packs (53 more skills). Linear + GitHub + Stripe integrations.
- **v3** — Multi-agent orchestration (skills chain across packs). Skill marketplace. Optional cloud vault sync.

Detailed plan in [`wiki/draft-build-plan.md`](wiki/draft-build-plan.md).

## Kodax

Want this set up for you, hosted somewhere reliable, with white-glove onboarding, multi-user team vaults, and industry-specific premium skill packs? That's [Kodax](#) — a paid managed offering on top of the same OSS engine. Drop your email at [kodax-landing-page] for early access. The Console you install today is the same Console Kodax customers run, minus the hosting and the curation.

You don't need Kodax to use Agentic OS. The OSS path is complete on its own. Kodax exists for founders who want someone else to operate the AI for them.

## Contributing

This is a working draft. v1 is the first public ship — bugs are expected. Open issues at [github.com/aporb/agentic-os/issues](https://github.com/aporb/agentic-os/issues). PRs welcome on:

- New skills (any pack, any role) — see `hermes/skills/_skill-template.md`
- Voice / prompt improvements to existing skills
- Bug fixes in the Next.js app
- Better SQLite queries in the indexer

If you're proposing a new pack or major UX change, open an issue first to align on direction.

## License

MIT — see [LICENSE](LICENSE).

## Credits

Built on the [Second Brain Starter Template](https://github.com/aporb/second-brain-starter-template). Runs on [Hermes Agent](https://github.com/NousResearch/hermes-agent) by Nous Research.
