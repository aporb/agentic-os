---
name: agentic-os-stop
description: Stop the running Agentic OS Console server.
version: 1.0.0
trigger:
  - "stop agentic os"
  - "shut down the console"
  - "stop the second brain"
inputs: []
pack: bridge
---

# Stop Agentic OS Console

## Steps

1. Run `~/agentic-os/hermes/stop.sh`.
2. Confirm the port is no longer occupied.
3. Report success or the error from the stop script.

## Output

One-line confirmation. No vault state is touched.
