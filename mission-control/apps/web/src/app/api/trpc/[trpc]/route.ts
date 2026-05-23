import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import type { NextRequest } from 'next/server'

import { appRouter } from '@/lib/trpc/root'
import { createTRPCContext } from '@/lib/trpc/server'

const isDev = process.env.NODE_ENV === 'development'

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: createTRPCContext,
    onError: isDev
      ? ({ path, error }) => {
          console.error(`tRPC error on ${path ?? '<no-path>'}:`, error)
        }
      : undefined,
  })

export { handler as GET, handler as POST }
