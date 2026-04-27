---
name: agentic-os-start
description: Start the Agentic OS Console server in the background.
version: 1.0.0
trigger:
  - "start agentic os"
  - "launch the console"
  - "start the second brain"
inputs: []
pack: bridge
---

# Start Agentic OS Console

## When to run

User wants to bring the Console up after install (or after `/agentic-os stop`). This skill is also called automatically at the end of `/agentic-os install`.

## Steps

1. Verify install state — check `~/.hermes/agentic-os/config.json` exists. If missing, redirect to `/agentic-os install`.

2. Check whether the server is already running on the configured port. If yes, return the existing launch URL and exit.

3. Run the start script in the background:
   ```bash
   nohup ~/agentic-os/hermes/start.sh > ~/.hermes/agentic-os/server.log 2>&1 &
   ```

4. Wait up to 5 seconds for the server to bind to its port. Probe with `curl -s http://127.0.0.1:<port>/api/health`.

5. Read the token from `~/.hermes/agentic-os/token`.

6. Report the launch URL.

## Failure modes

- **Build artifacts missing** (`.next/` doesn't exist) — run `npm run build` first.
- **Port conflict** — surface what's listening and suggest stopping it or changing the port.
- **Server crashes during startup** — tail the last 30 lines of `server.log` and surface them.

## Output

Launch URL plus a one-line status (e.g. "Started on port 18443, pid 12345").
