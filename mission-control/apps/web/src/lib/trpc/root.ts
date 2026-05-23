import { router } from './server'
import { financeRouter } from './routers/finance'
import { remindersRouter } from './routers/reminders'

export const appRouter = router({
  finance: financeRouter,
  reminders: remindersRouter,
  // Other routers will be added as modules are built
})

export type AppRouter = typeof appRouter
