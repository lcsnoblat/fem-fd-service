'use client'

import { format } from 'date-fns'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { trpc } from '@/lib/trpc/client'
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
}

interface TransactionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction?: Transaction | null
  categories: Category[]
  onSuccess: () => void
}

export function TransactionForm({
  open,
  onOpenChange,
  transaction,
  categories,
  onSuccess,
}: TransactionFormProps) {
  const toaster = useToast()
  const isEditing = !!transaction

  const [form, setForm] = useState({
    amount: '',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE' | 'TRANSFER',
    categoryId: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  })

  useEffect(() => {
    if (transaction) {
      setForm({
        amount: String(transaction.amount),
        type: transaction.type,
        categoryId: transaction.categoryId ?? '',
        description: transaction.description,
        date: format(new Date(transaction.date), 'yyyy-MM-dd'),
        notes: transaction.notes ?? '',
      })
    } else {
      setForm({
        amount: '',
        type: 'EXPENSE',
        categoryId: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        notes: '',
      })
    }
  }, [transaction, open])

  const createMut = trpc.finance.createTransaction.useMutation({
    onSuccess: () => {
      toaster.success('Transaction added')
      onOpenChange(false)
      onSuccess()
    },
    onError: (e) => toaster.error(e.message),
  })

  const updateMut = trpc.finance.updateTransaction.useMutation({
    onSuccess: () => {
      toaster.success('Transaction updated')
      onOpenChange(false)
      onSuccess()
    },
    onError: (e) => toaster.error(e.message),
  })

  const isPending = createMut.isPending || updateMut.isPending

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseFloat(form.amount)
    if (isNaN(amount) || amount <= 0) {
      toaster.error('Enter a valid amount')
      return
    }

    const payload = {
      amount,
      type: form.type,
      categoryId: form.categoryId || undefined,
      description: form.description,
      date: form.date,
      notes: form.notes || undefined,
    }

    if (isEditing && transaction) {
      updateMut.mutate({ id: transaction.id, ...payload })
    } else {
      createMut.mutate(payload)
    }
  }

  const filteredCategories = categories.filter(
    (c) => c.type === form.type || c.type === 'BOTH',
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Transaction' : 'New Transaction'}</DialogTitle>
        </DialogHeader>

        <form id="txn-form" onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Type */}
          <div className="space-y-1.5">
            <Label htmlFor="type">Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {(['INCOME', 'EXPENSE', 'TRANSFER'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t, categoryId: '' }))}
                  className={`h-8 rounded-lg border text-xs font-medium transition-colors ${
                    form.type === t
                      ? t === 'INCOME'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : t === 'EXPENSE'
                          ? 'border-red-400 bg-red-50 text-red-700'
                          : 'border-brand-400 bg-brand-50 text-brand-700'
                      : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'
                  }`}
                >
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="e.g. Grocery run"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              maxLength={200}
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select
              value={form.categoryId}
              onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="No category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No category</SelectItem>
                {filteredCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              placeholder="Any extra details"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              maxLength={1000}
            />
          </div>
        </form>

        <DialogFooter>
          <Button variant="secondary" size="md" onClick={() => onOpenChange(false)} type="button">
            Cancel
          </Button>
          <Button form="txn-form" type="submit" loading={isPending}>
            {isEditing ? 'Save Changes' : 'Add Transaction'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
