import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md bg-[var(--input-bg)] px-2.5 py-2 text-sm placeholder:text-[var(--placeholder)] focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-[var(--primary)] hover:bg-[var(--input-bg-hover)] disabled:cursor-not-allowed disabled:opacity-40 transition-colors duration-150',
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
