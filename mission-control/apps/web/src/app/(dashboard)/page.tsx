'use client'

import { format, isPast } from 'date-fns'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Bot,
  Briefcase,
  Calendar,
  ChefHat,
  Home,
  ImageIcon,
  LayoutDashboard,
  Scale,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton, SkeletonLine } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/utils/cn'

// ─── Animation variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

const currentMonth = format(new Date(), 'yyyy-MM')

// ─── Quick Stat Card ──────────────────────────────────────────────────────────

interface QuickStatCardProps {
  label: string
  value: string
  delta?: string
  deltaPositive?: boolean
  icon: React.ElementType
  iconColor: string
  iconBg: string
  href: string
  loading?: boolean
}

function QuickStatCard({ label, value, delta, deltaPositive = true, icon: Icon, iconColor, iconBg, href, loading }: QuickStatCardProps) {
  if (loading) {
    return (
      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <SkeletonLine width="55%" height={12} />
            <SkeletonLine width="40%" height={24} />
            <SkeletonLine width="30%" height={12} />
          </div>
          <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
        </div>
      </Card>
    )
  }

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Link href={href as any}>
      <Card variant="interactive" className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
              {label}
            </p>
            <p className="text-2xl font-bold text-[var(--color-text-primary)] tabular-nums mb-1">
              {value}
            </p>
            {delta && (
              <div className="flex items-center gap-1">
                <ArrowUpRight
                  size={12}
                  className={deltaPositive ? 'text-[var(--color-success)]' : 'text-[var(--color-error)] rotate-90'}
                  aria-hidden="true"
                />
                <span className={`text-xs font-medium ${deltaPositive ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>
                  {delta}
                </span>
              </div>
            )}
          </div>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
            <Icon size={20} className={iconColor} aria-hidden="true" />
          </div>
        </div>
      </Card>
    </Link>
  )
}

// ─── Module quick-link card ───────────────────────────────────────────────────

interface ModuleLinkProps {
  href: string
  label: string
  description: string
  icon: React.ElementType
  color: string
  bg: string
}

function ModuleLink({ href, label, description, icon: Icon, color, bg }: ModuleLinkProps) {
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Link href={href as any}>
      <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer">
        <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', bg)}>
          <Icon size={16} className={color} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[var(--color-text-primary)]">{label}</p>
          <p className="truncate text-xs text-[var(--color-text-muted)]">{description}</p>
        </div>
      </div>
    </Link>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: session } = useSession()
  const today = format(new Date(), 'EEEE, MMMM d')
  const userName = session?.user?.name?.split(' ')[0] ?? 'there'

  const { data: summary, isLoading: summaryLoading } = trpc.finance.getSpendingSummary.useQuery({
    month: currentMonth,
  })
  const { data: reminders = [], isLoading: remindersLoading } = trpc.reminders.getReminders.useQuery({
    status: ['PENDING', 'SNOOZED'],
  })

  const balance = summary ? summary.totalIncome - summary.totalExpense : 0
  const overdueCount = reminders.filter(
    (r) => r.dueAt && isPast(new Date(r.dueAt)),
  ).length

  const modules: ModuleLinkProps[] = [
    { href: '/finance', label: 'Finance', description: 'Track income & expenses', icon: TrendingUp, color: 'text-module-finance', bg: 'bg-emerald-50' },
    { href: '/reminders', label: 'Reminders', description: `${reminders.length} active`, icon: Bell, color: 'text-module-reminders', bg: 'bg-red-50' },
    { href: '/recipes', label: 'Recipes', description: 'Search & save recipes', icon: ChefHat, color: 'text-module-recipes', bg: 'bg-orange-50' },
    { href: '/shopping', label: 'Shopping', description: 'Smart shopping lists', icon: ShoppingCart, color: 'text-module-shopping', bg: 'bg-violet-50' },
    { href: '/jobs', label: 'Jobs', description: 'Job board aggregator', icon: Briefcase, color: 'text-module-jobs', bg: 'bg-blue-50' },
    { href: '/calendar', label: 'Calendar', description: 'Events & tasks', icon: Calendar, color: 'text-module-calendar', bg: 'bg-pink-50' },
    { href: '/gallery', label: 'Gallery', description: 'Image viewer & albums', icon: ImageIcon, color: 'text-module-gallery', bg: 'bg-teal-50' },
    { href: '/smarthome', label: 'Smart Home', description: 'Devices & automation', icon: Home, color: 'text-module-smarthome', bg: 'bg-amber-50' },
    { href: '/agent', label: 'Agent', description: 'AI coding workspace', icon: Bot, color: 'text-module-agent', bg: 'bg-brand-50' },
  ]

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="space-y-1">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Good morning, {userName} 👋
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          {today} · Here&apos;s your command center overview
        </p>
      </motion.div>

      {/* Quick stats */}
      <motion.section variants={itemVariants} aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
          Quick Stats
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickStatCard
            label="Monthly Income"
            value={summaryLoading ? '—' : fmt(summary?.totalIncome ?? 0)}
            icon={ArrowUpRight}
            iconColor="text-[var(--color-success)]"
            iconBg="bg-emerald-50"
            href="/finance"
            loading={summaryLoading}
          />
          <QuickStatCard
            label="Monthly Expenses"
            value={summaryLoading ? '—' : fmt(summary?.totalExpense ?? 0)}
            icon={ArrowDownLeft}
            iconColor="text-[var(--color-error)]"
            iconBg="bg-red-50"
            href="/finance"
            loading={summaryLoading}
          />
          <QuickStatCard
            label="Balance"
            value={summaryLoading ? '—' : fmt(balance)}
            delta={balance >= 0 ? 'On track' : 'Over budget'}
            deltaPositive={balance >= 0}
            icon={Scale}
            iconColor="text-brand-500"
            iconBg="bg-brand-50"
            href="/finance"
            loading={summaryLoading}
          />
          <QuickStatCard
            label="Active Reminders"
            value={remindersLoading ? '—' : String(reminders.length)}
            delta={overdueCount > 0 ? `${overdueCount} overdue` : 'All on time'}
            deltaPositive={overdueCount === 0}
            icon={Bell}
            iconColor="text-module-reminders"
            iconBg="bg-red-50"
            href="/reminders"
            loading={remindersLoading}
          />
        </div>
      </motion.section>

      {/* Two-col: reminders + modules */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Upcoming Reminders */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <CardTitle>Upcoming Reminders</CardTitle>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Link href={'/reminders' as any} className="text-xs font-medium text-brand-600 hover:text-brand-700">
                View all →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            {remindersLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <SkeletonLine width="50%" height={13} />
                      <SkeletonLine width="30%" height={11} />
                    </div>
                  </div>
                ))}
              </div>
            ) : reminders.length === 0 ? (
              <div className="py-8 text-center">
                <Bell size={24} className="mx-auto mb-2 text-[var(--color-text-disabled)]" />
                <p className="text-sm text-[var(--color-text-muted)]">No active reminders</p>
              </div>
            ) : (
              <div>
                {reminders.slice(0, 5).map((r) => {
                  const isOverdue = r.dueAt && isPast(new Date(r.dueAt))
                  return (
                    <div
                      key={r.id}
                      className={cn(
                        'flex items-start gap-3 py-2.5 border-b border-[var(--color-border)] last:border-0',
                        isOverdue && 'bg-red-50/60 -mx-2 px-2 rounded',
                      )}
                    >
                      <div className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                        isOverdue ? 'bg-red-100' : 'bg-[var(--color-surface-2)]',
                      )}>
                        {isOverdue
                          ? <AlertCircle size={14} className="text-[var(--color-error)]" />
                          : <Bell size={14} className="text-module-reminders" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{r.title}</p>
                        {r.dueAt && (
                          <p className={cn('text-xs', isOverdue ? 'text-[var(--color-error)]' : 'text-[var(--color-text-muted)]')}>
                            {isOverdue ? 'Overdue · ' : ''}{format(new Date(r.dueAt), 'MMM d, h:mm a')}
                          </p>
                        )}
                      </div>
                      <Badge variant={
                        r.priority === 'URGENT' ? 'error'
                          : r.priority === 'HIGH' ? 'warning'
                            : r.priority === 'MEDIUM' ? 'info'
                              : 'default'
                      }>
                        {r.priority.charAt(0) + r.priority.slice(1).toLowerCase()}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Module Quick Links */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>
              <div className="flex items-center gap-2">
                <LayoutDashboard size={16} className="text-brand-500" />
                Modules
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-0.5">
            {modules.map((m) => (
              <ModuleLink key={m.href} {...m} />
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
