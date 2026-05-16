'use client'

import { useState, useEffect } from 'react'
import { Button } from './button'
import { cn } from '@/lib/utils'
import { IconClose } from '@/components/icons'

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
      'relative flex items-start gap-3 rounded-lg border border-[var(--border-2)] bg-[var(--accent-subtle)] p-3 animate-fade-in',
      className
    )}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-subtle-2)]">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round">
          <path d="M8 14A6 6 0 108 2a6 6 0 000 12z"/>
          <path d="M8 11v.01M8 5v4"/>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-[500] text-[var(--text)]">{title}</p>
        <p className="text-[12px] text-[var(--text-3)] mt-0.5 leading-relaxed">{description}</p>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        className="shrink-0 h-6 w-6 text-[var(--text-3)] hover:text-[var(--text)]"
        onClick={dismiss}
      >
        <IconClose className="w-[12px] h-[12px]" />
      </Button>
    </div>
  )
}
