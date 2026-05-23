'use client'

import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils/cn'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'rounded-lg font-medium text-sm',
    'transition-all duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'select-none',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-brand-500 text-white',
          'hover:bg-brand-600 active:bg-brand-700',
          'shadow-sm hover:shadow-brand',
        ],
        secondary: [
          'bg-white text-brand-600 border border-[var(--color-border)]',
          'hover:bg-brand-50 hover:border-brand-300 active:bg-brand-100',
          'shadow-sm',
        ],
        ghost: [
          'bg-transparent text-[var(--color-text-secondary)]',
          'hover:bg-surface-2 hover:text-[var(--color-text-primary)]',
          'active:bg-[var(--color-border)]',
        ],
        destructive: [
          'bg-[var(--color-error)] text-white',
          'hover:bg-red-600 active:bg-red-700',
          'shadow-sm',
        ],
        'brand-gradient': [
          'bg-gradient-to-r from-indigo-500 to-violet-500 text-white',
          'hover:from-indigo-600 hover:to-violet-600',
          'shadow-sm hover:shadow-brand',
        ],
      },
      size: {
        sm: 'h-8 px-3 text-xs rounded-md',
        md: 'h-9 px-4',
        lg: 'h-10 px-6 text-base',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled ?? loading}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
        )}
        {children}
      </Comp>
    )
  },
)

Button.displayName = 'Button'

export { Button, buttonVariants }
