'use client'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Bell, LogOut, Menu, Search, Settings, User } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import * as React from 'react'

import { cn } from '@/lib/utils/cn'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TopbarProps {
  onToggle: () => void
  unreadCount?: number
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

export function Topbar({ onToggle, unreadCount = 0 }: TopbarProps) {
  const { data: session } = useSession()
  const user = session?.user

  return (
    <header
      className={cn(
        'sticky top-0 z-50 flex h-[var(--topbar-height)] items-center gap-3 px-4',
        'bg-white border-b border-[var(--color-border)]',
        'backdrop-blur-sm',
      )}
    >
      {/* Left: menu toggle + logo */}
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg',
            'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]',
            'hover:text-[var(--color-text-primary)] transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
          )}
          aria-label="Toggle navigation sidebar"
        >
          <Menu size={18} aria-hidden="true" />
        </button>

        <span
          className="hidden sm:flex items-center gap-1.5 text-sm font-bold text-brand-600 select-none"
          aria-label="Mission Control"
        >
          <span className="text-base leading-none" aria-hidden="true">⬡</span>
          <span>Mission Control</span>
        </span>
      </div>

      {/* Center: fake search bar */}
      <div className="flex-1 max-w-xl mx-auto">
        <button
          type="button"
          className={cn(
            'flex w-full items-center gap-2 rounded-lg border border-[var(--color-border)]',
            'bg-[var(--color-surface-2)] px-3 h-8',
            'text-sm text-[var(--color-text-muted)]',
            'hover:border-[var(--color-border-2)] hover:bg-white transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
          )}
          aria-label="Open command palette (Cmd+K)"
          aria-haspopup="dialog"
        >
          <Search size={14} aria-hidden="true" className="shrink-0" />
          <span className="flex-1 text-left">Search or run a command…</span>
          <kbd
            className={cn(
              'hidden sm:inline-flex items-center gap-0.5 rounded border border-[var(--color-border)]',
              'bg-white px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-muted)]',
              'shadow-sm select-none',
            )}
            aria-label="Keyboard shortcut: Command K"
          >
            <span aria-hidden="true">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Right: notifications + avatar dropdown */}
      <div className="flex shrink-0 items-center gap-1">
        {/* Notification bell */}
        <button
          type="button"
          className={cn(
            'relative flex h-8 w-8 items-center justify-center rounded-lg',
            'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]',
            'hover:text-[var(--color-text-primary)] transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
          )}
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        >
          <Bell size={18} aria-hidden="true" />
          {unreadCount > 0 && (
            <span
              className={cn(
                'absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center',
                'rounded-full bg-[var(--color-error)] px-1',
                'text-[9px] font-bold text-white leading-none',
              )}
              aria-hidden="true"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* User avatar dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full',
                'bg-brand-100 text-brand-700 overflow-hidden',
                'hover:ring-2 hover:ring-brand-300 transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
              )}
              aria-label={`User menu for ${user?.name ?? user?.email ?? 'account'}`}
            >
              {user?.image ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={user.image}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs font-semibold" aria-hidden="true">
                  {(user?.name ?? user?.email ?? 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className={cn(
                'z-50 min-w-48 rounded-xl border border-[var(--color-border)] bg-white p-1',
                'shadow-dialog animate-fade-in',
              )}
            >
              {/* User info header */}
              {user && (
                <>
                  <div className="px-3 py-2 mb-1">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                      {user.name ?? 'User'}
                    </p>
                    {user.email && (
                      <p className="text-xs text-[var(--color-text-muted)] truncate">
                        {user.email}
                      </p>
                    )}
                  </div>
                  <DropdownMenu.Separator className="my-1 h-px bg-[var(--color-border)]" />
                </>
              )}

              <DropdownMenu.Item asChild>
                <a
                  href="/profile"
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2',
                    'text-sm text-[var(--color-text-secondary)]',
                    'hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                    'transition-colors select-none',
                  )}
                >
                  <User size={15} aria-hidden="true" />
                  Profile
                </a>
              </DropdownMenu.Item>

              <DropdownMenu.Item asChild>
                <a
                  href="/settings"
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2',
                    'text-sm text-[var(--color-text-secondary)]',
                    'hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                    'transition-colors select-none',
                  )}
                >
                  <Settings size={15} aria-hidden="true" />
                  Settings
                </a>
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="my-1 h-px bg-[var(--color-border)]" />

              <DropdownMenu.Item asChild>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2',
                    'text-sm text-[var(--color-error)]',
                    'hover:bg-[var(--color-error-bg)]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                    'transition-colors select-none',
                  )}
                >
                  <LogOut size={15} aria-hidden="true" />
                  Sign out
                </button>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  )
}
