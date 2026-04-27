# Agentic OS Console — Hermes Bridge

A bundle of Hermes skills that wire the Console to the Hermes runtime.

The bridge handles four functions (per spec §6):

| Function | Skills |
|----------|--------|
| **Install / setup commands** | `agentic-os-install`, `agentic-os-start`, `agentic-os-stop`, `agentic-os-update`, `agentic-os-doctor` |
| **Vault path discovery** | `vault-discover` |
| **Cron registration** | `cron-register` |
| **Skill pack registration** | `skill-register` |

The bridge is the only thing that mutates Hermes state on behalf of the
Console. The Next.js app is read-mostly toward Hermes; all writes
(register a cron, install a skill, restart the server) flow through these
skills.

## Install path

When the user runs `/agentic-os install` in Hermes, the bridge:

1. Clones `https://github.com/aporb/agentic-os` to `~/agentic-os`
2. Runs `~/agentic-os/hermes/install.sh`
3. Reads the generated `~/.hermes/agentic-os/config.json` and `~/.hermes/agentic-os/token`
4. Reports the launch URL to the user (CLI prints it; gateway DMs it)

## After install

Subsequent `/agentic-os` commands target the running Console:

- `/agentic-os start` — start the Next.js server (uses `hermes/start.sh`)
- `/agentic-os stop` — stop the server
- `/agentic-os doctor` — health check (`hermes/doctor.sh`)
- `/agentic-os update` — semver upgrade (`lib/updater.ts` applyUpdate)

## Cron registration flow

When the user creates an automation in the Console UI:

1. UI POST to `/api/hermes/cron` with the cron spec
2. API route invokes `cron-register` skill via Hermes
3. Skill calls Hermes' built-in `cron create` API with the spec
4. Skill writes a record to `<vault>/automations/local/<name>.md` for user-readable history

This indirection means the Console never speaks Hermes' cron API
directly; the bridge translates UI-shaped cron specs into Hermes-shaped
ones.
