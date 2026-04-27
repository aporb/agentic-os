#!/usr/bin/env bash
# Stop the Agentic OS Console.
# Finds the PID listening on the configured port and sends SIGTERM.
set -euo pipefail
PORT="${AGENTIC_OS_PORT:-18443}"

if command -v lsof >/dev/null 2>&1; then
  pid=$(lsof -ti tcp:"$PORT" 2>/dev/null || true)
elif command -v ss >/dev/null 2>&1; then
  pid=$(ss -lptn "sport = :$PORT" 2>/dev/null | grep -oP 'pid=\K[0-9]+' | head -1 || true)
elif command -v fuser >/dev/null 2>&1; then
  pid=$(fuser "$PORT/tcp" 2>/dev/null | tr -d ' ' || true)
else
  echo "No tool found to identify port owner (need lsof, ss, or fuser)" >&2
  exit 1
fi

if [[ -z "${pid:-}" ]]; then
  echo "No process listening on port $PORT"
  exit 0
fi

echo "Stopping pid $pid (port $PORT)"
kill "$pid"
sleep 1
if kill -0 "$pid" 2>/dev/null; then
  echo "Still running — sending SIGKILL"
  kill -9 "$pid"
fi
echo "Stopped."
