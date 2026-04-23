#!/usr/bin/env bash
# sync.sh — Git sync for the Second Brain vault
# Usage: ./scripts/sync.sh [commit message]

set -euo pipefail

VAULT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$VAULT_ROOT"

# Pull remote changes first
echo "⬇ Pulling remote changes..."
git pull --rebase || {
    echo "❌ Pull failed. Resolve conflicts manually."
    exit 1
}

# Stage all changes
git add -A

# Check if there's anything to commit
if git diff --cached --quiet; then
    echo "✓ Nothing to commit. Vault is up to date."
    exit 0
fi

# Generate commit message
if [ -n "${1:-}" ]; then
    MSG="$1"
else
    # Auto-detect what changed
    SOURCES=$(git diff --cached --name-only | grep '^sources/' | wc -l)
    WIKI=$(git diff --cached --name-only | grep '^wiki/' | wc -l)
    JOURNAL=$(git diff --cached --name-only | grep '^journal/' | wc -l)
    SCHEMA=$(git diff --cached --name-only | grep '^schema/' | wc -l)

    PARTS=()
    [ "$SOURCES" -gt 0 ] && PARTS+=("sources:${SOURCES}")
    [ "$WIKI" -gt 0 ] && PARTS+=("wiki:${WIKI}")
    [ "$JOURNAL" -gt 0 ] && PARTS+=("journal:${JOURNAL}")
    [ "$SCHEMA" -gt 0 ] && PARTS+=("schema:${SCHEMA}")

    MSG="update: $(IFS=','; echo "${PARTS[*]}")"
fi

# Commit
git commit -m "$MSG"
echo "✓ Committed: $MSG"

# Push
BRANCH=$(git branch --show-current)
echo "⬆ Pushing to origin/$BRANCH..."
git push origin "$BRANCH"
echo "✓ Vault synced."
