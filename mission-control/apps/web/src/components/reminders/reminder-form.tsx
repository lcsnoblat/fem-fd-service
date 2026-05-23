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

type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
type Frequency = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'YEARLY'

interface Reminder {
  id: string
  title: string
  description: string | null
  dueAt: Date | null
  priority: Priority
  tags: string[]
  recurrence: { frequency: Frequency; interval: number } | null
}

interface ReminderFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reminder?: Reminder | null
  onSuccess: () => void
}

export function ReminderForm({ open, onOpenChange, reminder, onSuccess }: ReminderFormProps) {
  const toaster = useToast()
  const isEditing = !!reminder

  const [form, setForm] = useState({
    title: '',
    description: '',
    dueAt: '',
    priority: 'MEDIUM' as Priority,
    tags: '',
    recurring: false,
    frequency: 'WEEKLY' as Frequency,
    interval: '1',
  })

  useEffect(() => {
    if (reminder) {
      setForm({
        title: reminder.title,
        description: reminder.description ?? '',
        dueAt: reminder.dueAt ? format(new Date(reminder.dueAt), "yyyy-MM-dd'T'HH:mm") : '',
        priority: reminder.priority,
        tags: reminder.tags.join(', '),
        recurring: !!reminder.recurrence,
        frequency: reminder.recurrence?.frequency ?? 'WEEKLY',
        interval: String(reminder.recurrence?.interval ?? 1),
      })
    } else {
      setForm({
        title: '',
        description: '',
        dueAt: '',
        priority: 'MEDIUM',
        tags: '',
        recurring: false,
        frequency: 'WEEKLY',
        interval: '1',
      })
    }
  }, [reminder, open])

  const createMut = trpc.reminders.createReminder.useMutation({
    onSuccess: () => {
      toaster.success('Reminder created')
      onOpenChange(false)
      onSuccess()
    },
    onError: (e) => toaster.error(e.message),
  })

  const updateMut = trpc.reminders.updateReminder.useMutation({
    onSuccess: () => {
      toaster.success('Reminder updated')
      onOpenChange(false)
      onSuccess()
    },
    onError: (e) => toaster.error(e.message),
  })

  const isPending = createMut.isPending || updateMut.isPending

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const tags = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const recurrence = form.recurring
      ? { frequency: form.frequency, interval: parseInt(form.interval, 10) }
      : undefined

    const payload = {
      title: form.title,
      description: form.description || undefined,
      dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : undefined,
      priority: form.priority,
      tags,
      recurrence,
    }

    if (isEditing && reminder) {
      const { recurrence: _r, ...updatePayload } = payload
      updateMut.mutate({ id: reminder.id, ...updatePayload })
    } else {
      createMut.mutate(payload)
    }
  }

  const priorityOptions: { value: Priority; label: string; color: string }[] = [
    { value: 'LOW', label: 'Low', color: 'text-[var(--color-text-muted)]' },
    { value: 'MEDIUM', label: 'Medium', color: 'text-[var(--color-info)]' },
    { value: 'HIGH', label: 'High', color: 'text-[var(--color-warning)]' },
    { value: 'URGENT', label: 'Urgent', color: 'text-[var(--color-error)]' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Reminder' : 'New Reminder'}</DialogTitle>
        </DialogHeader>

        <form id="reminder-form" onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="What do you need to remember?"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
              maxLength={200}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dueAt">Due date &amp; time (optional)</Label>
            <Input
              id="dueAt"
              type="datetime-local"
              value={form.dueAt}
              onChange={(e) => setForm((f) => ({ ...f, dueAt: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Priority</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {priorityOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, priority: opt.value }))}
                  className={`h-8 rounded-lg border text-xs font-medium transition-colors ${
                    form.priority === opt.value
                      ? 'border-brand-400 bg-brand-50 text-brand-700'
                      : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              placeholder="work, personal, health"
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Notes</Label>
            <Input
              id="description"
              placeholder="Additional details"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              maxLength={2000}
            />
          </div>

          {/* Recurring */}
          <div className="space-y-3 rounded-lg border border-[var(--color-border)] p-3">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.recurring}
                onChange={(e) => setForm((f) => ({ ...f, recurring: e.target.checked }))}
                className="h-4 w-4 rounded border-[var(--color-border)] accent-brand-500"
              />
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                Recurring reminder
              </span>
            </label>

            {form.recurring && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Frequency</Label>
                  <Select
                    value={form.frequency}
                    onValueChange={(v) => setForm((f) => ({ ...f, frequency: v as Frequency }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'YEARLY'] as Frequency[]).map((f) => (
                        <SelectItem key={f} value={f}>
                          {f.charAt(0) + f.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="interval">Every N times</Label>
                  <Input
                    id="interval"
                    type="number"
                    min="1"
                    max="99"
                    value={form.interval}
                    onChange={(e) => setForm((f) => ({ ...f, interval: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} type="button">
            Cancel
          </Button>
          <Button form="reminder-form" type="submit" loading={isPending}>
            {isEditing ? 'Save Changes' : 'Create Reminder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
