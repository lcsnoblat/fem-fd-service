import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { authedProcedure, router } from '../server'

const transactionTypeSchema = z.enum(['INCOME', 'EXPENSE', 'TRANSFER'])
const categoryTypeSchema = z.enum(['INCOME', 'EXPENSE', 'BOTH'])
const budgetPeriodSchema = z.enum(['WEEKLY', 'MONTHLY', 'YEARLY'])

const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
})

export const financeRouter = router({
  // ─── CATEGORIES ────────────────────────────────────────────────────────────

  getCategories: authedProcedure.query(async ({ ctx }) => {
    return ctx.db.category.findMany({
      where: { userId: ctx.userId },
      orderBy: { name: 'asc' },
    })
  }),

  createCategory: authedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(50),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        icon: z.string().min(1).max(50),
        type: categoryTypeSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.category.create({
        data: { ...input, userId: ctx.userId },
      })
    }),

  updateCategory: authedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        name: z.string().min(1).max(50).optional(),
        color: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/)
          .optional(),
        icon: z.string().min(1).max(50).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      const existing = await ctx.db.category.findFirst({
        where: { id, userId: ctx.userId },
      })
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND' })
      return ctx.db.category.update({ where: { id }, data })
    }),

  deleteCategory: authedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.category.findFirst({
        where: { id: input.id, userId: ctx.userId },
      })
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND' })
      // Sets categoryId = null on transactions (onDelete: SetNull)
      await ctx.db.category.delete({ where: { id: input.id } })
      return { success: true }
    }),

  // ─── TRANSACTIONS ──────────────────────────────────────────────────────────

  getTransactions: authedProcedure
    .input(
      z.object({
        ...paginationSchema.shape,
        dateRange: z
          .object({
            from: z.string().optional(),
            to: z.string().optional(),
          })
          .optional(),
        categoryId: z.string().cuid().optional(),
        type: transactionTypeSchema.optional(),
        search: z.string().max(200).optional(),
        sortBy: z.enum(['date', 'amount', 'description']).default('date'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, dateRange, categoryId, type, search, sortBy, sortOrder } = input
      const skip = (page - 1) * pageSize

      const where = {
        userId: ctx.userId,
        ...(type && { type }),
        ...(categoryId && { categoryId }),
        ...(dateRange?.from || dateRange?.to
          ? {
              date: {
                ...(dateRange.from && { gte: new Date(dateRange.from) }),
                ...(dateRange.to && { lte: new Date(dateRange.to) }),
              },
            }
          : {}),
        ...(search && {
          description: { contains: search, mode: 'insensitive' as const },
        }),
      }

      const [transactions, total] = await Promise.all([
        ctx.db.transaction.findMany({
          where,
          include: { category: true },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: pageSize,
        }),
        ctx.db.transaction.count({ where }),
      ])

      return { transactions, total, nextPage: total > page * pageSize ? page + 1 : null }
    }),

  createTransaction: authedProcedure
    .input(
      z.object({
        amount: z.number().positive().max(9_999_999_999),
        type: transactionTypeSchema,
        categoryId: z.string().cuid().optional(),
        description: z.string().min(1).max(200),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        receiptUrl: z.string().url().optional(),
        notes: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction.create({
        data: {
          ...input,
          date: new Date(input.date),
          userId: ctx.userId,
        },
        include: { category: true },
      })
    }),

  updateTransaction: authedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        amount: z.number().positive().max(9_999_999_999).optional(),
        type: transactionTypeSchema.optional(),
        categoryId: z.string().cuid().nullable().optional(),
        description: z.string().min(1).max(200).optional(),
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
        notes: z.string().max(1000).nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, date, ...data } = input
      const existing = await ctx.db.transaction.findFirst({
        where: { id, userId: ctx.userId },
      })
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND' })
      return ctx.db.transaction.update({
        where: { id },
        data: { ...data, ...(date && { date: new Date(date) }) },
        include: { category: true },
      })
    }),

  deleteTransaction: authedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.transaction.findFirst({
        where: { id: input.id, userId: ctx.userId },
      })
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND' })
      await ctx.db.transaction.delete({ where: { id: input.id } })
      return { success: true }
    }),

  // ─── BUDGETS ───────────────────────────────────────────────────────────────

  getBudgets: authedProcedure.query(async ({ ctx }) => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const budgets = await ctx.db.budget.findMany({
      where: { userId: ctx.userId, isActive: true },
      include: { category: true },
      orderBy: { category: { name: 'asc' } },
    })

    return Promise.all(
      budgets.map(async (budget) => {
        const spent = await ctx.db.transaction.aggregate({
          where: {
            userId: ctx.userId,
            categoryId: budget.categoryId,
            type: 'EXPENSE',
            date: { gte: monthStart, lte: monthEnd },
          },
          _sum: { amount: true },
        })
        const spentAmount = spent._sum.amount ?? 0
        const percentage =
          budget.amount.toNumber() > 0
            ? (Number(spentAmount) / budget.amount.toNumber()) * 100
            : 0
        return {
          ...budget,
          spent: spentAmount,
          percentage: Math.min(Math.round(percentage), 999),
          isOverBudget: percentage > 100,
          isNearAlert: percentage >= budget.alertAt && percentage <= 100,
        }
      }),
    )
  }),

  createBudget: authedProcedure
    .input(
      z.object({
        categoryId: z.string().cuid(),
        amount: z.number().positive().max(9_999_999),
        period: budgetPeriodSchema,
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        alertAt: z.number().int().min(1).max(100).default(80),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.budget.create({
        data: {
          ...input,
          startDate: new Date(input.startDate),
          userId: ctx.userId,
        },
        include: { category: true },
      })
    }),

  // ─── SUMMARY ──────────────────────────────────────────────────────────────

  getSpendingSummary: authedProcedure
    .input(z.object({ month: z.string().regex(/^\d{4}-\d{2}$/) }))
    .query(async ({ ctx, input }) => {
      const [year, month] = input.month.split('-').map(Number) as [number, number]
      const from = new Date(year, month - 1, 1)
      const to = new Date(year, month, 0, 23, 59, 59)

      const [income, expense, byCategory] = await Promise.all([
        ctx.db.transaction.aggregate({
          where: { userId: ctx.userId, type: 'INCOME', date: { gte: from, lte: to } },
          _sum: { amount: true },
        }),
        ctx.db.transaction.aggregate({
          where: { userId: ctx.userId, type: 'EXPENSE', date: { gte: from, lte: to } },
          _sum: { amount: true },
        }),
        ctx.db.transaction.groupBy({
          by: ['categoryId'],
          where: { userId: ctx.userId, type: 'EXPENSE', date: { gte: from, lte: to } },
          _sum: { amount: true },
          orderBy: { _sum: { amount: 'desc' } },
        }),
      ])

      const categories = await ctx.db.category.findMany({
        where: { userId: ctx.userId },
      })
      const categoryMap = new Map(categories.map((c) => [c.id, c]))

      const totalExpense = Number(expense._sum.amount ?? 0)
      const byCategoryWithNames = byCategory.map((item) => ({
        category: item.categoryId ? (categoryMap.get(item.categoryId) ?? null) : null,
        spent: Number(item._sum.amount ?? 0),
        percentage:
          totalExpense > 0
            ? Math.round((Number(item._sum.amount ?? 0) / totalExpense) * 100)
            : 0,
      }))

      const totalIncome = Number(income._sum.amount ?? 0)
      return {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        byCategory: byCategoryWithNames,
      }
    }),

  getMonthlyTrend: authedProcedure
    .input(z.object({ months: z.number().int().min(1).max(24).default(12) }))
    .query(async ({ ctx, input }) => {
      const result = []
      const now = new Date()

      for (let i = input.months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const from = new Date(date.getFullYear(), date.getMonth(), 1)
        const to = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)

        const [income, expense] = await Promise.all([
          ctx.db.transaction.aggregate({
            where: { userId: ctx.userId, type: 'INCOME', date: { gte: from, lte: to } },
            _sum: { amount: true },
          }),
          ctx.db.transaction.aggregate({
            where: { userId: ctx.userId, type: 'EXPENSE', date: { gte: from, lte: to } },
            _sum: { amount: true },
          }),
        ])

        const inc = Number(income._sum.amount ?? 0)
        const exp = Number(expense._sum.amount ?? 0)
        result.push({
          month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
          income: inc,
          expense: exp,
          balance: inc - exp,
        })
      }

      return result
    }),
})
