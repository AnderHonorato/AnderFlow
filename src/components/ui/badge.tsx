import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-1.5 py-0 text-2xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[var(--primary-subtle)] text-[var(--primary)]',
        secondary: 'bg-[var(--surface-hover)] text-[var(--text-secondary)]',
        destructive: 'bg-[var(--destructive-subtle)] text-[var(--destructive)]',
        success: 'bg-[var(--success-subtle)] text-[var(--success)]',
        warning: 'bg-[var(--warning-subtle)] text-[var(--warning)]',
        info: 'bg-[var(--info-subtle)] text-[var(--info)]',
        outline: 'border border-[var(--border)] text-[var(--text)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
