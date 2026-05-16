'use client'

import { useEffect, useState, useRef } from 'react'
import { cn } from '@/lib/utils'

function AnimatedNumber({ value }: { value: number }) {
  const [displayed, setDisplayed] = useState(0)
  const frameRef = useRef<number>()

  useEffect(() => {
    const start = displayed
    const end = value
    const duration = 600
    const startTime = performance.now()

    const update = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(start + (end - start) * eased)
      setDisplayed(current)
      if (progress < 1) frameRef.current = requestAnimationFrame(update)
    }

    frameRef.current = requestAnimationFrame(update)
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current) }
  }, [value])

  return <>{displayed}</>
}

interface StatCardProps {
  icon: React.ReactNode
  value: string | number
  label: string
  trend?: 'up' | 'down' | 'neutral'
  className?: string
  index?: number
}

export function StatCard({ icon, value, label, trend, className, index = 0 }: StatCardProps) {
  const isNumeric = typeof value === 'number'

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 rounded-xl',
      'bg-[var(--surface)] border border-[var(--border)]',
      'card-hover animate-card-pop',
      `stagger-${Math.min(index + 1, 6)}`,
      className
    )}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-3)] flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
        <span className="w-4 h-4 text-[var(--text-2)]">{icon}</span>
      </div>
      <div>
        <div className="text-[17px] font-[500] text-[var(--text)] leading-none">
          {isNumeric ? <AnimatedNumber value={value as number} /> : value}
        </div>
        <div className="text-[11px] text-[var(--text-3)] mt-1">{label}</div>
      </div>
    </div>
  )
}
