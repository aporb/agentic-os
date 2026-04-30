#!/usr/bin/env bash
# setup_profile_github.sh — wire a per-profile GitHub PAT into a Hermes profile.
#
# Provisions an isolated `gh` config dir with the user's PAT, sets git
# author/committer env vars in the profile .env, and verifies the auth.
# After running this, the profile's agent can use `gh` and `git push` AS
# THAT USER, not as the host owner (Amyn). The client SOUL.md GitHub
# guardrail honors the presence of $GH_TOKEN to lift the off-limits rule.
#
# Usage:
#   setup_profile_github.sh <profile_name> <pat> "<full_name>" <email>
#
# Example:
#   setup_profile_github.sh hussain ghp_xxx "Hussain Hashim" hussain@sundayback.app
#
# Idempotent: re-running with a different PAT replaces the stored token.
# Reversible: see teardown_profile_github.sh (or rm gh-config/hosts.yml +
#             comment out env vars).

set -euo pipefail

if [ "$#" -ne 4 ]; then
    echo "usage: $0 <profile_name> <pat> \"<full_name>\" <email>" >&2
    echo "       <profile_name> = hussain | marcus-preasha | <other>" >&2
    echo "       <pat>          = GitHub fine-grained PAT (recommend repo-only scope)" >&2
    exit 2
fi

PROFILE="$1"
PAT="$2"
FULL_NAME="$3"
EMAIL="$4"

PROFILE_DIR="/home/amynporb/.hermes/profiles/${PROFILE}"
GH_CFG_DIR="${PROFILE_DIR}/gh-config"
ENV_FILE="${PROFILE_DIR}/.env"

if [ ! -d "$PROFILE_DIR" ]; then
    echo "✗ profile dir not found: $PROFILE_DIR" >&2
    exit 1
fi

mkdir -p "$GH_CFG_DIR"
chmod 700 "$GH_CFG_DIR"

# Use gh's --with-token to write the auth into the isolated config dir.
echo "→ writing token to $GH_CFG_DIR/hosts.yml via gh auth login --with-token"
GH_CONFIG_DIR="$GH_CFG_DIR" gh auth login --hostname github.com --with-token <<<"$PAT"

# Verify the token works and identify which user it auths as.
echo "→ verifying token..."
GH_USER=$(GH_CONFIG_DIR="$GH_CFG_DIR" gh api user --jq .login)
if [ -z "$GH_USER" ]; then
    echo "✗ token verification failed" >&2
    exit 1
fi
echo "  ✓ token authenticates as github.com/$GH_USER"

# Sanity: warn if the token's user is `aporb` (the host owner) — that means
# the client provided the operator's token, which defeats the purpose.
if [ "$GH_USER" = "aporb" ]; then
    echo "  ⚠ WARNING: this token authenticates as 'aporb' (host operator)." >&2
    echo "    Per-profile isolation expects a CLIENT-owned token, not the operator's." >&2
fi

# Update the profile .env: uncomment the placeholder lines and fill values.
# We rewrite the GitHub access block in-place.
TMPFILE=$(mktemp)
awk -v cfgdir="$GH_CFG_DIR" -v pat="$PAT" -v name="$FULL_NAME" -v email="$EMAIL" '
    /^# GitHub access \(per-profile credential isolation\)/ { in_block=1 }
    in_block && /^$/ { in_block=0 }
    !in_block { print; next }
    in_block { next }
' "$ENV_FILE" > "$TMPFILE"

cat >> "$TMPFILE" <<EOF

# GitHub access (per-profile credential isolation) ─────────────────────
# Provisioned by setup_profile_github.sh on $(date -Iseconds)
# Token authenticates as github.com/${GH_USER}
GH_CONFIG_DIR=${GH_CFG_DIR}
GH_TOKEN=${PAT}
GIT_AUTHOR_NAME=${FULL_NAME}
GIT_AUTHOR_EMAIL=${EMAIL}
GIT_COMMITTER_NAME=${FULL_NAME}
GIT_COMMITTER_EMAIL=${EMAIL}
EOF

mv "$TMPFILE" "$ENV_FILE"
chmod 600 "$ENV_FILE"
echo "  ✓ $ENV_FILE updated"

echo
echo "✓ profile '$PROFILE' wired to github.com/$GH_USER"
echo "  → restart the gateway to load the new env: hermes -p $PROFILE gateway restart"
echo "  → SOUL.md GitHub guardrail will lift automatically when GH_TOKEN is in env"
