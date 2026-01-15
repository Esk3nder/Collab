'use client'

import { useEffect, useRef } from 'react'
import { Terminal as XTerm } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { useMothershipStore } from '@/lib/store'
import { sendInput } from '@/lib/websocket'
import 'xterm/css/xterm.css'

export function Terminal() {
  const termRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const output = useMothershipStore((s) => s.output)
  const connected = useMothershipStore((s) => s.connected)

  // Initialize xterm
  useEffect(() => {
    if (!termRef.current || xtermRef.current) return

    const term = new XTerm({
      cursorBlink: true,
      cursorStyle: 'block',
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: 14,
      theme: {
        background: '#0d0d0d',
        foreground: '#e0e0e0',
        cursor: '#00ff41',
        cursorAccent: '#0d0d0d',
        selectionBackground: '#8b5cf655',
        black: '#0d0d0d',
        green: '#00ff41',
        brightGreen: '#00ff41',
        cyan: '#00d9ff',
        brightCyan: '#00d9ff',
        magenta: '#8b5cf6',
        brightMagenta: '#a78bfa',
      }
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(termRef.current)
    fitAddon.fit()

    // Handle input
    term.onData((data) => {
      if (connected) {
        sendInput(data)
      }
    })

    // Handle resize
    const handleResize = () => fitAddon.fit()
    window.addEventListener('resize', handleResize)

    xtermRef.current = term
    fitAddonRef.current = fitAddon

    return () => {
      window.removeEventListener('resize', handleResize)
      term.dispose()
    }
  }, [connected])

  // Update terminal with output
  useEffect(() => {
    if (xtermRef.current && output) {
      xtermRef.current.clear()
      xtermRef.current.write(output.replace(/\n/g, '\r\n'))
    }
  }, [output])

  // Refit on container size change
  useEffect(() => {
    fitAddonRef.current?.fit()
  }, [])

  return (
    <div className="h-full w-full bg-matrix-dark rounded-lg overflow-hidden border border-gray-800">
      <div ref={termRef} className="h-full w-full" />
    </div>
  )
}
