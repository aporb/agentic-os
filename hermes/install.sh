#!/usr/bin/env bash
# Agentic OS Console — bootstrap installer.
#
# Hermes runs this when the user says "install agentic-os." It:
#   1. Verifies prereqs (Node 20+, Python 3.11+, git, jq)
#   2. Asks where the user's vault should live (default ~/Documents/Second Brain/)
#   3. Optionally initializes vault as a private GitHub repo (gh auth login + gh repo create)
#   4. Asks 3 persona-wizard questions, writes a generic ~/.hermes/persona.md
#   5. Copies shipped skill packs to ~/.hermes/skills/agentic-os/
#   6. Registers two crons via the bridge: vault-index-sync, daily-standup
#   7. Runs npm install + npm run build
#   8. Generates ephemeral session token at ~/.hermes/agentic-os/token
#   9. Starts the Next.js server on the configured port
#  10. Prints a one-time launch URL for Hermes to open or DM
#
# Spec: §4 Install Flow.

set -euo pipefail

# -------- paths --------
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HERMES_HOME="${HERMES_HOME:-$HOME/.hermes}"
APP_STATE_DIR="$HERMES_HOME/agentic-os"
DEFAULT_VAULT="$HOME/Documents/Second Brain"
DEFAULT_PORT="${AGENTIC_OS_PORT:-18443}"
SECOND_BRAIN_TEMPLATE="https://github.com/aporb/second-brain-starter-template.git"

mkdir -p "$APP_STATE_DIR"

# -------- ansi --------
R=$'\e[0m'; B=$'\e[1m'; D=$'\e[2m'
GRN=$'\e[32m'; YEL=$'\e[33m'; RED=$'\e[31m'; CYN=$'\e[36m'

ok()    { printf '%b✓%b %s\n' "$GRN" "$R" "$1"; }
warn()  { printf '%b!%b %s\n' "$YEL" "$R" "$1"; }
err()   { printf '%b✗%b %s\n' "$RED" "$R" "$1" >&2; }
step()  { printf '\n%b▸%b %s\n' "$CYN" "$R" "$1"; }

# -------- prereq check --------
check_prereqs() {
  step "Checking prerequisites"
  local missing=0
  for tool in node npm python3 git jq; do
    if command -v "$tool" >/dev/null 2>&1; then
      ok "$tool: $(command -v "$tool")"
    else
      err "$tool not found"
      missing=1
    fi
  done

  if [[ $missing -eq 1 ]]; then
    err "Install missing tools and re-run: hermes /agentic-os install"
    exit 1
  fi

  local node_major
  node_major=$(node -v | sed 's/^v//' | cut -d. -f1)
  if [[ $node_major -lt 20 ]]; then
    err "Node 20+ required (found v$(node -v | sed 's/^v//'))"
    exit 1
  fi

  # ddgr / gogcli are optional but recommended
  if ! command -v ddgr >/dev/null 2>&1; then
    warn "ddgr not installed — web search will fall back to gogcli or browser"
    warn "  Install: pip install ddgr  (or apt/brew install ddgr)"
  fi
  if ! command -v gog >/dev/null 2>&1 && ! command -v gogcli >/dev/null 2>&1; then
    warn "gogcli not installed — install via: brew install gogcli"
  fi
}

# -------- prompt helpers --------
ask() {
  local prompt=$1 default=${2:-} answer
  if [[ -n "$default" ]]; then
    read -r -p "$prompt [$default]: " answer
    echo "${answer:-$default}"
  else
    read -r -p "$prompt: " answer
    echo "$answer"
  fi
}

ask_yn() {
  local prompt=$1 default=${2:-N} answer
  read -r -p "$prompt [$default]: " answer
  answer="${answer:-$default}"
  [[ "$answer" =~ ^[Yy]$ ]]
}

# -------- vault setup --------
setup_vault() {
  step "Setting up your second brain"
  local vault_path
  vault_path=$(ask "Where should your second brain live?" "$DEFAULT_VAULT")

  if [[ -d "$vault_path" ]]; then
    if [[ -d "$vault_path/wiki" && -d "$vault_path/sources" ]]; then
      ok "Existing vault detected at $vault_path"
    else
      err "Directory exists but doesn't look like a vault (missing wiki/ or sources/)"
      exit 1
    fi
  else
    ok "Cloning second-brain-starter-template to $vault_path"
    git clone --depth 1 "$SECOND_BRAIN_TEMPLATE" "$vault_path"
    rm -rf "$vault_path/.git"
    (cd "$vault_path" && git init -b main >/dev/null 2>&1 && git add -A && git commit -m "init: vault from second-brain-starter-template" >/dev/null)

    # Strip template-specific files that don't belong in a personal vault
    rm -f "$vault_path/CLAUDE.md" "$vault_path/AGENTS.md" \
          "$vault_path/.cursorrules" "$vault_path/copilot-instructions.md" 2>/dev/null || true

    # Create the v1-spec'd subdirs
    mkdir -p "$vault_path/sources" "$vault_path/wiki" "$vault_path/journal" \
             "$vault_path/schema" "$vault_path/skills" "$vault_path/automations" \
             "$vault_path/scripts"
    ok "Vault initialized"
  fi

  # Optional GitHub backup
  if ask_yn "Back up your vault to a private GitHub repo?" "N"; then
    if ! command -v gh >/dev/null 2>&1; then
      warn "gh CLI not found — install from https://cli.github.com/ then re-run"
    else
      if ! gh auth status >/dev/null 2>&1; then
        gh auth login
      fi
      local repo_name
      repo_name=$(basename "$vault_path" | tr ' ' '-' | tr '[:upper:]' '[:lower:]')-vault
      (cd "$vault_path" && gh repo create "$repo_name" --private --source . --push)
      ok "Vault pushed to private GitHub repo: $repo_name"
    fi
  fi

  # Persist full config to config.json (vault, port, host, agent name, install id).
  # Subsequent steps (persona wizard) may overwrite agent_name; do a final
  # write at the end of the install in case anything else changes.
  local install_id="install-$(date +%s)-$RANDOM"
  jq -n \
    --arg vault "$vault_path" \
    --arg port "$DEFAULT_PORT" \
    --arg id "$install_id" \
    '{vault_path: $vault, port: ($port|tonumber), host: "127.0.0.1", agent_name: "your assistant", hermes_api_url: "http://127.0.0.1:7421", hermes_token: null, last_check_for_updates: null, install_id: $id}' \
    > "$APP_STATE_DIR/config.json.tmp"
  mv "$APP_STATE_DIR/config.json.tmp" "$APP_STATE_DIR/config.json"
}

# -------- persona wizard --------
setup_persona() {
  step "Persona setup (3 quick questions)"
  local persona_path="$HERMES_HOME/persona.md"

  if [[ -f "$persona_path" ]]; then
    if ! ask_yn "Existing persona at $persona_path — overwrite?" "N"; then
      ok "Keeping existing persona"
      return
    fi
  fi

  local agent_name agent_voice agent_focus
  agent_name=$(ask "What do you want to call your assistant?" "your assistant")
  agent_voice=$(ask "Voice (one word)? clear / warm / direct / playful" "direct")
  agent_focus=$(ask "Top job-to-be-done? (e.g. 'help me ship faster')" "help me ship faster")

  # Mirror agent_name into config.json so the Settings page shows it.
  if [[ -f "$APP_STATE_DIR/config.json" ]]; then
    jq --arg name "$agent_name" '.agent_name = $name' "$APP_STATE_DIR/config.json" \
      > "$APP_STATE_DIR/config.json.tmp" \
      && mv "$APP_STATE_DIR/config.json.tmp" "$APP_STATE_DIR/config.json"
  fi

  cat > "$persona_path" <<EOF
# Agent Persona

**Name:** $agent_name
**Voice:** $agent_voice
**Focus:** $agent_focus

## Communication style
- Clear, direct, BLUF (bottom line up front).
- Practitioner-focused, no corporate jargon.
- Short declarative sentences. No hedging language.
- Cite sources from the vault with [[wikilink]] syntax.
- Flag contradictions; don't silently resolve them.

## What this agent does
- Maintains the second brain at the configured vault path.
- Executes shipped skill packs (CEO, Revenue, Marketing in v1).
- Runs scheduled automations (daily standup, vault index sync).
- Writes drafts to the wiki for the user to review.

## What this agent does NOT do
- Modify reviewed or stable wiki pages without explicit instruction.
- Modify files in sources/ (read-only zone).
- Push to remote git without being asked.
- Fabricate information not present in sources.
EOF
  ok "Persona written to $persona_path"
}

# -------- skill copy --------
copy_skills() {
  step "Installing skill packs"
  local target="$HERMES_HOME/skills/agentic-os"
  rm -rf "$target"
  mkdir -p "$target"
  cp -r "$APP_DIR/hermes/skills/"* "$target/"
  ok "Shipped skills copied to $target"
}

# -------- bridge install --------
install_bridge() {
  step "Installing Hermes bridge"
  local target="$HERMES_HOME/skills/agentic-os-bridge"
  rm -rf "$target"
  mkdir -p "$target"
  cp -r "$APP_DIR/hermes/bridge/"* "$target/"
  ok "Bridge skills copied to $target"
}

# -------- npm + build --------
build_app() {
  step "Installing dependencies and building (this may take a minute)"
  (cd "$APP_DIR" && npm install --no-audit --no-fund && npm run build)
  ok "App built"
}

# -------- token + cron register + start --------
finalize() {
  step "Generating session token"
  local token
  token=$(node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))")
  printf '%s' "$token" > "$APP_STATE_DIR/token"
  chmod 600 "$APP_STATE_DIR/token"
  ok "Token at $APP_STATE_DIR/token"

  step "Registering crons (via Hermes bridge)"
  warn "Cron registration is bridge work — invoke /agentic-os register-crons after first start"

  step "Ready to launch"
  echo
  echo "  Run:  $APP_DIR/hermes/start.sh"
  echo "  Or:   /agentic-os start  (from inside Hermes)"
  echo
  echo "  Once running, open: http://127.0.0.1:$DEFAULT_PORT/?t=$token"
  echo
}

# -------- main --------
main() {
  printf '\n%b%bAgentic OS Console — installer%b\n' "$B" "$CYN" "$R"
  printf '%bYour AI C-suite. On your machine. Yours to keep.%b\n\n' "$D" "$R"

  check_prereqs
  setup_vault
  setup_persona
  copy_skills
  install_bridge
  build_app
  finalize
}

main "$@"
