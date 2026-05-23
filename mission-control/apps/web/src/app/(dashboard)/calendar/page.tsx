import { Calendar } from 'lucide-react'

import { ComingSoon } from '@/components/layout/coming-soon'

export default function CalendarPage() {
  return (
    <ComingSoon
      icon={Calendar}
      color="text-module-calendar"
      bg="bg-pink-50"
      title="Calendar"
      description="Events, tasks, and Google Calendar sync in a beautiful view."
    />
  )
}
