'use client'

import { format, isPast } from 'date-fns'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  RotateCcw,
  Trash2,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'

import { ReminderForm } from '@/components/reminders/reminder-form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton, SkeletonLine } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/utils/cn'
import { useToast } from '@/stores/notification.store'

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
type Status = 'PENDING' | 'DONE' | 'SNOOZED' | 'DISMISSED'
type Frequency = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'YEARLY'

const priorityConfig: Record<Priority, { label: string; color: string; bg: string }> = {
  LOW: { label: 'Low', color: 'text-[var(--color-text-muted)]', bg: 'bg-[var(--color-surface-2)]' },
  MEDIUM: { label: 'Medium', color: 'text-[var(--color-info)]', bg: 'bg-blue-50' },
  HIGH: { label: 'High', color: 'text-[var(--color-warning)]', bg: 'bg-amber-50' },
  URGENT: { label: 'Urgent', color: 'text-[var(--color-error)]', bg: 'bg-red-50' },
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } },
}

// ─── Reminder Row ─────────────────────────────────────────────────────────────

interface ReminderItem {
  id: string
  title: string
  description: string | null
  dueAt: Date | null
  priority: Priority
  status: Status
  tags: string[]
  recurrence: { frequency: Frequency; interval: number } | null
}

interface ReminderRowProps {
  reminder: ReminderItem
  onEdit: (r: ReminderItem) => void
  onRefresh: () => void
}

function ReminderRow({ reminder, onEdit, onRefresh }: ReminderRowProps) {
  const toaster = useToast()
  const pc = priorityConfig[reminder.priority]
  const isOverdue = reminder.dueAt && isPast(new Date(reminder.dueAt)) && reminder.status === 'PENDING'

  const completeMut = trpc.reminders.completeReminder.useMutation({
    onSuccess: () => { toaster.success('Reminder completed'); onRefresh() },
    onError: (e) => toaster.error(e.message),
  })
  const dismissMut = trpc.reminders.dismissReminder.useMutation({
    onSuccess: () => { toaster.info('Reminder dismissed'); onRefresh() },
    onError: (e) => toaster.error(e.message),
  })
  const deleteMut = trpc.reminders.deleteReminder.useMutation({
    onSuccess: () => { toaster.success('Reminder deleted'); onRefresh() },
    onError: (e) => toaster.error(e.message),
  })

  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        'group flex items-start gap-3 rounded-xl border p-4 transition-colors',
        reminder.status === 'DONE'
          ? 'border-[var(--color-border)] bg-[var(--color-surface-2)] opacity-60'
          : isOverdue
            ? 'border-red-200 bg-red-50/50'
            : 'border-[var(--color-border)] bg-white hover:bg-[var(--color-surface-2)]',
      )}
    >
      {/* Complete checkbox */}
      <button
        type="button"
        onClick={() => completeMut.mutate({ id: reminder.id })}
        disabled={reminder.status === 'DONE' || completeMut.isPending}
        className="mt-0.5 shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-success)] disabled:cursor-default transition-colors"
        aria-label="Mark complete"
      >
        {reminder.status === 'DONE' ? (
          <CheckCircle2 size={18} className="text-[var(--color-success)]" />
        ) : (
          <Circle size={18} />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className={cn('text-sm font-medium text-[var(--color-text-primary)]', reminder.status === 'DONE' && 'line-through text-[var(--color-text-muted)]')}>
            {reminder.title}
          </p>
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', pc.color, pc.bg)}>
            {pc.label}
          </span>
          {reminder.recurrence && (
            <RotateCcw size={11} className="text-[var(--color-text-muted)]" aria-label="Recurring" />
          )}
          {isOverdue && (
            <AlertCircle size={13} className="text-[var(--color-error)]" aria-label="Overdue" />
          )}
        </div>

        {reminder.description && (
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)] truncate">{reminder.description}</p>
        )}

        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {reminder.dueAt && (
            <span className={cn('flex items-center gap-1 text-xs', isOverdue ? 'text-[var(--color-error)]' : 'text-[var(--color-text-muted)]')}>
              <Clock size={11} />
              {format(new Date(reminder.dueAt), 'MMM d, h:mm a')}
            </span>
          )}
          {reminder.tags.map((tag) => (
            <Badge key={tag} variant="default" className="text-[10px] px-1.5 py-0">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onEdit(reminder)}
          aria-label="Edit reminder"
        >
          <Bell size={13} />
        </Button>
        {reminder.status !== 'DISMISSED' && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-[var(--color-text-muted)]"
            onClick={() => dismissMut.mutate({ id: reminder.id })}
            aria-label="Dismiss"
          >
            <XCircle size={13} />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-[var(--color-error)]"
          onClick={() => deleteMut.mutate({ id: reminder.id })}
          aria-label="Delete"
        >
          <Trash2 size={13} />
        </Button>
      </div>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type FilterStatus = 'all' | 'pending' | 'done'

export default function RemindersPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState<ReminderItem | null>(null)
  const [filter, setFilter] = useState<FilterStatus>('pending')

  const statusInput =
    filter === 'pending'
      ? ['PENDING', 'SNOOZED'] as const
      : filter === 'done'
        ? ['DONE', 'DISMISSED'] as const
        : undefined

  const { data: reminders = [], isLoading, refetch } = trpc.reminders.getReminders.useQuery({
    status: statusInput ? [...statusInput] : undefined,
  })

  function handleEdit(r: ReminderItem) {
    setEditingReminder(r)
    setFormOpen(true)
  }

  const pendingCount = reminders.filter((r) => r.status === 'PENDING').length
  const overdueCount = reminders.filter(
    (r) => r.status === 'PENDING' && r.dueAt && isPast(new Date(r.dueAt)),
  ).length

  const filterTabs: { key: FilterStatus; label: string }[] = [
    { key: 'pending', label: 'Active' },
    { key: 'done', label: 'Completed' },
    { key: 'all', label: 'All' },
  ]

  return (
    <>
      <ReminderForm
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o)
          if (!o) setEditingReminder(null)
        }}
        reminder={editingReminder}
        onSuccess={() => void refetch()}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-3xl mx-auto space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Reminders</h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              {pendingCount} active
              {overdueCount > 0 && (
                <span className="ml-1 text-[var(--color-error)]">· {overdueCount} overdue</span>
              )}
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus size={16} />
            New Reminder
          </Button>
        </motion.div>

        {/* Filter tabs */}
        <motion.div variants={itemVariants} className="flex gap-1 rounded-lg bg-[var(--color-surface-2)] p-1 w-fit">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={cn(
                'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                filter === tab.key
                  ? 'bg-white text-[var(--color-text-primary)] shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]',
              )}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* List */}
        <motion.section variants={itemVariants} aria-label="Reminders list">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-white p-4">
                  <Skeleton className="mt-0.5 h-[18px] w-[18px] rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <SkeletonLine width="55%" height={13} />
                    <SkeletonLine width="30%" height={11} />
                  </div>
                </div>
              ))}
            </div>
          ) : reminders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Bell size={32} className="text-[var(--color-text-disabled)] mb-3" aria-hidden="true" />
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                  {filter === 'pending' ? 'No active reminders' : 'Nothing here yet'}
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  Create a reminder to stay on top of things
                </p>
                <Button className="mt-4" size="sm" onClick={() => setFormOpen(true)}>
                  <Plus size={14} />
                  Add Reminder
                </Button>
              </CardContent>
            </Card>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-2">
              {reminders.map((r) => (
                <ReminderRow
                  key={r.id}
                  reminder={{
                    id: r.id,
                    title: r.title,
                    description: r.description ?? null,
                    dueAt: r.dueAt ?? null,
                    priority: r.priority as Priority,
                    status: r.status as Status,
                    tags: r.tags,
                    recurrence: r.recurrence
                      ? { frequency: r.recurrence.frequency as Frequency, interval: r.recurrence.interval }
                      : null,
                  }}
                  onEdit={handleEdit}
                  onRefresh={() => void refetch()}
                />
              ))}
            </motion.div>
          )}
        </motion.section>
      </motion.div>
    </>
  )
}
