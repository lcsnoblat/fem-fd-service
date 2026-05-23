import { Home } from 'lucide-react'

import { ComingSoon } from '@/components/layout/coming-soon'

export default function SmartHomePage() {
  return (
    <ComingSoon
      icon={Home}
      color="text-module-smarthome"
      bg="bg-amber-50"
      title="Smart Home"
      description="Control IoT devices, schedules, and automations including your garage door."
    />
  )
}
