---
name: agentic-os-install
description: Install the Agentic OS Console — clones the repo, runs the bootstrap installer, reports the launch URL.
version: 1.0.0
trigger:
  - "install agentic-os"
  - "install agentic os console"
  - "set up agentic os"
  - "set up the second brain console"
  - "install agentic-os from github"
inputs:
  - name: repo_url
    description: GitHub URL (default github.com/aporb/agentic-os)
    required: false
  - name: install_dir
    description: Where to clone the app (default ~/agentic-os)
    required: false
pack: bridge
---

# Install Agentic OS Console

## When to run

User says "install agentic os" or pastes a GitHub URL pointing at the
agentic-os repo and asks to install it. This is the canonical entry
point for first-time setup.

## What it does

Clones the Console repo, runs `hermes/install.sh` which provisions the
vault, persona, skills, and Next.js build. Reports a one-time launch URL
for the user to open in a browser.

## Steps

1. Resolve the repo URL. Default `https://github.com/aporb/agentic-os.git` if user didn't specify.

2. Resolve the install directory. Default `$HOME/agentic-os`. If it already exists, ask whether to update (run `git pull`) or abort.

3. Clone the repo if needed:
   ```bash
   git clone <repo_url> <install_dir>
   ```

4. Run the bootstrap script:
   ```bash
   bash <install_dir>/hermes/install.sh
   ```
   This is interactive — the user will be prompted for vault location and persona questions.

5. After the script completes, read `~/.hermes/agentic-os/config.json` and `~/.hermes/agentic-os/token`.

6. Report the launch URL to the user:
   ```
   Open this in your browser:
   http://127.0.0.1:<port>/?t=<token>
   ```

   If running via a messaging gateway (Telegram, Discord, etc.), DM the launch URL.

## Failure modes to handle

- **Prereqs missing** — install.sh prints what's missing and exits non-zero. Surface the error verbatim.
- **Vault path conflicts** — install.sh refuses to overwrite a non-empty directory; ask the user for an alternate path.
- **npm install fails** — likely a Node version or network issue. Suggest `hermes/doctor.sh`.
- **Port already in use** — suggest setting `AGENTIC_OS_PORT` to an unused port and re-running.

## Output

A short confirmation message with the launch URL. Do NOT echo the token to a public log/channel — DM only.
