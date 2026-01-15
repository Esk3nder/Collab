/**
 * Mothership Engine - Pure Bun WebSocket Server
 *
 * Creates a "Living Terminal" by:
 * 1. Spawning tmux sessions (sprites)
 * 2. Streaming output via WebSocket
 * 3. Watching skills directory for hot-reload
 */

import { watch } from "fs"
import { readdir, readFile } from "fs/promises"
import { join } from "path"

const PORT = Number(process.env.PORT) || 8080
const SKILLS_DIR = process.env.SKILLS_DIR || join(process.env.HOME!, "mothership/skills")
const SESSION_NAME = "mothership"

// ============================================================================
// Types
// ============================================================================

interface Sprite {
  id: string
  name: string
  windowId: number
  workdir: string
  agent: string
}

interface Skill {
  name: string
  description: string
  parameters: { name: string; type: string; description: string }[]
  implementation: string
}

interface ClientMessage {
  type: "INPUT" | "RESIZE" | "SPAWN_SPRITE" | "SWITCH_SPRITE" | "KILL_SPRITE"
  payload: unknown
}

interface ServerMessage {
  type: "OUTPUT" | "SPRITE_CREATED" | "SPRITE_LIST" | "ARTIFACT_UPDATE" | "SKILL_LOADED" | "ERROR"
  payload: unknown
}

// ============================================================================
// State
// ============================================================================

const sprites: Map<string, Sprite> = new Map()
const skills: Map<string, Skill> = new Map()
let activeSprite: string | null = null
let windowCounter = 0

// ============================================================================
// Tmux Management (Pure Bun)
// ============================================================================

async function initTmuxSession(): Promise<void> {
  // Check if session exists
  const check = await Bun.$`tmux has-session -t ${SESSION_NAME} 2>/dev/null`.quiet().nothrow()

  if (check.exitCode !== 0) {
    // Create new session
    await Bun.$`tmux new-session -d -s ${SESSION_NAME} -n main`.quiet()
    console.log(`[tmux] Created session: ${SESSION_NAME}`)
  } else {
    console.log(`[tmux] Session exists: ${SESSION_NAME}`)
  }
}

async function spawnSprite(name: string, workdir: string, agent: string = "claude"): Promise<Sprite> {
  const id = `sprite-${Date.now()}`
  windowCounter++

  // Create new tmux window
  await Bun.$`tmux new-window -t ${SESSION_NAME} -n ${name}`.quiet()

  // Get the window ID
  const windowIdResult = await Bun.$`tmux display-message -t ${SESSION_NAME}:${name} -p '#{window_id}'`.quiet()
  const windowId = parseInt(windowIdResult.text().trim().replace("@", ""), 10) || windowCounter

  // Set working directory and start agent
  await Bun.$`tmux send-keys -t ${SESSION_NAME}:${name} "cd ${workdir} && ${agent}" Enter`.quiet()

  const sprite: Sprite = { id, name, windowId, workdir, agent }
  sprites.set(id, sprite)
  activeSprite = id

  console.log(`[sprite] Created: ${name} (${id}) in ${workdir}`)
  return sprite
}

async function killSprite(id: string): Promise<void> {
  const sprite = sprites.get(id)
  if (!sprite) return

  await Bun.$`tmux kill-window -t ${SESSION_NAME}:${sprite.name}`.quiet().nothrow()
  sprites.delete(id)

  if (activeSprite === id) {
    activeSprite = sprites.keys().next().value ?? null
  }
  console.log(`[sprite] Killed: ${sprite.name}`)
}

async function sendInput(input: string): Promise<void> {
  if (!activeSprite) return
  const sprite = sprites.get(activeSprite)
  if (!sprite) return

  // Send keys to tmux (escape special chars)
  await Bun.$`tmux send-keys -t ${SESSION_NAME}:${sprite.name} -l ${input}`.quiet()
}

async function captureOutput(): Promise<string> {
  if (!activeSprite) return ""
  const sprite = sprites.get(activeSprite)
  if (!sprite) return ""

  const result = await Bun.$`tmux capture-pane -t ${SESSION_NAME}:${sprite.name} -p -S -100`.quiet().nothrow()
  return result.text()
}

// ============================================================================
// Skill Parser (Markdown → Tool Definition)
// ============================================================================

function parseSkillMarkdown(content: string, filename: string): Skill | null {
  const lines = content.split("\n")

  let name = filename.replace(".md", "")
  let description = ""
  let parameters: Skill["parameters"] = []
  let implementation = ""
  let inImplementation = false

  for (const line of lines) {
    if (line.startsWith("# Skill:")) {
      name = line.replace("# Skill:", "").trim()
    } else if (line.startsWith("Description:")) {
      description = line.replace("Description:", "").trim()
    } else if (line.startsWith("- Name:")) {
      name = line.replace("- Name:", "").trim()
    } else if (line.startsWith("- Description:")) {
      description = line.replace("- Description:", "").trim()
    } else if (line.match(/^\s+-\s+(\w+)\s+\((\w+)\):/)) {
      const match = line.match(/^\s+-\s+(\w+)\s+\((\w+)\):\s*(.*)/)
      if (match) {
        parameters.push({
          name: match[1],
          type: match[2],
          description: match[3] || ""
        })
      }
    } else if (line.includes("## Implementation")) {
      inImplementation = true
    } else if (inImplementation && line.startsWith("```")) {
      if (implementation) inImplementation = false
    } else if (inImplementation) {
      implementation += line + "\n"
    }
  }

  if (!name || !description) return null

  return { name, description, parameters, implementation: implementation.trim() }
}

async function loadSkills(): Promise<void> {
  try {
    const files = await readdir(SKILLS_DIR)

    for (const file of files) {
      if (!file.endsWith(".md")) continue

      const content = await readFile(join(SKILLS_DIR, file), "utf-8")
      const skill = parseSkillMarkdown(content, file)

      if (skill) {
        skills.set(skill.name, skill)
        console.log(`[skill] Loaded: ${skill.name}`)
      }
    }
  } catch (e) {
    console.log(`[skill] Skills directory not found: ${SKILLS_DIR}`)
  }
}

function watchSkills(broadcast: (msg: ServerMessage) => void): void {
  try {
    watch(SKILLS_DIR, async (event, filename) => {
      if (!filename?.endsWith(".md")) return

      const filepath = join(SKILLS_DIR, filename)
      try {
        const content = await readFile(filepath, "utf-8")
        const skill = parseSkillMarkdown(content, filename)

        if (skill) {
          skills.set(skill.name, skill)
          console.log(`[skill] Reloaded: ${skill.name}`)
          broadcast({ type: "SKILL_LOADED", payload: skill })
        }
      } catch {
        // File deleted
        const name = filename.replace(".md", "")
        skills.delete(name)
        console.log(`[skill] Removed: ${name}`)
      }
    })
    console.log(`[skill] Watching: ${SKILLS_DIR}`)
  } catch {
    console.log(`[skill] Cannot watch skills directory`)
  }
}

// ============================================================================
// WebSocket Server (Pure Bun)
// ============================================================================

const clients = new Set<unknown>()

const server = Bun.serve({
  port: PORT,

  fetch(req, server) {
    const url = new URL(req.url)

    // Health check
    if (url.pathname === "/health") {
      return new Response("OK")
    }

    // Upgrade to WebSocket
    if (server.upgrade(req)) {
      return undefined
    }

    return new Response("Mothership Engine v1.0", { status: 200 })
  },

  websocket: {
    open(ws) {
      clients.add(ws)
      console.log(`[ws] Client connected (${clients.size} total)`)

      // Send current state
      ws.send(JSON.stringify({
        type: "SPRITE_LIST",
        payload: Array.from(sprites.values())
      }))
    },

    async message(ws, message) {
      try {
        const msg: ClientMessage = JSON.parse(message.toString())

        switch (msg.type) {
          case "INPUT": {
            await sendInput(msg.payload as string)
            break
          }

          case "SPAWN_SPRITE": {
            const { name, workdir, agent } = msg.payload as { name: string; workdir: string; agent?: string }
            const sprite = await spawnSprite(name, workdir, agent)
            broadcast({ type: "SPRITE_CREATED", payload: sprite })
            break
          }

          case "SWITCH_SPRITE": {
            const id = msg.payload as string
            if (sprites.has(id)) {
              activeSprite = id
            }
            break
          }

          case "KILL_SPRITE": {
            await killSprite(msg.payload as string)
            ws.send(JSON.stringify({
              type: "SPRITE_LIST",
              payload: Array.from(sprites.values())
            }))
            break
          }

          case "RESIZE": {
            // Could resize tmux pane here if needed
            break
          }
        }
      } catch (e) {
        ws.send(JSON.stringify({ type: "ERROR", payload: String(e) }))
      }
    },

    close(ws) {
      clients.delete(ws)
      console.log(`[ws] Client disconnected (${clients.size} remaining)`)
    }
  }
})

function broadcast(msg: ServerMessage): void {
  const data = JSON.stringify(msg)
  for (const client of clients) {
    (client as { send: (d: string) => void }).send(data)
  }
}

// Output streaming loop
async function streamOutput(): Promise<void> {
  while (true) {
    if (activeSprite && clients.size > 0) {
      const output = await captureOutput()
      if (output) {
        broadcast({ type: "OUTPUT", payload: output })
      }
    }
    await Bun.sleep(100) // 10 fps
  }
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  console.log(`
╔═══════════════════════════════════════════╗
║     MOTHERSHIP ENGINE v1.0                ║
║     Pure Bun • WebSocket • tmux           ║
╚═══════════════════════════════════════════╝
`)

  await initTmuxSession()
  await loadSkills()
  watchSkills(broadcast)

  // Start output streaming in background
  streamOutput()

  console.log(`[server] Listening on ws://localhost:${PORT}`)
}

main()
