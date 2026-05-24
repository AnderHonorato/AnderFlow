'use client'
import { useEffect, useState } from 'react'

export function AdminPresence({ projectId }: { projectId: string }) {
  const [active, setActive] = useState(false)

  useEffect(() => {
    const check = () => {
      fetch(`/api/presence?projectId=${projectId}`)
        .then(r => r.json())
        .then(json => setActive(json.active || false))
        .catch(() => {})
    }
    check()
    const interval = setInterval(check, 20000)
    return () => clearInterval(interval)
  }, [projectId])

  if (!active) return null

  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--success)] bg-[var(--success-subtle)] px-2 py-0.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
      Trabalhando agora
    </span>
  )
}
