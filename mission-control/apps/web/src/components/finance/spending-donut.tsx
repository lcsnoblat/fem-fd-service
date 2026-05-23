'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { cn } from '@/lib/utils/cn'

const PALETTE = [
  '#6366f1', '#10b981', '#f97316', '#3b82f6', '#ec4899',
  '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444', '#0ea5e9',
]

interface SpendingSlice {
  category: { name: string; color: string } | null
  spent: number
  percentage: number
}

interface SpendingDonutProps {
  data: SpendingSlice[]
  totalExpense: number
  className?: string
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export function SpendingDonut({ data, totalExpense, className }: SpendingDonutProps) {
  const chartData = data.slice(0, 10).map((d, i) => ({
    name: d.category?.name ?? 'Uncategorised',
    value: d.spent,
    percentage: d.percentage,
    color: d.category?.color ?? PALETTE[i % PALETTE.length],
  }))

  if (chartData.length === 0) {
    return (
      <div className={cn('flex h-[220px] items-center justify-center', className)}>
        <p className="text-sm text-[var(--color-text-muted)]">No expenses this month</p>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [fmt(value), 'Spent']}
              contentStyle={{
                borderRadius: '10px',
                border: '1px solid var(--color-border)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                fontSize: '12px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Centre label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xs text-[var(--color-text-muted)]">Total</p>
          <p className="text-lg font-bold text-[var(--color-text-primary)] tabular-nums">
            {fmt(totalExpense)}
          </p>
        </div>
      </div>

      {/* Legend */}
      <ul className="flex flex-col gap-1.5">
        {chartData.map((entry, i) => (
          <li key={i} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: entry.color }}
            />
            <span className="flex-1 truncate text-[var(--color-text-secondary)]">{entry.name}</span>
            <span className="font-medium tabular-nums text-[var(--color-text-primary)]">
              {entry.percentage}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
