---
name: cron-register
description: Register a new scheduled automation with Hermes' cron scheduler.
version: 1.0.0
trigger:
  - "register cron"
  - "schedule this automation"
  - "set up a daily run"
inputs:
  - name: name
    description: Unique identifier for the cron (kebab-case, e.g. "daily-pipeline-report")
    required: true
  - name: schedule
    description: Cron expression or human interval (e.g. "0 8 * * 1-5" or "every 4h")
    required: true
  - name: prompt
    description: The instruction Hermes will execute on each run
    required: true
  - name: skills
    description: Comma-separated skill names to load before running
    required: false
  - name: delivery
    description: Where to send output (telegram, discord, slack, local)
    required: false
pack: bridge
---

# Register Cron

## When to run

The Console's UI invokes this skill when the user creates an automation
in `/automations`. The skill never runs interactively for end users —
it's the bridge between the Console and Hermes' cron CRUD.

## Steps

1. Validate inputs:
   - `name` matches `^[a-z][a-z0-9-]+$`
   - `schedule` is either a 5-field cron expression or one of: "every Nm/Nh/Nd", "daily at HH:MM", "weekly on <day>"
   - `prompt` is non-empty
   - `delivery` is one of telegram|discord|slack|local|sms (default: local)

2. Resolve the vault path via `vault-discover` skill.

3. Call Hermes' built-in cron create:
   ```bash
   hermes cron create "<schedule>" "<prompt>" \
     --name "<name>" \
     --skills "<skills>" \
     --deliver <delivery>
   ```

4. Write a user-readable record to `<vault>/automations/local/<name>.md`:
   ```markdown
   ---
   type: automation
   name: <name>
   schedule: <schedule>
   delivery: <delivery>
   created: <today>
   skills: [<skills>]
   ---
   <prompt>
   ```

5. Confirm registration by listing crons (`hermes cron list`) and verifying the new name appears.

## Failure modes

- **Invalid cron expression** — surface Hermes' error verbatim.
- **Duplicate name** — ask whether to overwrite (`hermes cron delete` first, then create).
- **Delivery target not configured** — e.g. user picked Telegram but hasn't set up the gateway. Surface the gap with the link to Hermes' messaging docs.

## Output

Confirmation with the registered cron's next-run timestamp.
