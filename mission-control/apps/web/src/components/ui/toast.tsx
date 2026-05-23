'use client'

import * as ToastPrimitive from '@radix-ui/react-toast'
import { CheckCircle, Info, AlertTriangle, XCircle, X } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils/cn'

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastVariant = 'success' | 'error' | 'info' | 'warning'

interface ToastItem {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface ToastContextValue {
  toast: (item: Omit<ToastItem, 'id'>) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}

// ─── Variant config ───────────────────────────────────────────────────────────

const variantConfig: Record<
  ToastVariant,
  { icon: React.ElementType; className: string; iconClassName: string }
> = {
  success: {
    icon: CheckCircle,
    className: 'border-emerald-200 bg-[var(--color-success-bg)]',
    iconClassName: 'text-[var(--color-success)]',
  },
  error: {
    icon: XCircle,
    className: 'border-red-200 bg-[var(--color-error-bg)]',
    iconClassName: 'text-[var(--color-error)]',
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-amber-200 bg-[var(--color-warning-bg)]',
    iconClassName: 'text-[var(--color-warning)]',
  },
  info: {
    icon: Info,
    className: 'border-blue-200 bg-[var(--color-info-bg)]',
    iconClassName: 'text-[var(--color-info)]',
  },
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  const toast = React.useCallback((item: Omit<ToastItem, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
    setToasts((prev) => [...prev, { ...item, id }])
  }, [])

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastPrimitive.Provider swipeDirection="right" duration={4000}>
        {children}
        {toasts.map((item) => {
          const variant = item.variant ?? 'info'
          const config = variantConfig[variant]
          const Icon = config.icon

          return (
            <ToastPrimitive.Root
              key={item.id}
              onOpenChange={(open) => {
                if (!open) dismiss(item.id)
              }}
              className={cn(
                'group pointer-events-auto relative flex w-full items-start gap-3',
                'rounded-xl border p-4 shadow-card-hover',
                'data-[state=open]:animate-slide-up',
                'data-[state=closed]:animate-fade-in',
                'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]',
                'data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-transform',
                'data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]',
                'max-w-sm w-full',
                config.className,
              )}
            >
              <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', config.iconClassName)} aria-hidden="true" />

              <div className="flex-1 min-w-0">
                <ToastPrimitive.Title className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {item.title}
                </ToastPrimitive.Title>
                {item.description && (
                  <ToastPrimitive.Description className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                    {item.description}
                  </ToastPrimitive.Description>
                )}
              </div>

              <ToastPrimitive.Close
                className={cn(
                  'shrink-0 rounded p-0.5',
                  'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                  'transition-colors',
                )}
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          )
        })}

        <ToastPrimitive.Viewport
          className={cn(
            'fixed bottom-4 right-4 z-[9999]',
            'flex flex-col gap-2',
            'w-full max-w-sm',
            'outline-none',
          )}
        />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  )
}

// ─── Convenience Toaster ──────────────────────────────────────────────────────
// Alias so callers can import <Toaster /> for the viewport-only usage
export { ToastProvider as Toaster }
