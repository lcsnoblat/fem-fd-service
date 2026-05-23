import { Briefcase } from 'lucide-react'

import { ComingSoon } from '@/components/layout/coming-soon'

export default function JobsPage() {
  return (
    <ComingSoon
      icon={Briefcase}
      color="text-module-jobs"
      bg="bg-blue-50"
      title="Jobs"
      description="Aggregate job listings from multiple boards in one place."
    />
  )
}
