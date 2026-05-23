'use client'

import { AlertTriangle } from 'lucide-react'

import { cn } from '@/lib/utils/cn'

interface BudgetCardProps {
  categoryName: string
  categoryColor: string
  amount: number
  spent: number
  percentage: number
  isOverBudget: boolean
  isNearAlert: boolean
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export function BudgetCard({
  categoryName,
  categoryColor,
  amount,
  spent,
  percentage,
  isOverBudget,
  isNearAlert,
}: BudgetCardProps) {
  const barColor = isOverBudget
    ? 'bg-[var(--color-error)]'
    : isNearAlert
      ? 'bg-[var(--color-warning)]'
      : 'bg-[var(--color-success)]'

  const clampedPct = Math.min(percentage, 100)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: categoryColor }}
          />
          <span className="truncate text-sm font-medium text-[var(--color-text-primary)]">
            {categoryName}
          </span>
          {(isOverBudget || isNearAlert) && (
            <AlertTriangle
              size={13}
              className={cn(
                'shrink-0',
                isOverBudget ? 'text-[var(--color-error)]' : 'text-[var(--color-warning)]',
              )}
              aria-label={isOverBudget ? 'Over budget' : 'Near budget limit'}
            />
          )}
        </div>
        <div className="shrink-0 text-right">
          <span className={cn('text-sm font-semibold tabular-nums', isOverBudget && 'text-[var(--color-error)]')}>
            {fmt(spent)}
          </span>
          <span className="text-xs text-[var(--color-text-muted)]"> / {fmt(amount)}</span>
        </div>
      </div>

      <div className="relative h-1.5 rounded-full bg-[var(--color-surface-2)]" role="progressbar" aria-valuenow={clampedPct} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={cn('absolute left-0 top-0 h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${clampedPct}%` }}
        />
      </div>

      <p className="text-[10px] text-[var(--color-text-muted)]">
        {percentage}% used · {fmt(Math.max(0, amount - spent))} remaining
      </p>
    </div>
  )
}
