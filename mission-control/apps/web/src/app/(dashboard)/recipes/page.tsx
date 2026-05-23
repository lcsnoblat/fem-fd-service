import { ChefHat } from 'lucide-react'

import { ComingSoon } from '@/components/layout/coming-soon'

export default function RecipesPage() {
  return (
    <ComingSoon
      icon={ChefHat}
      color="text-module-recipes"
      bg="bg-orange-50"
      title="Recipes"
      description="Search, save, and plan meals with AI-powered recipe discovery and web scraping."
    />
  )
}
