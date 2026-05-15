import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-[var(--primary)] disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]',
        destructive: 'bg-[var(--destructive)] text-white hover:bg-[var(--destructive)]/85',
        outline: 'border border-[var(--border)] bg-transparent hover:bg-[var(--surface-hover)] text-[var(--text)]',
        secondary: 'bg-[var(--surface-hover)] text-[var(--text)] hover:bg-[var(--surface-hover)]/70',
        ghost: 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]',
        link: 'text-[var(--primary)] underline-offset-4 hover:underline',
        success: 'bg-[var(--success)] text-white hover:bg-[var(--success)]/85',
      },
      size: {
        default: 'h-8 px-3 text-xs',
        sm: 'h-7 px-2.5 text-2xs',
        lg: 'h-9 px-4 text-sm',
        icon: 'h-8 w-8',
        'icon-sm': 'h-7 w-7',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
