'use client'

import { Trophy, Rocket, FileText, PenTool, Zap, CheckCircle } from 'lucide-react'

const achievementConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  first_project: {
    icon: <Rocket className="h-3.5 w-3.5" />,
    label: 'Primeiro projeto',
    color: 'var(--accent)',
  },
  briefing_sent: {
    icon: <FileText className="h-3.5 w-3.5" />,
    label: 'Briefing enviado',
    color: 'var(--info)',
  },
  contract_signed: {
    icon: <PenTool className="h-3.5 w-3.5" />,
    label: 'Contrato assinado',
    color: 'var(--success)',
  },
  project_halfway: {
    icon: <Zap className="h-3.5 w-3.5" />,
    label: 'Meio caminho',
    color: 'var(--warning)',
  },
  project_complete: {
    icon: <CheckCircle className="h-3.5 w-3.5" />,
    label: 'Projeto entregue',
    color: 'var(--success)',
  },
}

interface AchievementBadgeProps {
  type: string
  unlockedAt?: string
  locked?: boolean
  size?: 'sm' | 'md'
}

export function AchievementBadge({ type, unlockedAt, locked, size = 'md' }: AchievementBadgeProps) {
  const config = achievementConfig[type]
  if (!config) return null

  const baseClass = size === 'sm'
    ? 'px-2 py-0.5 text-[10px] gap-1'
    : 'px-2.5 py-1 text-[11px] gap-1.5'

  return (
    <div
      className={`inline-flex items-center rounded-full border transition-all ${baseClass} ${
        locked
          ? 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-3)] opacity-50'
          : 'bg-[var(--accent-subtle)] border-[var(--accent)]/20 text-[var(--text)]'
      }`}
      title={locked ? `${config.label} (bloqueado)` : `${config.label}${unlockedAt ? ` — ${new Date(unlockedAt).toLocaleDateString('pt-BR')}` : ''}`}
    >
      <span style={{ color: locked ? 'var(--text-3)' : config.color }}>
        {config.icon}
      </span>
      <span>{config.label}</span>
      {locked && (
        <Trophy className="h-3 w-3 text-[var(--text-3)]" />
      )}
    </div>
  )
}

export { achievementConfig }
