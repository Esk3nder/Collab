# Collab

Multi-agent collaboration workspace powered by [Multi-Agent Ralph Wiggum](https://github.com/alfredolopez80/multi-agent-ralph-loop).

## Setup

```bash
# Ralph CLI installed at ~/.local/bin/ralph
ralph --version  # v2.42.0

# Run from this directory
cd ~/Collab
ralph orch "your task"
```

## Structure

```
Collab/
├── .claude/          # Ralph skills, agents, hooks
├── CLAUDE.md         # Ralph v2.42 instructions
├── _upstream/        # Original ralph-loop repo (reference)
└── README.md
```

## Commands

```bash
ralph orch "task"     # Full 8-step orchestration
ralph gates           # Quality gates
ralph loop "task"     # Loop until VERIFIED_DONE
ralph adversarial     # Spec refinement
```
