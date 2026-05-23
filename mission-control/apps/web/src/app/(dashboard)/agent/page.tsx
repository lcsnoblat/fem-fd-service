import { Bot } from 'lucide-react'

import { ComingSoon } from '@/components/layout/coming-soon'

export default function AgentPage() {
  return (
    <ComingSoon
      icon={Bot}
      color="text-module-agent"
      bg="bg-brand-50"
      title="Agent"
      description="Agentic AI coding assistant with MCP server connections, Monaco editor and terminal."
    />
  )
}
