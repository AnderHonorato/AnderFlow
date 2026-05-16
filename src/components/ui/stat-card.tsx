import { cn } from '@/lib/utils'

interface StatCardProps {
  icon: React.ReactNode
  value: string | number
  label: string
  className?: string
}

export function StatCard({ icon, value, label, className }: StatCardProps) {
  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-2)] transition-all duration-150',
      className
    )}>
      <div className="w-8 h-8 rounded-lg bg-[var(--surface-3)] flex items-center justify-center flex-shrink-0">
        <span className="w-4 h-4 text-[var(--text-2)]">{icon}</span>
      </div>
      <div>
        <div className="text-[17px] font-[500] text-[var(--text)] leading-none">{value}</div>
        <div className="text-[11px] text-[var(--text-3)] mt-1">{label}</div>
      </div>
    </div>
  )
}
