'use client'

import { format } from 'date-fns'
import { ArrowDownLeft, ArrowUpRight, Edit2, MoreHorizontal, RefreshCw, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton, SkeletonLine } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/utils/cn'
import { useToast } from '@/stores/notification.store'

interface Category {
  id: string
  name: string
  color: string
  type: 'INCOME' | 'EXPENSE' | 'BOTH'
}

interface Transaction {
  id: string
  amount: number
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  categoryId: string | null
  description: string
  date: Date
  notes: string | null
  category: Category | null
}

interface TransactionListProps {
  transactions: Transaction[]
  loading?: boolean
  onEdit: (transaction: Transaction) => void
  onRefresh: () => void
}

const typeConfig = {
  INCOME: { icon: ArrowUpRight, color: 'text-[var(--color-success)]', sign: '+' },
  EXPENSE: { icon: ArrowDownLeft, color: 'text-[var(--color-error)]', sign: '-' },
  TRANSFER: { icon: RefreshCw, color: 'text-brand-500', sign: '' },
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function TransactionRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <SkeletonLine width="45%" height={13} />
        <SkeletonLine width="25%" height={11} />
      </div>
      <SkeletonLine width="64px" height={13} />
    </div>
  )
}

function ActionMenu({ transaction, onEdit, onDelete }: {
  transaction: Transaction
  onEdit: (t: Transaction) => void
  onDelete: (id: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => setOpen((o) => !o)}
        aria-label="Transaction actions"
        type="button"
      >
        <MoreHorizontal size={14} />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-36 rounded-lg border border-[var(--color-border)] bg-white py-1 shadow-lg">
            <button
              type="button"
              onClick={() => { setOpen(false); onEdit(transaction) }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]"
            >
              <Edit2 size={12} /> Edit
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); onDelete(transaction.id) }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-[var(--color-error)] hover:bg-red-50"
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export function TransactionList({ transactions, loading, onEdit, onRefresh }: TransactionListProps) {
  const toaster = useToast()

  const deleteMut = trpc.finance.deleteTransaction.useMutation({
    onSuccess: () => {
      toaster.success('Transaction deleted')
      onRefresh()
    },
    onError: (e) => toaster.error(e.message),
  })

  if (loading) {
    return (
      <div>
        {Array.from({ length: 6 }).map((_, i) => <TransactionRowSkeleton key={i} />)}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm font-medium text-[var(--color-text-secondary)]">No transactions yet</p>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">Add your first transaction to get started</p>
      </div>
    )
  }

  return (
    <div>
      {transactions.map((txn) => {
        const cfg = typeConfig[txn.type]
        const TypeIcon = cfg.icon
        return (
          <div
            key={txn.id}
            className="group flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition-colors last:border-0"
          >
            {/* Type icon */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-2)]">
              <TypeIcon size={14} className={cfg.color} aria-hidden="true" />
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                  {txn.description}
                </p>
                {txn.category && (
                  <span
                    className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
                    style={{ background: txn.category.color }}
                  >
                    {txn.category.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">
                {format(new Date(txn.date), 'MMM d, yyyy')}
              </p>
            </div>

            {/* Amount */}
            <div className="shrink-0 text-right">
              <p className={cn('text-sm font-semibold tabular-nums', cfg.color)}>
                {cfg.sign}{fmt(txn.amount)}
              </p>
            </div>

            {/* Action menu */}
            <ActionMenu
              transaction={txn}
              onEdit={onEdit}
              onDelete={(id) => deleteMut.mutate({ id })}
            />
          </div>
        )
      })}
    </div>
  )
}
