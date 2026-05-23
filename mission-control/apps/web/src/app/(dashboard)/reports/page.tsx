import { FileBarChart } from 'lucide-react'

import { ComingSoon } from '@/components/layout/coming-soon'

export default function ReportsPage() {
  return (
    <ComingSoon
      icon={FileBarChart}
      color="text-module-reports"
      bg="bg-sky-50"
      title="Reports"
      description="Scheduled web scraper runs with AI summaries delivered on your schedule."
    />
  )
}
