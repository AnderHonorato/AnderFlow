'use client'

import { useState, useEffect } from 'react'
import { X, Lightbulb } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface OnboardingTipProps {
  id: string
  title: string
  description: string
  className?: string
}

export function OnboardingTip({ id, title, description, className }: OnboardingTipProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(`tip_${id}`)
    if (!dismissed) {
      const timer = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(timer)
    }
  }, [id])

  const dismiss = () => {
    setVisible(false)
    localStorage.setItem(`tip_${id}`, '1')
  }

  if (!visible) return null

  return (
    <div className={cn(
      'relative flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 animate-fade-in',
      className
    )}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Lightbulb className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        className="shrink-0 h-6 w-6 text-muted-foreground hover:text-foreground"
        onClick={dismiss}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}
