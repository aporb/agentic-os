---
name: dev-onboarding-doc
description: Read the codebase and generate a "how to get this running" guide for a contractor or new hire — no tribal knowledge required.
version: 1.0.0
trigger:
  - "write dev onboarding"
  - "create onboarding doc"
  - "how to set up this project"
  - "contractor onboarding"
  - "developer onboarding"
  - "write setup guide"
  - "onboarding guide"
  - "how to get started on this codebase"
  - "setup documentation"
  - "write the readme for developers"
  - "document how to run this"
integrations:
  - bash-git
  - bash-file-scan
  - vault-sqlite-fts5
inputs:
  - name: project_name
    description: Name of the project (used in the document title)
    required: true
  - name: project_path
    description: Absolute path to the project root (defaults to current working directory)
    required: false
  - name: tech_stack
    description: Override or supplement the detected tech stack if the auto-detection would miss something important (optional)
    required: false
output_artifact: "wiki/dev-onboarding-[project-slug].md"
frequency: on-demand
pack: cto
---

# Dev Onboarding Doc

## When to run

Before a new contractor starts on the codebase. Before you hand a piece of work to OpenCode (the agent needs to understand the project structure too). When you realize you've accumulated two months of tribal knowledge that isn't written down anywhere. When an engineer you respect says "so how does this work?" and you catch yourself giving a 20-minute verbal explanation.

A contractor who can be productive on day one is worth more than one who emails you five setup questions. This skill writes the document that closes that gap.

## What you'll get

A `wiki/dev-onboarding-[project-slug].md` that covers: what the project does in one paragraph, the full local development setup (every command, in order), the directory structure explained, environment variables required, common pitfalls encountered by prior contributors, and where to find the key files. A new developer should be able to clone the repo, follow this doc, and have a running local instance without asking you anything.

## Steps

1. Scan the project root for key files:
   ```bash
   ls -la <project_path>/{package.json,pyproject.toml,Pipfile,go.mod,Cargo.toml,Makefile,docker-compose.yml,docker-compose.yaml,.env.example,README.md,AGENTS.md,CLAUDE.md} 2>/dev/null
   ```
   Note which configuration files are present — each tells us something about the setup process.

2. Read `<project_path>/package.json` if it exists. Extract: `name`, `description`, `scripts` (all of them), `dependencies` (top-level keys), `devDependencies` (top-level keys), `engines` (Node version requirement).

3. Read `<project_path>/pyproject.toml` or `requirements.txt` if they exist. Extract: project metadata, Python version, key dependencies.

4. Read `<project_path>/.env.example` or `<project_path>/.env.sample` if it exists. This is the canonical list of environment variables. Extract every key and its comment/description. If no example file exists, grep the source for `process.env.` or `os.environ.get(` to discover required env vars:
   ```bash
   grep -rn --include="*.ts" --include="*.tsx" --include="*.js" --include="*.py" \
     -E "process\.env\.[A-Z_]+" <project_path>/src | \
     grep -oE "process\.env\.[A-Z_]+" | sort -u
   ```

5. Read `<project_path>/README.md` if it exists. Extract any setup steps already documented — use them as a baseline and expand where they're thin or missing.

6. Map the directory structure. Use `find` to get the top two levels:
   ```bash
   find <project_path> -maxdepth 2 -type d \
     | grep -v node_modules | grep -v .git | grep -v .next | grep -v __pycache__ \
     | sort
   ```
   For each top-level directory, write a one-sentence explanation of its purpose. This is the single most useful thing for a new developer — knowing where things live.

7. Identify the database setup steps. Check for:
   - `supabase/migrations/` directory — Supabase managed migration files
   - `prisma/` directory — Prisma schema and migration commands
   - `drizzle/` directory — Drizzle ORM setup
   - `alembic/` directory — Python SQLAlchemy migrations
   - `docker-compose.yml` with database service definitions
   Note the exact commands to run database setup: `supabase start`, `npx prisma migrate dev`, `docker-compose up -d db`, etc.

8. Search the vault for any existing developer-facing documentation: `sqlite3 vault.db "SELECT path, title FROM pages WHERE pages MATCH 'setup OR onboarding OR local development' LIMIT 5;"`. If relevant vault pages exist, cross-reference them in the output.

9. Identify common pitfalls. Check git history for commits with messages indicating setup fixes:
   ```bash
   git -C <project_path> log --oneline | grep -iE "fix|setup|install|config|env|missing|broken" | head -20
   ```
   Each such commit is a potential pitfall to document.

10. Write the onboarding doc. Lead with what the project does — a contractor doesn't always know. Follow with prerequisites, then ordered setup steps, then directory guide, then common commands, then gotchas. Every code block should be copy-paste-ready.

11. Write to `wiki/dev-onboarding-<project-slug>.md`.

## Output format

```markdown
---
type: wiki
title: "Dev Onboarding — [Project Name]"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: current
tags: [dev-onboarding, cto, documentation, [project-slug]]
project: "[Project Name]"
stack: "[detected stack]"
---

# Dev Onboarding — [Project Name]

> Last updated: YYYY-MM-DD. If something in this doc is wrong, fix it and commit —
> the next developer will thank you.

## What This Is

[One paragraph. What the project does. Who uses it. What problem it solves.
No jargon — write for a smart developer who knows nothing about this specific project.]

## Prerequisites

Before you start, you need:

- Node.js [version] (use [nvm](https://github.com/nvm-sh/nvm): `nvm use`)
- [Other runtime requirements]
- [External accounts required — Supabase, Vercel, Stripe, etc.]

## Setup

```bash
# 1. Clone and install
git clone <repo_url>
cd <project_name>
npm install   # or: yarn install / pnpm install

# 2. Environment
cp .env.example .env.local
# Fill in the required values — see "Environment Variables" below

# 3. Database
[database setup commands]

# 4. Run
npm run dev
```

Open http://localhost:[port].

## Environment Variables

| Variable | Required | Description | Where to get it |
|----------|----------|-------------|-----------------|
| `VAR_NAME` | Yes | What it does | [Where to find/create it] |

## Directory Structure

```
project-root/
├── src/               [Application source code]
│   ├── app/           [Next.js App Router pages and API routes]
│   ├── lib/           [Shared utilities and service clients]
│   └── components/    [UI components]
├── supabase/          [Database schema and migrations]
├── public/            [Static assets]
├── hermes/            [Skill files and agent configuration]
└── wiki/              [Vault — all agent-generated docs live here]
```

## Common Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start local development server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript type checking (run before committing) |
| `npm test` | Run test suite |

## Known Gotchas

- **[Issue]:** [What happens and how to fix it.]
- **[Issue]:** [...]

## Key Files

- `[path]` — [What it is and why it matters]
- `[path]` — [...]

## Getting Help

[Where to ask questions — Telegram, Linear, email, etc.]
```

## Example output (truncated)

```markdown
# Dev Onboarding — Agentic OS Console

## What This Is

This is the Hermes Agent runtime UI — a Next.js 15 web app that lets users run
AI skills (called "skill packs") via a chat interface and a card-based runner.
Skills live in `hermes/skills/` as Markdown files with structured frontmatter.
The vault (SQLite FTS5 database) stores all agent-generated outputs. Users
interact primarily via Telegram or the web UI.

## Setup

```bash
git clone https://github.com/aporb/agentic-os
cd agentic-os
npm install
cp .env.example .env.local
# Fill in: SUPABASE_URL, SUPABASE_ANON_KEY, OPENAI_API_KEY, TELEGRAM_BOT_TOKEN
supabase start
npm run dev
```

Open http://localhost:18443.

## Known Gotchas

- **`supabase start` fails on first run:** Docker must be running. Run `docker info`
  to confirm. If Docker is running but Supabase still fails, run `supabase stop --no-backup`
  and try again.
- **Telegram bot not responding:** The `TELEGRAM_BOT_TOKEN` must match the bot created
  via BotFather. Test it: `curl https://api.telegram.org/bot<TOKEN>/getMe`.
- **`npm run dev` port conflict:** Default port is 18443. If that's taken,
  set `PORT=<other>` in `.env.local`.
```
