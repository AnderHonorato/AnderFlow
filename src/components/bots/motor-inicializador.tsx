'use client'

import { useEffect } from 'react'

export function BotEngineInit() {
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null

    const run = async () => {
      try {
        await fetch('/api/bots/engine', { method: 'POST' })
      } catch {}
    }

    // Executa a cada 15 segundos enquanto o dashboard estiver aberto
    interval = setInterval(run, 15000)
    run()

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [])

  return null
}
