import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-[500] transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[var(--surface-3)] text-[var(--text-2)]',
        secondary: 'bg-[var(--surface-3)] text-[var(--text-2)]',
        destructive: 'bg-[var(--destructive-subtle)] text-[var(--destructive)]',
        success: 'bg-[var(--success-subtle)] text-[var(--success)]',
        warning: 'bg-[var(--warning-subtle)] text-[var(--warning)]',
        info: 'bg-[var(--info-subtle)] text-[var(--info)]',
        outline: 'border border-[var(--border-2)] text-[var(--text-2)] bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

const statusConfig: Record<string, { color: string; label: string }> = {
  'IN_PROGRESS': { color: 'var(--info)', label: 'Em andamento' },
  'COMPLETED': { color: 'var(--success)', label: 'Concluido' },
  'DRAFT': { color: 'var(--text-3)', label: 'Rascunho' },
  'REVIEW': { color: 'var(--warning)', label: 'Revisao' },
  'TODO': { color: 'var(--accent)', label: 'A fazer' },
  'PAID': { color: 'var(--success)', label: 'Pago' },
  'SENT': { color: 'var(--warning)', label: 'Pendente' },
  'OVERDUE': { color: 'var(--destructive)', label: 'Vencido' },
  'OPEN': { color: 'var(--info)', label: 'Aberto' },
  'CLOSED': { color: 'var(--text-3)', label: 'Fechado' },
  'RESOLVED': { color: 'var(--success)', label: 'Resolvido' },
  'PENDING': { color: 'var(--warning)', label: 'Solicitacao' },
  'CANCELLED': { color: 'var(--destructive)', label: 'Cancelado' },
  'NEW': { color: 'var(--info)', label: 'Novo' },
  'QUALIFIED': { color: 'var(--success)', label: 'Qualificado' },
  'PROPOSAL': { color: 'var(--accent)', label: 'Proposta' },
  'CONTACTED': { color: 'var(--warning)', label: 'Contatado' },
  'LOST': { color: 'var(--text-3)', label: 'Perdido' },
  'PENDING_SIGNATURE': { color: 'var(--warning)', label: 'Aguardando assinatura' },
  'SIGNED': { color: 'var(--success)', label: 'Assinado' },
  'ACTIVE': { color: 'var(--success)', label: 'Ativo' },
  'EXPIRED': { color: 'var(--text-3)', label: 'Expirado' },
  'WAITING_CLIENT': { color: 'var(--warning)', label: 'Aguard. cliente' },
  'WAITING_TEAM': { color: 'var(--accent)', label: 'Aguard. equipe' },
  'WON': { color: 'var(--success)', label: 'Fechado' },
  'NEGOTIATION': { color: 'var(--accent)', label: 'Negociacao' },
}

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  status?: string
}

const statusToVariant: Record<string, string> = {
  'COMPLETED': 'success',
  'IN_PROGRESS': 'info',
  'PENDING': 'warning',
  'DRAFT': 'default',
  'REVIEW': 'warning',
  'CANCELLED': 'destructive',
  'PAID': 'success',
  'SENT': 'warning',
  'OVERDUE': 'destructive',
  'OPEN': 'info',
  'CLOSED': 'default',
  'RESOLVED': 'success',
  'NEW': 'info',
  'QUALIFIED': 'success',
  'PROPOSAL': 'info',
  'CONTACTED': 'warning',
  'LOST': 'default',
  'WON': 'success',
  'NEGOTIATION': 'info',
  'ACTIVE': 'success',
  'EXPIRED': 'default',
  'WAITING_CLIENT': 'warning',
  'WAITING_TEAM': 'info',
  'PENDING_SIGNATURE': 'warning',
  'SIGNED': 'success',
  'TODO': 'info',
}

function Badge({ className, variant, status, children, ...props }: BadgeProps) {
  const config = status ? statusConfig[status] : null
  const resolvedVariant = variant ?? (status ? (statusToVariant[status] as any) ?? 'default' : undefined)
  const displayContent = children ?? config?.label
  return (
    <div className={cn(badgeVariants({ variant: resolvedVariant }), className)} {...props}>
      {config && (
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: config.color }} />
      )}
      {displayContent}
    </div>
  )
}

export { Badge, badgeVariants, statusConfig }
