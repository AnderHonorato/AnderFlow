import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-1 text-[13px] placeholder:text-[var(--text-3)] focus-visible:outline-none focus-visible:border-[var(--accent)] hover:border-[var(--border-2)] disabled:cursor-not-allowed disabled:opacity-40 transition-colors duration-150',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
