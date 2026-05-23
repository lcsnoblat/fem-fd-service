import { initTRPC, TRPCError } from '@trpc/server'
import type { Session } from 'next-auth'
import { getServerSession } from 'next-auth'
import superjson from 'superjson'
import { ZodError } from 'zod'

import { prisma } from '@mc/db'

import { authOptions } from '@/lib/auth/config'

export type TRPCContext = {
  session: Session | null
  userId: string | null
}

export async function createTRPCContext(): Promise<TRPCContext> {
  const session = await getServerSession(authOptions)
  return {
    session,
    userId: session?.user?.id ?? null,
  }
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

export const router = t.router
export const publicProcedure = t.procedure

export const authedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      userId: ctx.session.user.id,
      db: prisma,
    },
  })
})
