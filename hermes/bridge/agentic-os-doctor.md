---
name: agentic-os-doctor
description: Run a health check on the Agentic OS Console install (prereqs, config, vault, build, server).
version: 1.0.0
trigger:
  - "agentic os doctor"
  - "check console health"
  - "diagnose the console"
inputs: []
pack: bridge
---

# Doctor

## Steps

1. Run `~/agentic-os/hermes/doctor.sh`.
2. Capture output verbatim.
3. Reformat for the messaging surface (CLI: pass through; Telegram: shorten with key markers).
4. If anything is failing (✗), surface the most actionable next step.

## Output

A status report with sections: prereqs, config, token, vault, app build, server, shipped skills, bridge.
