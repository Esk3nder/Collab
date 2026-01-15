'use client'

import { useState } from 'react'
import { useMothershipStore } from '@/lib/store'
import { spawnSprite, switchSprite, killSprite } from '@/lib/websocket'

export function SpriteList() {
  const sprites = useMothershipStore((s) => s.sprites)
  const activeSprite = useMothershipStore((s) => s.activeSprite)
  const connected = useMothershipStore((s) => s.connected)

  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newWorkdir, setNewWorkdir] = useState('~/projects')
  const [newAgent, setNewAgent] = useState('claude')

  const handleSpawn = () => {
    if (newName.trim()) {
      spawnSprite(newName.trim(), newWorkdir, newAgent)
      setNewName('')
      setShowNew(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-900/50 border-r border-gray-800">
      {/* Header */}
      <div className="p-3 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-400">Sprites</h2>
          <button
            onClick={() => setShowNew(!showNew)}
            disabled={!connected}
            className="text-xs px-2 py-1 rounded bg-lavender-500 hover:bg-lavender-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + New
          </button>
        </div>
      </div>

      {/* New Sprite Form */}
      {showNew && (
        <div className="p-3 border-b border-gray-800 space-y-2">
          <input
            type="text"
            placeholder="Sprite name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded focus:border-lavender-500 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Working directory"
            value={newWorkdir}
            onChange={(e) => setNewWorkdir(e.target.value)}
            className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded focus:border-lavender-500 focus:outline-none"
          />
          <select
            value={newAgent}
            onChange={(e) => setNewAgent(e.target.value)}
            className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded focus:border-lavender-500 focus:outline-none"
          >
            <option value="claude">Claude Code</option>
            <option value="codex">OpenAI Codex</option>
            <option value="bash">Bash Shell</option>
          </select>
          <button
            onClick={handleSpawn}
            className="w-full py-1 text-sm rounded bg-matrix-green text-black font-medium hover:bg-green-400"
          >
            Spawn Sprite
          </button>
        </div>
      )}

      {/* Sprite List */}
      <div className="flex-1 overflow-y-auto">
        {sprites.length === 0 ? (
          <div className="p-3 text-sm text-gray-500 text-center">
            No active sprites
          </div>
        ) : (
          sprites.map((sprite) => (
            <div
              key={sprite.id}
              onClick={() => switchSprite(sprite.id)}
              className={`p-3 cursor-pointer border-b border-gray-800/50 hover:bg-gray-800/50 ${
                activeSprite === sprite.id ? 'bg-gray-800 border-l-2 border-l-matrix-green' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-200">{sprite.name}</div>
                  <div className="text-xs text-gray-500">{sprite.workdir}</div>
                  <div className="text-xs text-lavender-400">{sprite.agent}</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    killSprite(sprite.id)
                  }}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
