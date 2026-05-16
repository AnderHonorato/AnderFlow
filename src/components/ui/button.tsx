import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 text-[13px] font-[450] transition-all duration-150 select-none disabled:opacity-40 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] rounded-[20px]',
        outline: 'border border-[var(--border-2)] text-[var(--text-2)] hover:text-[var(--text)] hover:border-[rgba(255,255,255,0.15)] rounded-lg bg-transparent',
        ghost: 'text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] rounded-lg',
        secondary: 'bg-[var(--surface-3)] text-[var(--text-2)] hover:bg-[var(--surface-hover)] rounded-lg',
        destructive: 'bg-[var(--destructive)] text-white hover:bg-[var(--destructive)]/85 rounded-[20px]',
        link: 'text-[var(--accent)] underline-offset-4 hover:underline rounded-none',
        success: 'bg-[var(--success)] text-white hover:bg-[var(--success)]/85 rounded-[20px]',
      },
      size: {
        default: 'h-8 px-4',
        sm: 'h-7 px-3 text-[12px]',
        lg: 'h-10 px-6',
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
