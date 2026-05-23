'use client'

import * as Tooltip from '@radix-ui/react-tooltip'
import { motion } from 'framer-motion'
import {
  Bell,
  Bot,
  Briefcase,
  Calendar,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Cpu,
  FileBarChart,
  Home,
  ImageIcon,
  LayoutDashboard,
  Settings,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'

import { cn } from '@/lib/utils/cn'

// ─── Nav Items ────────────────────────────────────────────────────────────────

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard, color: 'text-brand-500' },
  { label: 'Finance', href: '/finance', icon: TrendingUp, color: 'text-module-finance' },
  { label: 'Recipes', href: '/recipes', icon: ChefHat, color: 'text-module-recipes' },
  { label: 'Shopping', href: '/shopping', icon: ShoppingCart, color: 'text-module-shopping' },
  { label: 'Jobs', href: '/jobs', icon: Briefcase, color: 'text-module-jobs' },
  { label: 'Calendar', href: '/calendar', icon: Calendar, color: 'text-module-calendar' },
  { label: 'Gallery', href: '/gallery', icon: ImageIcon, color: 'text-module-gallery' },
  { label: 'Smart Home', href: '/smarthome', icon: Home, color: 'text-module-smarthome' },
  { label: 'Reminders', href: '/reminders', icon: Bell, color: 'text-module-reminders' },
  { label: 'Agent', href: '/agent', icon: Bot, color: 'text-module-agent' },
  { label: 'Models', href: '/models', icon: Cpu, color: 'text-module-models' },
  { label: 'Reports', href: '/reports', icon: FileBarChart, color: 'text-module-reports' },
] as const

// ─── Types ────────────────────────────────────────────────────────────────────

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  user?: { name?: string | null; email?: string | null; image?: string | null } | null
}

// ─── Nav Item Component ───────────────────────────────────────────────────────

interface NavItemProps {
  href: string
  label: string
  icon: React.ElementType
  color: string
  isActive: boolean
  collapsed: boolean
}

function NavItem({ href, label, icon: Icon, color, isActive, collapsed }: NavItemProps) {
  const content = (
    <Link
      href={href as Parameters<typeof Link>[0]['href']}
      className={cn(
        'relative flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium',
        'transition-colors duration-150',
        isActive
          ? 'bg-brand-50 text-brand-600'
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]',
        collapsed && 'justify-center px-0',
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* Active left border accent */}
      {isActive && (
        <span
          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-600"
          aria-hidden="true"
        />
      )}
      <Icon
        size={18}
        className={cn(
          'shrink-0 transition-colors',
          isActive ? 'text-brand-600' : color,
        )}
        aria-hidden="true"
      />
      {!collapsed && (
        <span className="truncate">{label}</span>
      )}
    </Link>
  )

  if (!collapsed) return content

  return (
    <Tooltip.Root delayDuration={300}>
      <Tooltip.Trigger asChild>{content}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="right"
          sideOffset={8}
          className={cn(
            'z-50 rounded-lg bg-[var(--color-text-primary)] px-2.5 py-1.5',
            'text-xs font-medium text-white shadow-lg',
            'animate-fade-in',
          )}
        >
          {label}
          <Tooltip.Arrow className="fill-[var(--color-text-primary)]" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar({ collapsed, onToggle, user }: SidebarProps) {
  const pathname = usePathname()

  const sidebarWidth = collapsed ? 64 : 240

  return (
    <Tooltip.Provider>
      <motion.aside
        initial={false}
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className={cn(
          'fixed left-0 top-0 z-40 flex h-full flex-col',
          'border-r border-[var(--color-border)] bg-white',
          'overflow-hidden',
        )}
        style={{ width: sidebarWidth }}
        aria-label="Main navigation"
      >
        {/* Header — logo + toggle */}
        <div
          className={cn(
            'flex h-[var(--topbar-height)] shrink-0 items-center border-b border-[var(--color-border)]',
            collapsed ? 'justify-center px-0' : 'justify-between px-4',
          )}
        >
          {!collapsed && (
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-bold text-brand-600"
              aria-label="Mission Control home"
            >
              <span className="text-lg leading-none" aria-hidden="true">⬡</span>
              <span className="truncate">Mission Control</span>
            </Link>
          )}

          <button
            type="button"
            onClick={onToggle}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md',
              'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]',
              'hover:text-[var(--color-text-primary)] transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Nav items */}
        <nav
          className="flex-1 overflow-y-auto overflow-x-hidden py-3"
          aria-label="Module navigation"
        >
          <ul
            className={cn('flex flex-col gap-0.5', collapsed ? 'px-2' : 'px-3')}
            role="list"
          >
            {navItems.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <li key={item.href}>
                  <NavItem
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    color={item.color}
                    isActive={isActive}
                    collapsed={collapsed}
                  />
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer — user info + settings */}
        <div
          className={cn(
            'shrink-0 border-t border-[var(--color-border)] py-3',
            collapsed ? 'px-2' : 'px-3',
          )}
        >
          {/* Settings link */}
          <NavItem
            href="/settings"
            label="Settings"
            icon={Settings}
            color="text-[var(--color-text-muted)]"
            isActive={pathname === '/settings'}
            collapsed={collapsed}
          />

          {/* User info */}
          {user && (
            <div
              className={cn(
                'mt-2 flex items-center gap-3 rounded-lg p-2',
                'hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer',
                collapsed && 'justify-center',
              )}
              role="button"
              tabIndex={0}
              aria-label={user.name ?? user.email ?? 'User profile'}
            >
              {/* Avatar */}
              <div
                className="h-7 w-7 shrink-0 rounded-full bg-brand-100 flex items-center justify-center overflow-hidden"
                aria-hidden="true"
              >
                {user.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={user.image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-semibold text-brand-700">
                    {(user.name ?? user.email ?? 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-[var(--color-text-primary)]">
                    {user.name ?? 'User'}
                  </p>
                  {user.email && (
                    <p className="truncate text-[10px] text-[var(--color-text-muted)]">
                      {user.email}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.aside>
    </Tooltip.Provider>
  )
}
