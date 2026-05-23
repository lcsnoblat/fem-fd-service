import { Settings } from 'lucide-react'

import { ComingSoon } from '@/components/layout/coming-soon'

export default function SettingsPage() {
  return (
    <ComingSoon
      icon={Settings}
      color="text-[var(--color-text-muted)]"
      bg="bg-[var(--color-surface-2)]"
      title="Settings"
      description="Account preferences, notification settings, connected integrations, and more."
    />
  )
}
