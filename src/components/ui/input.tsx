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
          'flex h-8 w-full rounded-md bg-[var(--input-bg)] px-2.5 py-1 text-sm placeholder:text-[var(--placeholder)] focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-[var(--primary)] hover:bg-[var(--input-bg-hover)] disabled:cursor-not-allowed disabled:opacity-40 transition-colors duration-150',
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
