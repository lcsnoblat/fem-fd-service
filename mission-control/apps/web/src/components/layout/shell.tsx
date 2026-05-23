'use client'

import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import * as React from 'react'

import { GeometricBackground } from '@/components/effects/geometric-bg'
import { cn } from '@/lib/utils/cn'

import { Sidebar } from './sidebar'
import { Topbar } from './topbar'

// ─── Constants ────────────────────────────────────────────────────────────────

const SIDEBAR_STORAGE_KEY = 'mc-sidebar-open'
const MOBILE_BREAKPOINT = 768

// ─── Shell ────────────────────────────────────────────────────────────────────

interface ShellProps {
  children: React.ReactNode
}

export function Shell({ children }: ShellProps) {
  const { data: session } = useSession()

  // Initialise from localStorage; default to true (expanded)
  const [sidebarOpen, setSidebarOpen] = React.useState<boolean>(true)
  const [isMobile, setIsMobile] = React.useState<boolean>(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState<boolean>(false)
  const [mounted, setMounted] = React.useState<boolean>(false)

  // Read persisted preference on mount
  React.useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY)
      if (stored !== null) {
        setSidebarOpen(stored === 'true')
      }
    } catch {
      // localStorage not available
    }

    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    setIsMobile(mq.matches)

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Persist to localStorage whenever it changes
  React.useEffect(() => {
    if (!mounted) return
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarOpen))
    } catch {
      // localStorage not available
    }
  }, [sidebarOpen, mounted])

  const handleToggle = React.useCallback(() => {
    if (isMobile) {
      setMobileDrawerOpen((prev) => !prev)
    } else {
      setSidebarOpen((prev) => !prev)
    }
  }, [isMobile])

  // On mobile the sidebar is always visually "collapsed" (off-canvas);
  // on desktop it follows the sidebarOpen state.
  const collapsed = isMobile ? true : !sidebarOpen
  const sidebarWidthPx = collapsed ? 64 : 240

  return (
    <div className="relative min-h-screen bg-[var(--color-bg)]">
      {/* Geometric background — behind everything */}
      <GeometricBackground />

      {/* Desktop sidebar */}
      {!isMobile && (
        <Sidebar
          collapsed={collapsed}
          onToggle={handleToggle}
          user={session?.user ?? null}
        />
      )}

      {/* Mobile overlay drawer */}
      {isMobile && mobileDrawerOpen && (
        <>
          {/* Scrim */}
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            aria-hidden="true"
            onClick={() => setMobileDrawerOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed left-0 top-0 z-50 h-full w-60">
            <Sidebar
              collapsed={false}
              onToggle={() => setMobileDrawerOpen(false)}
              user={session?.user ?? null}
            />
          </div>
        </>
      )}

      {/* Main area */}
      <motion.div
        initial={false}
        animate={{
          marginLeft: isMobile ? 0 : sidebarWidthPx,
        }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="flex min-h-screen flex-col"
      >
        {/* Topbar */}
        <Topbar onToggle={handleToggle} />

        {/* Page content */}
        <motion.main
          key="page-content"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={cn(
            'flex-1 p-4 md:p-6',
          )}
          id="main-content"
        >
          {children}
        </motion.main>
      </motion.div>
    </div>
  )
}
