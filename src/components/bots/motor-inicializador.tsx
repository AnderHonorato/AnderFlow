'use client'

import { useEffect } from 'react'

export function BotEngineInit() {
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    const controller = new AbortController()

    const run = async () => {
      try {
        await fetch('/api/bots/engine', { method: 'POST', signal: controller.signal })
      } catch {}
    }

    interval = setInterval(run, 15000)
    run()

    return () => {
      controller.abort('cleanup')
      if (interval) clearInterval(interval)
    }
  }, [])

  return null
}
