import { Construction } from 'lucide-react'

import { cn } from '@/lib/utils/cn'

interface ComingSoonProps {
  icon: React.ElementType
  color: string
  bg: string
  title: string
  description: string
}

export function ComingSoon({ icon: Icon, color, bg, title, description }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className={cn('flex h-16 w-16 items-center justify-center rounded-2xl mb-5', bg)}>
        <Icon size={32} className={color} aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">{title}</h1>
      <p className="max-w-md text-sm text-[var(--color-text-muted)] leading-relaxed mb-6">
        {description}
      </p>
      <div className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2 text-xs text-[var(--color-text-muted)]">
        <Construction size={13} aria-hidden="true" />
        Coming in Phase 2
      </div>
    </div>
  )
}
