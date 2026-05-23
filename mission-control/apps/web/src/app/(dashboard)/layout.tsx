import { getServerSession } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import { redirect } from 'next/navigation'

import { Shell } from '@/components/layout/shell'
import { authOptions } from '@/lib/auth/config'
import { TRPCProvider } from '@/lib/trpc/client'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  return (
    <SessionProvider session={session}>
      <TRPCProvider>
        <Shell>{children}</Shell>
      </TRPCProvider>
    </SessionProvider>
  )
}
