import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 text-[13px] font-[450] select-none disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden transition-all duration-[150ms] ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg)]',
  {
    variants: {
      variant: {
        default: 'bg-[var(--accent)] text-white rounded-[20px] hover:bg-[var(--accent-hover)] shadow-[0_1px_4px_rgba(232,98,42,0.3)] hover:shadow-[0_2px_12px_rgba(232,98,42,0.4)]',
        outline: 'border border-[var(--border-2)] text-[var(--text-2)] rounded-lg bg-transparent hover:text-[var(--text)] hover:border-[rgba(255,255,255,0.18)] hover:bg-[var(--surface-hover)]',
        ghost: 'text-[var(--text-2)] rounded-lg hover:text-[var(--text)] hover:bg-[var(--surface-hover)]',
        secondary: 'bg-[var(--surface-3)] text-[var(--text-2)] rounded-lg hover:bg-[var(--surface-hover)] hover:text-[var(--text)]',
        destructive: 'bg-[var(--destructive)] text-white rounded-[20px] hover:bg-[var(--destructive)]/85 shadow-[0_1px_4px_rgba(196,74,58,0.3)]',
        link: 'text-[var(--accent)] underline-offset-4 rounded-none hover:underline',
        success: 'bg-[var(--success)] text-white rounded-[20px] hover:bg-[var(--success)]/85',
      },
      size: {
        default: 'h-8 px-4',
        sm: 'h-7 px-3 text-[12px]',
        lg: 'h-10 px-6 text-[14px]',
        icon: 'h-8 w-8',
        'icon-sm': 'h-7 w-7',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
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
