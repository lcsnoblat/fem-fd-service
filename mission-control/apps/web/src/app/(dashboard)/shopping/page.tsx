import { ShoppingCart } from 'lucide-react'

import { ComingSoon } from '@/components/layout/coming-soon'

export default function ShoppingPage() {
  return (
    <ComingSoon
      icon={ShoppingCart}
      color="text-module-shopping"
      bg="bg-violet-50"
      title="Shopping"
      description="Smart shopping lists with price comparison across stores."
    />
  )
}
