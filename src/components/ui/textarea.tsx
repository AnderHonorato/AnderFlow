import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2 text-[13px] placeholder:text-[var(--text-3)] focus-visible:outline-none focus-visible:border-[var(--accent)] hover:border-[var(--border-2)] disabled:cursor-not-allowed disabled:opacity-40 transition-colors duration-150',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
