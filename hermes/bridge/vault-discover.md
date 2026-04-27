---
name: vault-discover
description: Locate the user's vault and expose its path to other Hermes skills.
version: 1.0.0
trigger:
  - "find my vault"
  - "where is the second brain"
  - "vault path"
inputs: []
pack: bridge
---

# Discover Vault Path

## When to run

Invoked at the start of any Agentic OS skill that needs to read or write
the vault. Also runs as part of `/agentic-os doctor`.

## Steps

1. Read `~/.hermes/agentic-os/config.json`.
2. Extract `vault_path`.
3. Verify the path exists and contains the four expected zones (sources/, wiki/, journal/, schema/).
4. Set the `AGENTIC_OS_VAULT` environment variable for the current session.
5. Return the resolved path.

## Failure modes

- **config.json missing** — Console isn't installed. Suggest `/agentic-os install`.
- **Vault path doesn't exist** — Vault was moved or deleted. Suggest re-running install or pointing to the correct path via `AGENTIC_OS_VAULT` env var.
- **Zones missing** — Vault is corrupted or partial. Suggest re-cloning from second-brain-starter-template.

## Output

Vault path on success; a clear error message and remediation on failure.
