import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, id, ...props }, ref) => {
    const generatedId = React.useId()
    const inputId = id || generatedId
    const errorId = `${inputId}-error`

    return (
      <input
        id={inputId}
        type={type}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'flex h-9 w-full rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-1 text-[13px]',
          'placeholder:text-[var(--text-3)]',
          'transition-[border-color,box-shadow,background-color] transition-duration-[150ms] transition-timing-function-[cubic-bezier(0.2,0,0,1)]',
          'hover:border-[var(--border-2)] hover:bg-[var(--surface-hover)]',
          'focus-visible:outline-none focus-visible:border-[var(--accent)]',
          'focus-visible:ring-[3px] focus-visible:ring-[var(--accent)]/15',
          'disabled:cursor-not-allowed disabled:opacity-40',
          error && 'border-[var(--destructive)] focus-visible:border-[var(--destructive)] focus-visible:ring-[var(--destructive)]/15',
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
