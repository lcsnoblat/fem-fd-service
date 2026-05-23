'use client'

import { format } from 'date-fns'
import { motion } from 'framer-motion'
import {
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  Plus,
  Scale,
  TrendingUp,
} from 'lucide-react'
import { useState } from 'react'

import { BudgetCard } from '@/components/finance/budget-card'
import { IncomeExpenseChart } from '@/components/finance/income-expense-chart'
import { SpendingDonut } from '@/components/finance/spending-donut'
import { TransactionForm } from '@/components/finance/transaction-form'
import { TransactionList } from '@/components/finance/transaction-list'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton, SkeletonLine } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' } },
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

const currentMonth = format(new Date(), 'yyyy-MM')

// ─── Summary stat card ────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
  positive?: boolean
  loading?: boolean
}

function StatCard({ label, value, icon: Icon, iconBg, iconColor, positive, loading }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
            {label}
          </p>
          {loading ? (
            <SkeletonLine width="60%" height={24} />
          ) : (
            <p
              className={`text-2xl font-bold tabular-nums ${
                positive === undefined
                  ? 'text-[var(--color-text-primary)]'
                  : positive
                    ? 'text-[var(--color-success)]'
                    : 'text-[var(--color-error)]'
              }`}
            >
              {value}
            </p>
          )}
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon size={20} className={iconColor} aria-hidden="true" />
        </div>
      </div>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FinancePage() {
  const [formOpen, setFormOpen] = useState(false)
  const [editingTxn, setEditingTxn] = useState<null | Parameters<typeof TransactionForm>[0]['transaction']>(null)

  const utils = trpc.useUtils()

  const { data: summary, isLoading: summaryLoading } = trpc.finance.getSpendingSummary.useQuery({
    month: currentMonth,
  })
  const { data: trend, isLoading: trendLoading } = trpc.finance.getMonthlyTrend.useQuery({ months: 6 })
  const { data: budgets, isLoading: budgetsLoading } = trpc.finance.getBudgets.useQuery()
  const { data: txnData, isLoading: txnLoading, refetch: refetchTxns } = trpc.finance.getTransactions.useQuery({
    page: 1,
    pageSize: 10,
  })
  const { data: categories = [] } = trpc.finance.getCategories.useQuery()

  function refresh() {
    void utils.finance.getTransactions.invalidate()
    void utils.finance.getSpendingSummary.invalidate()
    void utils.finance.getBudgets.invalidate()
    void utils.finance.getMonthlyTrend.invalidate()
  }

  const balance = summary ? summary.totalIncome - summary.totalExpense : 0
  const savingsRate =
    summary && summary.totalIncome > 0
      ? Math.round(((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100)
      : 0

  return (
    <>
      <TransactionForm
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o)
          if (!o) setEditingTxn(null)
        }}
        transaction={editingTxn}
        categories={categories}
        onSuccess={refresh}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Finance</h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              {format(new Date(), 'MMMM yyyy')} · Track income, expenses & budgets
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus size={16} />
            Add Transaction
          </Button>
        </motion.div>

        {/* Summary stats */}
        <motion.section variants={itemVariants} aria-labelledby="finance-stats-heading">
          <h2 id="finance-stats-heading" className="sr-only">Monthly Summary</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Income"
              value={summaryLoading ? '—' : fmt(summary?.totalIncome ?? 0)}
              icon={ArrowUpRight}
              iconBg="bg-emerald-50"
              iconColor="text-[var(--color-success)]"
              positive={true}
              loading={summaryLoading}
            />
            <StatCard
              label="Expenses"
              value={summaryLoading ? '—' : fmt(summary?.totalExpense ?? 0)}
              icon={ArrowDownLeft}
              iconBg="bg-red-50"
              iconColor="text-[var(--color-error)]"
              positive={false}
              loading={summaryLoading}
            />
            <StatCard
              label="Balance"
              value={summaryLoading ? '—' : fmt(balance)}
              icon={Scale}
              iconBg="bg-brand-50"
              iconColor="text-brand-500"
              positive={balance >= 0}
              loading={summaryLoading}
            />
            <StatCard
              label="Savings Rate"
              value={summaryLoading ? '—' : `${savingsRate}%`}
              icon={TrendingUp}
              iconBg="bg-sky-50"
              iconColor="text-[var(--color-info)]"
              positive={savingsRate >= 20}
              loading={summaryLoading}
            />
          </div>
        </motion.section>

        {/* Charts row */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Spending donut */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Spending by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <div className="flex h-[280px] items-center justify-center">
                  <Skeleton className="h-40 w-40 rounded-full" />
                </div>
              ) : (
                <SpendingDonut
                  data={summary?.byCategory ?? []}
                  totalExpense={summary?.totalExpense ?? 0}
                />
              )}
            </CardContent>
          </Card>

          {/* Income vs Expense trend */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle>Income vs Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              {trendLoading ? (
                <div className="h-[200px] flex items-end gap-2 px-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="flex-1 rounded" style={{ height: `${40 + Math.random() * 100}px` }} />
                  ))}
                </div>
              ) : (
                <IncomeExpenseChart data={trend ?? []} />
              )}
              <div className="mt-3 flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-3 rounded-sm bg-[var(--color-success)]" />
                  Income
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-3 rounded-sm bg-[var(--color-error)]" />
                  Expenses
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Budgets + Recent Transactions */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Budgets */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Budgets</CardTitle>
                <DollarSign size={16} className="text-[var(--color-text-muted)]" />
              </div>
            </CardHeader>
            <CardContent>
              {budgetsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <SkeletonLine width="70%" height={12} />
                      <Skeleton className="h-1.5 w-full rounded-full" />
                    </div>
                  ))}
                </div>
              ) : budgets && budgets.length > 0 ? (
                <div className="space-y-5">
                  {budgets.map((b) => (
                    <BudgetCard
                      key={b.id}
                      categoryName={b.category?.name ?? 'Unknown'}
                      categoryColor={b.category?.color ?? '#6366f1'}
                      amount={b.amount.toNumber()}
                      spent={Number(b.spent)}
                      percentage={b.percentage}
                      isOverBudget={b.isOverBudget}
                      isNearAlert={b.isNearAlert}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)] text-center py-8">
                  No budgets set up yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle>Recent Transactions</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setFormOpen(true)}>
                  <Plus size={14} />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-0 pt-2">
              <TransactionList
                transactions={(txnData?.transactions ?? []).map((t) => ({
                  ...t,
                  amount: Number(t.amount),
                }))}
                loading={txnLoading}
                onEdit={(t) => {
                  setEditingTxn(t)
                  setFormOpen(true)
                }}
                onRefresh={refresh}
              />
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </>
  )
}
