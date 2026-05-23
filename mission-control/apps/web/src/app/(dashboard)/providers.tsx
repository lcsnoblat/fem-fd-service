'use client'

import { SessionProvider } from 'next-auth/react'
import type { Session } from 'next-auth'

import { Shell } from '@/components/layout/shell'
import { TRPCProvider } from '@/lib/trpc/client'

interface ProvidersProps {
  session: Session | null
  children: React.ReactNode
}

export function DashboardProviders({ session, children }: ProvidersProps) {
  return (
    <SessionProvider session={session}>
      <TRPCProvider>
        <Shell>{children}</Shell>
      </TRPCProvider>
    </SessionProvider>
  )
}
