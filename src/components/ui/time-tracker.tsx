'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Play, Pause } from 'lucide-react'

interface TimeTrackerProps {
  taskId: string
  projectId?: string
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function TimeTracker({ taskId, projectId }: TimeTrackerProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [loading, setLoading] = useState(false)
  const [_entryId, setEntryId] = useState<string | null>(null)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    const checkActive = async () => {
      try {
        const res = await fetch(`/api/time-entries?taskId=${encodeURIComponent(taskId)}`)
        const json = await res.json()
        if (json.data?.length > 0) {
          const active = json.data.find((e: any) => !e.endAt)
          if (active) {
            setIsRunning(true)
            setEntryId(active.id)
            const startMs = new Date(active.startAt).getTime()
            startTimeRef.current = startMs
            const currentElapsed = Math.floor((Date.now() - startMs) / 1000)
            setElapsed(currentElapsed)
          }
        }
      } catch {}
    }
    checkActive()
  }, [taskId])

  useEffect(() => {
    if (!isRunning) return
    const interval = setInterval(() => {
      if (startTimeRef.current) {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [isRunning])

  const handleToggle = useCallback(async () => {
    setLoading(true)

    if (isRunning) {
      try {
        const res = await fetch('/api/time-entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId, projectId, action: 'stop' }),
        })
        if (res.ok) {
          setIsRunning(false)
          startTimeRef.current = null
          setEntryId(null)
          toast.success('Timer parado')
        } else {
          const json = await res.json()
          toast.error(json.error || 'Erro ao parar timer')
        }
      } catch {
        toast.error('Erro ao parar timer')
      }
    } else {
      try {
        const res = await fetch('/api/time-entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId, projectId, action: 'start' }),
        })
        if (res.ok) {
          const json = await res.json()
          setIsRunning(true)
          setEntryId(json.data?.id || null)
          startTimeRef.current = Date.now()
          setElapsed(0)
          toast.success('Timer iniciado')
        } else {
          const json = await res.json()
          toast.error(json.error || 'Erro ao iniciar timer')
        }
      } catch {
        toast.error('Erro ao iniciar timer')
      }
    }

    setLoading(false)
  }, [isRunning, taskId, projectId])

  return (
    <div className="inline-flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        disabled={loading}
        className="h-7 px-2 text-[11px] gap-1"
        style={{ color: isRunning ? 'var(--success)' : 'var(--text-3)' }}
      >
        {isRunning ? <Pause className="w-[12px] h-[12px]" /> : <Play className="w-[12px] h-[12px]" />}
        <span className="font-mono text-[11px] tabular-nums">
          {formatTime(elapsed)}
        </span>
      </Button>
    </div>
  )
}
