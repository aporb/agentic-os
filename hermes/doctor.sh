#!/usr/bin/env bash
# Diagnose the Agentic OS Console install.
# Reports prereqs, config, vault state, app build state, and search-tool availability.
set -uo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HERMES_HOME="${HERMES_HOME:-$HOME/.hermes}"
APP_STATE_DIR="$HERMES_HOME/agentic-os"
PORT="${AGENTIC_OS_PORT:-18443}"

R=$'\e[0m'; GRN=$'\e[32m'; YEL=$'\e[33m'; RED=$'\e[31m'; D=$'\e[2m'
ok()   { printf '%b✓%b %s\n' "$GRN" "$R" "$1"; }
warn() { printf '%b!%b %s\n' "$YEL" "$R" "$1"; }
bad()  { printf '%b✗%b %s\n' "$RED" "$R" "$1"; }
hdr()  { printf '\n%b%s%b\n' "$D" "$1" "$R"; }

hdr "─── prereqs ───"
for tool in node npm python3 git jq ddgr; do
  if command -v "$tool" >/dev/null 2>&1; then ok "$tool: $(command -v "$tool")"
  elif [[ "$tool" == "ddgr" ]]; then warn "ddgr not installed (optional but recommended)"
  else bad "$tool missing"
  fi
done
if command -v gog >/dev/null 2>&1 || command -v gogcli >/dev/null 2>&1; then
  ok "gogcli installed"
else
  warn "gogcli not installed (optional fallback for web search)"
fi

hdr "─── config ───"
if [[ -f "$APP_STATE_DIR/config.json" ]]; then
  ok "config: $APP_STATE_DIR/config.json"
  jq . "$APP_STATE_DIR/config.json" 2>/dev/null | sed 's/^/    /' || cat "$APP_STATE_DIR/config.json" | sed 's/^/    /'
else
  bad "config.json missing — run install.sh first"
fi

hdr "─── token ───"
if [[ -f "$APP_STATE_DIR/token" ]]; then
  ok "token present (length: $(wc -c < "$APP_STATE_DIR/token" | tr -d ' '))"
else
  warn "token missing — will be regenerated on next start"
fi

hdr "─── vault ───"
vault=$(jq -r '.vault_path // empty' "$APP_STATE_DIR/config.json" 2>/dev/null || echo "")
if [[ -n "$vault" && -d "$vault" ]]; then
  ok "vault: $vault"
  for zone in sources wiki journal schema; do
    if [[ -d "$vault/$zone" ]]; then ok "  zone $zone present"
    else warn "  zone $zone missing"
    fi
  done
  if [[ -f "$vault/vault.db" ]]; then
    ok "  vault.db present ($(stat -c %s "$vault/vault.db" 2>/dev/null || stat -f %z "$vault/vault.db") bytes)"
  else
    warn "  vault.db missing — run scripts/index_vault.py"
  fi
else
  bad "vault not configured or missing"
fi

hdr "─── app build ───"
if [[ -d "$APP_DIR/.next" ]]; then ok ".next/ build artifacts present"
else warn "no production build — run 'npm run build'"
fi
if [[ -d "$APP_DIR/node_modules" ]]; then ok "node_modules present"
else bad "node_modules missing — run 'npm install'"
fi

hdr "─── server ───"
if command -v lsof >/dev/null 2>&1; then
  if lsof -ti tcp:"$PORT" >/dev/null 2>&1; then
    ok "listening on port $PORT (pid $(lsof -ti tcp:"$PORT"))"
  else
    warn "no process on port $PORT — server not running"
  fi
fi

hdr "─── shipped skills ───"
target="$HERMES_HOME/skills/agentic-os"
if [[ -d "$target" ]]; then
  count=$(find "$target" -name "*.md" | wc -l | tr -d ' ')
  ok "agentic-os skills installed ($count files at $target)"
else
  bad "skills not installed — run install.sh"
fi

hdr "─── bridge ───"
bridge="$HERMES_HOME/skills/agentic-os-bridge"
if [[ -d "$bridge" ]]; then
  ok "bridge installed ($bridge)"
else
  bad "bridge not installed — run install.sh"
fi

echo
echo "Done."
