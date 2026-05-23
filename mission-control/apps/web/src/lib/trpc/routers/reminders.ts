import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { authedProcedure, router } from '../server'

const prioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
const reminderStatusSchema = z.enum(['PENDING', 'DONE', 'SNOOZED', 'DISMISSED'])
const recurFrequencySchema = z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'YEARLY'])

export const remindersRouter = router({
  getReminders: authedProcedure
    .input(
      z.object({
        status: z.union([reminderStatusSchema, z.array(reminderStatusSchema)]).optional(),
        priority: prioritySchema.optional(),
        tags: z.array(z.string()).optional(),
        dateRange: z
          .object({
            from: z.string().datetime().optional(),
            to: z.string().datetime().optional(),
          })
          .optional(),
        search: z.string().max(200).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { status, priority, tags, dateRange, search } = input

      const statusFilter = status
        ? Array.isArray(status)
          ? { in: status }
          : status
        : undefined

      return ctx.db.reminder.findMany({
        where: {
          userId: ctx.userId,
          ...(statusFilter && { status: statusFilter }),
          ...(priority && { priority }),
          ...(tags?.length && { tags: { hasSome: tags } }),
          ...(dateRange?.from || dateRange?.to
            ? {
                dueAt: {
                  ...(dateRange.from && { gte: new Date(dateRange.from) }),
                  ...(dateRange.to && { lte: new Date(dateRange.to) }),
                },
              }
            : {}),
          ...(search && {
            OR: [
              { title: { contains: search, mode: 'insensitive' as const } },
              { description: { contains: search, mode: 'insensitive' as const } },
            ],
          }),
        },
        include: { recurrence: true },
        orderBy: { dueAt: 'asc' },
      })
    }),

  createReminder: authedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(2000).optional(),
        dueAt: z.string().datetime(),
        priority: prioritySchema.default('MEDIUM'),
        tags: z.array(z.string().max(50)).max(10).default([]),
        recurrence: z
          .object({
            frequency: recurFrequencySchema,
            interval: z.number().int().min(1).max(365).default(1),
            endType: z.enum(['never', 'date', 'count']).default('never'),
            until: z.string().datetime().optional(),
            count: z.number().int().min(1).max(1000).optional(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { recurrence, ...reminderData } = input

      return ctx.db.reminder.create({
        data: {
          ...reminderData,
          dueAt: new Date(input.dueAt),
          userId: ctx.userId,
          ...(recurrence && {
            recurrence: {
              create: {
                frequency: recurrence.frequency,
                interval: recurrence.interval,
                until: recurrence.until ? new Date(recurrence.until) : undefined,
                count: recurrence.endType === 'count' ? recurrence.count : undefined,
                nextOccurrence: new Date(input.dueAt),
              },
            },
          }),
        },
        include: { recurrence: true },
      })
    }),

  updateReminder: authedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().max(2000).optional(),
        dueAt: z.string().datetime().optional(),
        priority: prioritySchema.optional(),
        tags: z.array(z.string().max(50)).max(10).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, dueAt, ...data } = input
      const existing = await ctx.db.reminder.findFirst({ where: { id, userId: ctx.userId } })
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND' })

      return ctx.db.reminder.update({
        where: { id },
        data: { ...data, ...(dueAt && { dueAt: new Date(dueAt) }) },
        include: { recurrence: true },
      })
    }),

  completeReminder: authedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.reminder.findFirst({
        where: { id: input.id, userId: ctx.userId },
        include: { recurrence: true },
      })
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND' })

      // Mark current as done
      const completed = await ctx.db.reminder.update({
        where: { id: input.id },
        data: { status: 'DONE' },
        include: { recurrence: true },
      })

      // Create next occurrence for recurring reminders
      if (existing.recurrence) {
        const nextDate = getNextOccurrence(existing.dueAt, existing.recurrence)
        if (nextDate) {
          await ctx.db.reminder.create({
            data: {
              userId: ctx.userId,
              title: existing.title,
              description: existing.description ?? undefined,
              dueAt: nextDate,
              priority: existing.priority,
              tags: existing.tags,
              recurrence: {
                create: {
                  frequency: existing.recurrence.frequency,
                  interval: existing.recurrence.interval,
                  until: existing.recurrence.until ?? undefined,
                  count:
                    existing.recurrence.count !== null
                      ? existing.recurrence.count - 1
                      : undefined,
                  nextOccurrence: nextDate,
                },
              },
            },
          })
        }
      }

      return completed
    }),

  snoozeReminder: authedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        until: z.string().datetime(),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const until = new Date(input.until)
      if (until <= new Date()) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Snooze time must be in the future' })
      }

      const existing = await ctx.db.reminder.findFirst({
        where: { id: input.id, userId: ctx.userId },
      })
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND' })

      await ctx.db.snoozeLog.create({
        data: {
          reminderId: input.id,
          snoozedUntil: until,
          reason: input.reason,
        },
      })

      return ctx.db.reminder.update({
        where: { id: input.id },
        data: { dueAt: until, status: 'PENDING' },
        include: { recurrence: true },
      })
    }),

  dismissReminder: authedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.reminder.findFirst({
        where: { id: input.id, userId: ctx.userId },
      })
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND' })
      return ctx.db.reminder.update({
        where: { id: input.id },
        data: { status: 'DISMISSED' },
      })
    }),

  deleteReminder: authedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.reminder.findFirst({
        where: { id: input.id, userId: ctx.userId },
      })
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND' })
      await ctx.db.reminder.delete({ where: { id: input.id } })
      return { success: true }
    }),

  bulkComplete: authedProcedure
    .input(z.object({ ids: z.array(z.string().cuid()).min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.reminder.updateMany({
        where: { id: { in: input.ids }, userId: ctx.userId },
        data: { status: 'DONE' },
      })
      return { completed: result.count }
    }),

  subscribeNotifications: authedProcedure
    .input(
      z.object({
        endpoint: z.string().url(),
        p256dh: z.string(),
        auth: z.string(),
        userAgent: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.pushSubscription.upsert({
        where: { endpoint: input.endpoint },
        create: { ...input, userId: ctx.userId },
        update: { userId: ctx.userId, p256dh: input.p256dh, auth: input.auth },
      })
      return { success: true }
    }),

  unsubscribeNotifications: authedProcedure
    .input(z.object({ endpoint: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.pushSubscription.deleteMany({
        where: { endpoint: input.endpoint, userId: ctx.userId },
      })
      return { success: true }
    }),
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getNextOccurrence(
  current: Date,
  rule: { frequency: string; interval: number; until: Date | null; count: number | null },
): Date | null {
  if (rule.count !== null && rule.count <= 0) return null

  const next = new Date(current)
  switch (rule.frequency) {
    case 'DAILY':
      next.setDate(next.getDate() + rule.interval)
      break
    case 'WEEKLY':
      next.setDate(next.getDate() + 7 * rule.interval)
      break
    case 'BIWEEKLY':
      next.setDate(next.getDate() + 14 * rule.interval)
      break
    case 'MONTHLY':
      next.setMonth(next.getMonth() + rule.interval)
      break
    case 'YEARLY':
      next.setFullYear(next.getFullYear() + rule.interval)
      break
  }

  if (rule.until && next > rule.until) return null
  return next
}
