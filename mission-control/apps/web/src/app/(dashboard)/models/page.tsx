import { Cpu } from 'lucide-react'

import { ComingSoon } from '@/components/layout/coming-soon'

export default function ModelsPage() {
  return (
    <ComingSoon
      icon={Cpu}
      color="text-module-models"
      bg="bg-gray-100"
      title="Models"
      description="Configure AI model providers — local Ollama + cloud: Anthropic, OpenAI, Groq, Google."
    />
  )
}
