# Skills

Skills are reusable procedures that make your AI agent produce consistent results every time. Think of them as the "apps" running on your Agentic OS.

## What is a Skill?

A skill is a markdown file that tells your AI agent **exactly how to do a specific task**. No coding required. You write the instructions in plain English, and the agent follows them.

Every skill has:
- **Trigger**: When to use it (keywords you can type)
- **Steps**: Numbered instructions the agent follows
- **Inputs**: What the agent needs from you
- **Outputs**: What you get back

## Skill Packs

Skills are grouped into **packs** based on what you do as a founder:

| Pack | What It Handles | Skills |
|------|----------------|--------|
| `market-intel` | Know your market | Competitor research, industry trends, customer intel |
| `content-engine` | Get found online | Blog posts, social media, newsletters |
| `sales-engine` | Close deals | Prospect research, outreach emails, pitch prep |
| `operations` | Run the business | Daily standup, weekly review, meeting prep, financial tracking |

## Creating a New Skill

1. Copy `_skill-template.md` from this directory
2. Fill in the template for your specific task
3. Test it by telling your agent to run the skill
4. When the output is consistent, it's ready

### Creating a New Pack

1. Create a new folder under `skills/` (e.g., `skills/hiring/`)
2. Copy `_skill-template.md` into it
3. Add a `README.md` describing the pack
4. Build skills following the template

## Design Rules

1. **One task per skill.** A skill that does three things is three skills.
2. **Numbered steps.** Agents follow numbered instructions better than paragraphs.
3. **Plain English.** No code required. Write instructions like you'd explain to a smart intern.
4. **Test three times.** If output varies, your instructions aren't specific enough.
5. **Update when broken.** When you find an edge case, add it to the pitfalls section.

## How Skills Get Used

Your agent loads skills automatically when it detects a trigger keyword, or you can invoke them directly by name. The specific mechanism depends on your agent:

- **Claude Code**: Skills are loaded via `CLAUDE.md` or `.claude/commands/`
- **Cursor**: Skills are loaded via `.cursorrules`
- **Other agents**: Skills are referenced in `AGENTS.md`
