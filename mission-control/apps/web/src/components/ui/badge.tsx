import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils/cn'

const badgeVariants = cva(
  [
    'inline-flex items-center rounded-full px-2 py-0.5',
    'text-[11px] font-semibold uppercase tracking-wider',
    'border',
  ],
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-600 border-gray-200',
        brand: 'bg-brand-50 text-brand-700 border-brand-200',
        success: 'bg-[var(--color-success-bg)] text-[var(--color-success)] border-emerald-200',
        warning: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)] border-amber-200',
        error: 'bg-[var(--color-error-bg)] text-[var(--color-error)] border-red-200',
        info: 'bg-[var(--color-info-bg)] text-[var(--color-info)] border-blue-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
