# Mothership

Self-hosted runtime for Agentic AI. Own your compute.

```
┌─────────────────────────────────────────────────────────────┐
│                         MOTHERSHIP                          │
│                                                             │
│   Local Machine                    VPS (Engine)             │
│   ┌──────────┐     SSH Tunnel     ┌──────────────────┐     │
│   │ Cockpit  │ ◄──────────────────│ Bun WebSocket    │     │
│   │ (Next.js)│     Port 8080      │     Server       │     │
│   │          │                    │        │         │     │
│   │ xterm.js │                    │   ┌────▼────┐    │     │
│   └──────────┘                    │   │  tmux   │    │     │
│                                   │   │ sprites │    │     │
│                                   │   └─────────┘    │     │
│                                   └──────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Install on VPS

```bash
# SSH to your VPS
ssh user@your-vps-ip

# Run installer
curl -fsSL https://raw.githubusercontent.com/Esk3nder/Collab/main/mothership/scripts/install.sh | bash
```

### 2. Connect from Local

```bash
cd mothership
bun install
bun run connect -- user@your-vps-ip
```

### 3. Open UI

Navigate to `http://localhost:8080` in your browser.

## Architecture

| Component | Stack | Description |
|-----------|-------|-------------|
| **Engine** | Bun + WebSocket | Runs on VPS, manages tmux sessions |
| **Cockpit** | Next.js + xterm.js | Local UI, renders terminal + artifacts |
| **Sprites** | tmux windows | Each sprite is an agent workspace |
| **Skills** | Markdown files | Hot-reloadable tool definitions |

## Directory Structure

```
mothership/
├── backend/
│   └── src/
│       └── server.ts      # Bun WebSocket server
├── frontend/
│   ├── app/               # Next.js app router
│   ├── components/        # React components
│   └── lib/               # Store + WebSocket client
├── scripts/
│   ├── connect.sh         # SSH tunnel script
│   └── install.sh         # VPS installer
└── package.json           # Monorepo root
```

## Skills

Drop Markdown files in `~/mothership/skills/` on your VPS:

```markdown
# Skill: Weather Check

Description: Checks the weather for a specific location.

## Parameters
- location (string): City and state

## Implementation (Bash)
```bash
curl wttr.in/$location?format=3
```

Skills are hot-reloaded automatically.

## Configuration

| Env Var | Default | Description |
|---------|---------|-------------|
| `PORT` | 8080 | WebSocket server port |
| `SKILLS_DIR` | ~/mothership/skills | Skill files location |

## Development

```bash
# Backend
cd backend && bun run dev

# Frontend
cd frontend && bun run dev
```

## Stack

- **Runtime**: Bun (no Node.js)
- **Frontend**: Next.js 14, Tailwind, xterm.js
- **State**: Zustand
- **Terminal**: tmux via Bun.$
- **Protocol**: Raw JSON over WebSocket
