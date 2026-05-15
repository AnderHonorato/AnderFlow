import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-5', className)}>
      <div>
        <h1 className="text-lg font-medium text-[var(--text)]">{title}</h1>
        {description && (
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}
