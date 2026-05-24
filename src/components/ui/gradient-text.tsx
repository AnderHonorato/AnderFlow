'use client'

import { cn } from '@/lib/utils'

interface GradientTextProps {
  children: React.ReactNode
  animated?: boolean
  className?: string
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'p'
}

export function GradientText({
  children,
  animated = false,
  className,
  as: Tag = 'span',
}: GradientTextProps) {
  return (
    <Tag
      className={cn(
        'font-display',
        animated ? 'text-gradient' : 'text-gradient-static',
        className,
      )}
    >
      {children}
    </Tag>
  )
}
