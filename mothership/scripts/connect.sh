#!/usr/bin/env bash
#
# Mothership Connect Script
# Usage: ./connect.sh user@vps-ip [port]
#
# Hybrid approach:
# 1. SSH to VPS
# 2. Start server if not running (in tmux)
# 3. Port-forward 8080 to localhost
#

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 user@host [local_port]"
  echo "Example: $0 root@my-vps.com 8080"
  exit 1
fi

TARGET="$1"
LOCAL_PORT="${2:-8080}"
REMOTE_PORT="8080"

echo "╔═══════════════════════════════════════════╗"
echo "║     MOTHERSHIP CONNECT                    ║"
echo "╚═══════════════════════════════════════════╝"
echo ""
echo "Target: $TARGET"
echo "Local:  localhost:$LOCAL_PORT → remote:$REMOTE_PORT"
echo ""

# Start server on remote if not running, then port-forward
ssh -t -L "${LOCAL_PORT}:localhost:${REMOTE_PORT}" "$TARGET" '
  # Check if mothership server is running
  if ! pgrep -f "bun.*server.ts" > /dev/null 2>&1; then
    echo "[mothership] Starting server..."

    # Ensure tmux session exists for server
    if ! tmux has-session -t mothership-server 2>/dev/null; then
      tmux new-session -d -s mothership-server -n server
    fi

    # Start server in tmux
    tmux send-keys -t mothership-server:server "cd ~/mothership && bun run backend/src/server.ts" Enter

    # Wait for server to start
    sleep 2
    echo "[mothership] Server started"
  else
    echo "[mothership] Server already running"
  fi

  echo ""
  echo "[mothership] Tunnel active. Press Ctrl+C to disconnect."
  echo "[mothership] Open http://localhost:'"$LOCAL_PORT"' in your browser"
  echo ""

  # Keep connection alive
  while true; do sleep 60; done
'
