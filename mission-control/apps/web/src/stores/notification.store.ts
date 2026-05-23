'use client'

import { create } from 'zustand'

export interface Toast {
  id: string
  title: string
  description?: string
  variant: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}

interface NotificationStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { ...toast, id: `toast-${Date.now()}-${Math.random().toString(36).slice(2)}` },
      ],
    })),
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  clearToasts: () => set({ toasts: [] }),
}))

// Convenience helper
export function useToast() {
  const addToast = useNotificationStore((s) => s.addToast)

  return {
    success: (title: string, description?: string) =>
      addToast({ title, description, variant: 'success' }),
    error: (title: string, description?: string) =>
      addToast({ title, description, variant: 'error' }),
    info: (title: string, description?: string) =>
      addToast({ title, description, variant: 'info' }),
    warning: (title: string, description?: string) =>
      addToast({ title, description, variant: 'warning' }),
  }
}
