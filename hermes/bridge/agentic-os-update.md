---
name: agentic-os-update
description: Check for and apply Agentic OS Console updates from the upstream repo.
version: 1.0.0
trigger:
  - "update agentic os"
  - "check for console updates"
  - "upgrade the console"
inputs:
  - name: target_tag
    description: Specific semver tag to upgrade to (default latest release)
    required: false
pack: bridge
---

# Update Agentic OS Console

## When to run

User asks to check for or apply updates. Also invoked weekly by the
Console's in-app updater check (which surfaces a banner; the user clicks
"Update now" and it triggers this skill).

## Steps

1. `cd ~/agentic-os && git fetch origin --tags`

2. Determine target tag:
   - If `target_tag` provided, use it (validate format `vN.N.N`).
   - Otherwise, query `https://api.github.com/repos/aporb/agentic-os/releases/latest` and use `tag_name`.

3. Read current version from `package.json`. If already at target, report and exit.

4. Stop the server (call the `agentic-os-stop` bridge skill).

5. Check out the tag:
   ```bash
   git checkout <target_tag>
   ```

6. Reinstall and rebuild:
   ```bash
   npm install --no-audit --no-fund
   npm run build
   ```

7. Re-copy shipped skills to `~/.hermes/skills/agentic-os/` (preserves user overrides in `<vault>/skills/`):
   ```bash
   rsync -a --delete ~/agentic-os/hermes/skills/ ~/.hermes/skills/agentic-os/
   ```

8. Restart the server (call the `agentic-os-start` bridge skill).

9. Report new version and changelog excerpt.

## Failure modes

- **Working directory dirty** — refuse to update; tell the user to commit or stash.
- **npm install fails** — restore previous tag (`git checkout <previous_tag>`) and surface the error.
- **Build fails** — same: restore and surface.

## Output

Version delta and a short success/failure summary.
