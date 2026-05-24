'use client'

import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  strong?: boolean
}

export function GlassCard({ children, className, strong = false }: GlassCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl',
        strong ? 'glass-strong' : 'glass',
        className,
      )}
    >
      {children}
    </div>
  )
}
