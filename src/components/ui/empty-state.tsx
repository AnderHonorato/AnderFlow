import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-6 text-center',
      'animate-fade-up',
      className
    )}>
      {icon && (
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl
          bg-[var(--surface-2)] border border-[var(--border)] mb-4
          animate-scale-in"
          style={{ animationDelay: '100ms' }}>
          <div className="opacity-40">{icon}</div>
        </div>
      )}
      <p className="text-[14px] font-[500] text-[var(--text)] mb-1 animate-fade-up"
        style={{ animationDelay: '150ms' }}>
        {title}
      </p>
      {description && (
        <p className="text-[12px] text-[var(--text-3)] max-w-[280px] leading-relaxed animate-fade-up"
          style={{ animationDelay: '200ms' }}>
          {description}
        </p>
      )}
      {action && (
        <div className="mt-4 animate-fade-up" style={{ animationDelay: '250ms' }}>
          {action}
        </div>
      )}
    </div>
  )
}
