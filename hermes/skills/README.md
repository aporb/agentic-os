# Shipped Skill Packs

Markdown skill files that ship with the Agentic OS Console. These get
copied to `~/.hermes/skills/agentic-os/` at install time so Hermes loads
them as native skills.

## Override model

User customizations go in their **vault** at `<vault>/skills/<pack>/<name>.md`.
On name conflict, the vault wins. This means `git pull` on the Console
repo never clobbers a user's edited skill — they always have a clean
escape hatch.

## v1 packs (this directory)

| Directory | Pack name (UI label) | Skills |
|-----------|---------------------|--------|
| `ceo/`    | CEO                  | 7 |
| `cro/`    | Revenue              | 7 |
| `cmo/`    | Marketing            | 6 |

20 skills total. Other packs (CPO, CTO, CAIO, CFO) are v2.

## Skill format

Every skill is a markdown file with YAML frontmatter and a body of
human-readable instructions. See `_skill-template.md` for the schema.
The agent reads these directly — there is no compiled or transformed
representation.

## Voice rules

All shipped skills follow the project's voice guidance:

- Clear, direct, BLUF (bottom line up front).
- Practitioner-focused, no corporate jargon.
- Short declarative sentences, no hedging.
- No em-dash abuse.
- Leverage-not-productivity framing in descriptions.
- Explicit anti-AI-voice rules embedded in content-generating skills.

When editing or adding skills, match the existing tone.

## Relevant docs

- Spec: `wiki/draft-agentic-os-spec.md` (project root, not in this folder)
- Skill catalog and rationale: `wiki/draft-skill-pack-design.md`
- Vocabulary map: spec §10.4
