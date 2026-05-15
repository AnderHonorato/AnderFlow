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
      'stat-card h-[52px] px-3 py-2.5 rounded-lg bg-[var(--surface)] flex items-center gap-2.5 transition-colors duration-150 hover:bg-[var(--surface-hover)]',
      className
    )}>
      <div className="w-6 h-6 flex items-center justify-center opacity-75">
        {icon}
      </div>
      <div className="flex flex-col justify-center">
        <span className="text-base font-medium leading-none text-[var(--text)]">{value}</span>
        <span className="mt-1 text-2xs leading-none text-[var(--text-muted)]">{label}</span>
      </div>
    </div>
  )
}
