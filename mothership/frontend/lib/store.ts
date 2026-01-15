import { create } from 'zustand'

export interface Sprite {
  id: string
  name: string
  windowId: number
  workdir: string
  agent: string
}

export interface Artifact {
  path: string
  content: string
  updatedAt: number
}

interface MothershipState {
  // Connection
  connected: boolean
  wsUrl: string
  setWsUrl: (url: string) => void
  setConnected: (connected: boolean) => void

  // Sprites
  sprites: Sprite[]
  activeSprite: string | null
  setSprites: (sprites: Sprite[]) => void
  addSprite: (sprite: Sprite) => void
  setActiveSprite: (id: string) => void

  // Terminal output
  output: string
  setOutput: (output: string) => void

  // Artifacts
  artifacts: Artifact[]
  addArtifact: (artifact: Artifact) => void
}

export const useMothershipStore = create<MothershipState>((set) => ({
  // Connection
  connected: false,
  wsUrl: 'ws://localhost:8080',
  setWsUrl: (url) => set({ wsUrl: url }),
  setConnected: (connected) => set({ connected }),

  // Sprites
  sprites: [],
  activeSprite: null,
  setSprites: (sprites) => set({ sprites }),
  addSprite: (sprite) => set((state) => ({
    sprites: [...state.sprites, sprite],
    activeSprite: sprite.id
  })),
  setActiveSprite: (id) => set({ activeSprite: id }),

  // Terminal
  output: '',
  setOutput: (output) => set({ output }),

  // Artifacts
  artifacts: [],
  addArtifact: (artifact) => set((state) => ({
    artifacts: [
      ...state.artifacts.filter(a => a.path !== artifact.path),
      artifact
    ]
  }))
}))
