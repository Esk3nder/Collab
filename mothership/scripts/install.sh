#!/usr/bin/env bash
#
# Mothership VPS Installer
# Run on target VPS: curl -fsSL https://raw.githubusercontent.com/.../install.sh | bash
#

set -euo pipefail

echo "╔═══════════════════════════════════════════╗"
echo "║     MOTHERSHIP INSTALLER                  ║"
echo "╚═══════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[install]${NC} $1"; }
ok() { echo -e "${GREEN}[ok]${NC} $1"; }

# 1. Install Bun
if ! command -v bun &> /dev/null; then
  log "Installing Bun..."
  curl -fsSL https://bun.sh/install | bash
  export BUN_INSTALL="$HOME/.bun"
  export PATH="$BUN_INSTALL/bin:$PATH"
  ok "Bun installed"
else
  ok "Bun already installed: $(bun --version)"
fi

# 2. Install tmux
if ! command -v tmux &> /dev/null; then
  log "Installing tmux..."
  if command -v apt &> /dev/null; then
    sudo apt update && sudo apt install -y tmux
  elif command -v yum &> /dev/null; then
    sudo yum install -y tmux
  elif command -v brew &> /dev/null; then
    brew install tmux
  fi
  ok "tmux installed"
else
  ok "tmux already installed: $(tmux -V)"
fi

# 3. Install Claude Code (optional)
if ! command -v claude &> /dev/null; then
  log "Installing Claude Code CLI..."
  # Note: User needs to have npm/node for this, or use the standalone installer
  if command -v npm &> /dev/null; then
    npm install -g @anthropic-ai/claude-code
    ok "Claude Code installed"
  else
    log "Skipping Claude Code (npm not found). Install manually if needed."
  fi
else
  ok "Claude Code already installed"
fi

# 4. Create directory structure
log "Creating directory structure..."
mkdir -p ~/mothership/{skills,projects}

# 5. Clone or update mothership
if [ -d ~/mothership/backend ]; then
  log "Mothership already installed, updating..."
  cd ~/mothership && git pull 2>/dev/null || true
else
  log "Cloning mothership..."
  cd ~
  git clone https://github.com/Esk3nder/Collab.git mothership-repo 2>/dev/null || true
  if [ -d ~/mothership-repo/mothership ]; then
    cp -r ~/mothership-repo/mothership/* ~/mothership/
    rm -rf ~/mothership-repo
  fi
fi

# 6. Install dependencies
if [ -f ~/mothership/backend/package.json ]; then
  log "Installing backend dependencies..."
  cd ~/mothership/backend && bun install
  ok "Dependencies installed"
fi

# 7. Create example skill
if [ ! -f ~/mothership/skills/weather.md ]; then
  log "Creating example skill..."
  cat > ~/mothership/skills/weather.md << 'EOF'
# Skill: Weather Check

Description: Checks the weather for a specific location.

## Tool Config
- Name: get_weather
- Description: Get current temperature and conditions

## Parameters
- location (string): The city and state, e.g. "San Francisco, CA"

## Implementation (Bash)
```bash
curl -s "wttr.in/${location}?format=3"
```
EOF
  ok "Example skill created"
fi

# 8. Add to PATH (for bun)
if ! grep -q 'BUN_INSTALL' ~/.bashrc 2>/dev/null; then
  echo 'export BUN_INSTALL="$HOME/.bun"' >> ~/.bashrc
  echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> ~/.bashrc
fi

echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║     INSTALLATION COMPLETE                 ║"
echo "╚═══════════════════════════════════════════╝"
echo ""
echo "Start the server:"
echo "  cd ~/mothership && bun run backend/src/server.ts"
echo ""
echo "Or from your local machine:"
echo "  npm run connect -- user@this-server"
echo ""
