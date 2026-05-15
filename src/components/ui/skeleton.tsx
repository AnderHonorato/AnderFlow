import { cn } from '@/lib/utils'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-sm bg-[var(--surface-hover)] animate-pulse', className)}
      {...props}
    />
  )
}

export { Skeleton }
