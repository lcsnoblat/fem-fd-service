'use client'

import { format, parse } from 'date-fns'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { cn } from '@/lib/utils/cn'

interface MonthPoint {
  month: string
  income: number
  expense: number
  balance: number
}

interface IncomeExpenseChartProps {
  data: MonthPoint[]
  className?: string
}

function fmt(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`
  return `$${n.toFixed(0)}`
}

export function IncomeExpenseChart({ data, className }: IncomeExpenseChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: format(parse(d.month, 'yyyy-MM', new Date()), 'MMM yy'),
  }))

  return (
    <div className={cn('h-[200px]', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={fmt}
            tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value),
              name.charAt(0).toUpperCase() + name.slice(1),
            ]}
            contentStyle={{
              borderRadius: '10px',
              border: '1px solid var(--color-border)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
              fontSize: '12px',
            }}
          />
          <Area
            type="monotone"
            dataKey="income"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#incomeGrad)"
          />
          <Area
            type="monotone"
            dataKey="expense"
            stroke="#ef4444"
            strokeWidth={2}
            fill="url(#expenseGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
