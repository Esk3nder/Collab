'use client'

import { useEffect, useState } from 'react'
import { useMothershipStore } from '@/lib/store'
import { connect, disconnect } from '@/lib/websocket'
import { Terminal } from '@/components/Terminal'
import { SpriteList } from '@/components/SpriteList'
import ReactMarkdown from 'react-markdown'

export default function Home() {
  const connected = useMothershipStore((s) => s.connected)
  const wsUrl = useMothershipStore((s) => s.wsUrl)
  const setWsUrl = useMothershipStore((s) => s.setWsUrl)
  const artifacts = useMothershipStore((s) => s.artifacts)

  const [showConnect, setShowConnect] = useState(false)
  const [inputUrl, setInputUrl] = useState(wsUrl)
  const [selectedArtifact, setSelectedArtifact] = useState<string | null>(null)

  // Auto-connect on mount
  useEffect(() => {
    connect(wsUrl)
    return () => disconnect()
  }, [])

  const handleConnect = () => {
    setWsUrl(inputUrl)
    connect(inputUrl)
    setShowConnect(false)
  }

  const activeArtifact = artifacts.find(a => a.path === selectedArtifact)

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="h-12 flex items-center justify-between px-4 border-b border-gray-800 bg-gray-900/80">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-matrix-green">⚡ Mothership</h1>
          <span className="text-xs text-gray-500">v1.0</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-matrix-green' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-400">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Connect Button */}
          <button
            onClick={() => setShowConnect(!showConnect)}
            className="text-xs px-3 py-1 rounded border border-gray-700 hover:border-gray-600"
          >
            {connected ? 'Reconnect' : 'Connect'}
          </button>
        </div>
      </header>

      {/* Connect Dialog */}
      {showConnect && (
        <div className="absolute top-12 right-4 z-50 bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-xl w-80">
          <h3 className="text-sm font-medium mb-3">Connect to Engine</h3>
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="ws://localhost:8080"
            className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded mb-3 focus:border-lavender-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleConnect}
              className="flex-1 py-2 text-sm rounded bg-matrix-green text-black font-medium hover:bg-green-400"
            >
              Connect
            </button>
            <button
              onClick={() => setShowConnect(false)}
              className="px-4 py-2 text-sm rounded border border-gray-700 hover:border-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Rail - Sprites */}
        <aside className="w-56 flex-shrink-0">
          <SpriteList />
        </aside>

        {/* Center - Terminal + Artifacts */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Terminal (bottom half) */}
          <div className="flex-1 p-4 min-h-0">
            <Terminal />
          </div>

          {/* Artifact Tabs */}
          {artifacts.length > 0 && (
            <div className="h-64 border-t border-gray-800 flex flex-col">
              {/* Tabs */}
              <div className="flex gap-1 px-4 pt-2 border-b border-gray-800 overflow-x-auto">
                {artifacts.map((a) => (
                  <button
                    key={a.path}
                    onClick={() => setSelectedArtifact(a.path)}
                    className={`px-3 py-1 text-xs rounded-t border-t border-l border-r ${
                      selectedArtifact === a.path
                        ? 'bg-gray-800 border-gray-700 text-gray-200'
                        : 'bg-transparent border-transparent text-gray-500 hover:text-gray-400'
                    }`}
                  >
                    {a.path.split('/').pop()}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-4">
                {activeArtifact ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{activeArtifact.content}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    Select an artifact to view
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
