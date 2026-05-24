'use client'

import { motion } from 'framer-motion'

interface TimelineItem {
  id: string
  type: 'update' | 'comment' | 'invoice' | 'contract'
  description: string
  actor: string
  createdAt: string
}

const typeConfig: Record<string, { color: string; bg: string; label: string }> = {
  update: { color: 'var(--accent)', bg: 'var(--accent-subtle)', label: 'Atualização' },
  comment: { color: 'var(--info)', bg: 'var(--info-subtle)', label: 'Comentário' },
  invoice: { color: 'var(--success)', bg: 'var(--success-subtle)', label: 'Financeiro' },
  contract: { color: 'var(--warning)', bg: 'var(--warning-subtle)', label: 'Contrato' },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `há ${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  return `há ${days}d`
}

export function ActivityTimeline({ items }: { items: TimelineItem[] }) {
  if (!items.length) return <p className="text-sm text-muted-foreground text-center py-8">Nenhuma atividade registrada</p>

  return (
    <div className="relative pl-6">
      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-[var(--border)]" />
      {items.map((item, i) => {
        const cfg = typeConfig[item.type] || typeConfig.update
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative pb-4 last:pb-0"
          >
            <div className="absolute left-[-15px] top-1 w-3 h-3 rounded-full border-2" style={{ background: cfg.bg, borderColor: cfg.color }} />
            <div className="ml-2">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] px-1.5 py-px rounded font-medium" style={{ color: cfg.color, background: cfg.bg }}>{cfg.label}</span>
                <span className="text-[10px] text-[var(--text-3)]">{timeAgo(item.createdAt)}</span>
              </div>
              <p className="text-[12px] text-[var(--text)]">{item.description}</p>
              {item.actor && <p className="text-[10px] text-[var(--text-3)] mt-0.5">{item.actor}</p>}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
