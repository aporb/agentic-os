---
name: skill-register
description: Install or update Agentic OS Console skill packs into Hermes' skills directory, honoring user vault overrides.
version: 1.0.0
trigger:
  - "register skills"
  - "install skill packs"
  - "update agentic os skills"
inputs:
  - name: source
    description: Source path (default ~/agentic-os/hermes/skills/)
    required: false
pack: bridge
---

# Register Skills

## When to run

- During `/agentic-os install` — copies shipped packs to `~/.hermes/skills/agentic-os/`.
- During `/agentic-os update` — re-copies after a version upgrade.
- On user demand if vault skill overrides change.

## Override model (spec §13)

- Shipped skills live in `~/.hermes/skills/agentic-os/<pack>/<name>.md`
- User overrides live in `<vault>/skills/<pack>/<name>.md`
- On name conflict, **vault wins** — user customizations are sacred.

## Steps

1. Resolve source path (default `~/agentic-os/hermes/skills/`).

2. Resolve target: `~/.hermes/skills/agentic-os/`.

3. For each pack directory in source (`ceo/`, `cro/`, `cmo/`):
   - Create the target subdirectory if missing.
   - For each `*.md` file in the source pack:
     - Check if `<vault>/skills/<pack>/<name>.md` exists. If yes, skip (user override wins).
     - Otherwise, copy the file to the target.

4. Report counts: shipped, skipped (overridden), updated.

5. Tell Hermes to reload skill registry (the bridge can't directly reload, but the user can run `/skills` to refresh).

## Failure modes

- **Source missing** — Console not installed.
- **Target read-only** — permissions issue; surface chmod suggestion.
- **Malformed skill markdown** — log the offending file but continue with the rest.

## Output

A count summary plus the list of overridden skills (so the user knows their customizations are preserved).
