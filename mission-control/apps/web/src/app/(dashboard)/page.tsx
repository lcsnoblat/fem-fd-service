'use client'

import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { Activity, ArrowUpRight, Bell, TrendingUp } from 'lucide-react'
import { useSession } from 'next-auth/react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton, SkeletonCard, SkeletonLine } from '@/components/ui/skeleton'

// ─── Animation variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
}

// ─── Quick Stat Card ──────────────────────────────────────────────────────────

interface QuickStatCardProps {
  label: string
  value: string
  delta?: string
  deltaPositive?: boolean
  icon: React.ElementType
  iconColor: string
  iconBg: string
  loading?: boolean
}

function QuickStatCard({
  label,
  value,
  delta,
  deltaPositive = true,
  icon: Icon,
  iconColor,
  iconBg,
  loading = false,
}: QuickStatCardProps) {
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
              <span
                className={`text-xs font-medium ${
                  deltaPositive ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'
                }`}
              >
                {delta}
              </span>
            </div>
          )}
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
          aria-hidden="true"
        >
          <Icon size={20} className={iconColor} />
        </div>
      </div>
    </Card>
  )
}

// ─── Activity item ────────────────────────────────────────────────────────────

interface ActivityItemProps {
  title: string
  description: string
  time: string
  badge?: { label: string; variant: 'success' | 'info' | 'warning' | 'brand' }
}

function ActivityItem({ title, description, time, badge }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[var(--color-border)] last:border-0">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-2)]">
        <Activity size={14} className="text-[var(--color-text-muted)]" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{title}</p>
          {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
        </div>
        <p className="text-xs text-[var(--color-text-muted)] truncate">{description}</p>
      </div>
      <time
        className="shrink-0 text-xs text-[var(--color-text-disabled)]"
        dateTime={time}
      >
        {time}
      </time>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const QUICK_STATS: QuickStatCardProps[] = [
  {
    label: 'Monthly Budget',
    value: '—',
    icon: TrendingUp,
    iconColor: 'text-module-finance',
    iconBg: 'bg-emerald-50',
    loading: true,
  },
  {
    label: 'Active Reminders',
    value: '—',
    icon: Bell,
    iconColor: 'text-module-reminders',
    iconBg: 'bg-red-50',
    loading: true,
  },
  {
    label: 'This Week',
    value: '—',
    icon: Activity,
    iconColor: 'text-brand-500',
    iconBg: 'bg-brand-50',
    loading: true,
  },
  {
    label: 'Insights',
    value: '—',
    icon: TrendingUp,
    iconColor: 'text-module-reports',
    iconBg: 'bg-sky-50',
    loading: true,
  },
]

const RECENT_ACTIVITY: ActivityItemProps[] = [
  {
    title: 'Finance module initialised',
    description: 'Connected and ready to track expenses',
    time: 'Just now',
    badge: { label: 'New', variant: 'brand' },
  },
  {
    title: 'Smart Home online',
    description: '3 devices connected',
    time: '2m ago',
    badge: { label: 'Active', variant: 'success' },
  },
  {
    title: 'Agent model updated',
    description: 'Switched to claude-sonnet-4-6',
    time: '1h ago',
    badge: { label: 'Info', variant: 'info' },
  },
  {
    title: 'Weekly report scheduled',
    description: 'Will run every Sunday at 08:00',
    time: 'Yesterday',
  },
]

export default function DashboardPage() {
  const { data: session } = useSession()
  const today = format(new Date(), 'EEEE, MMMM d')
  const userName = session?.user?.name?.split(' ')[0] ?? 'there'

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

      {/* Quick stats grid */}
      <motion.section variants={itemVariants} aria-labelledby="stats-heading">
        <h2
          id="stats-heading"
          className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3"
        >
          Quick Stats
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_STATS.map((stat, i) => (
            <motion.div key={i} variants={itemVariants}>
              <QuickStatCard {...stat} />
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Two-column layout: recent activity + placeholder */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <motion.section
          variants={itemVariants}
          className="lg:col-span-2"
          aria-labelledby="activity-heading"
        >
          <Card>
            <CardHeader className="pb-0">
              <CardTitle id="activity-heading">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              {RECENT_ACTIVITY.map((item, i) => (
                <ActivityItem key={i} {...item} />
              ))}
            </CardContent>
          </Card>
        </motion.section>

        {/* Modules placeholder */}
        <motion.section
          variants={itemVariants}
          aria-labelledby="modules-heading"
        >
          <Card>
            <CardHeader className="pb-0">
              <CardTitle id="modules-heading">Modules</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <SkeletonCard />
            </CardContent>
          </Card>
        </motion.section>
      </div>
    </motion.div>
  )
}
