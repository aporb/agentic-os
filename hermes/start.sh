#!/usr/bin/env bash
# Start the Agentic OS Console (production build).
set -euo pipefail
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${AGENTIC_OS_PORT:-18443}"
HOST="${AGENTIC_OS_HOST:-127.0.0.1}"

cd "$APP_DIR"
exec npm run start -- -H "$HOST" -p "$PORT"
