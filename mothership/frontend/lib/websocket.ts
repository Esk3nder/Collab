import { useMothershipStore } from './store'

let ws: WebSocket | null = null

export function connect(url: string): void {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.close()
  }

  ws = new WebSocket(url)

  ws.onopen = () => {
    useMothershipStore.getState().setConnected(true)
    console.log('[ws] Connected')
  }

  ws.onclose = () => {
    useMothershipStore.getState().setConnected(false)
    console.log('[ws] Disconnected')
  }

  ws.onerror = (error) => {
    console.error('[ws] Error:', error)
  }

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      const store = useMothershipStore.getState()

      switch (msg.type) {
        case 'OUTPUT':
          store.setOutput(msg.payload)
          break

        case 'SPRITE_LIST':
          store.setSprites(msg.payload)
          if (msg.payload.length > 0 && !store.activeSprite) {
            store.setActiveSprite(msg.payload[0].id)
          }
          break

        case 'SPRITE_CREATED':
          store.addSprite(msg.payload)
          break

        case 'ARTIFACT_UPDATE':
          store.addArtifact({
            path: msg.payload.path,
            content: msg.payload.content,
            updatedAt: Date.now()
          })
          break

        case 'SKILL_LOADED':
          console.log('[skill] Loaded:', msg.payload.name)
          break
      }
    } catch (e) {
      console.error('[ws] Parse error:', e)
    }
  }
}

export function disconnect(): void {
  ws?.close()
  ws = null
}

export function send(type: string, payload: unknown): void {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, payload }))
  }
}

export function sendInput(input: string): void {
  send('INPUT', input)
}

export function spawnSprite(name: string, workdir: string, agent?: string): void {
  send('SPAWN_SPRITE', { name, workdir, agent })
}

export function switchSprite(id: string): void {
  send('SWITCH_SPRITE', id)
}

export function killSprite(id: string): void {
  send('KILL_SPRITE', id)
}
