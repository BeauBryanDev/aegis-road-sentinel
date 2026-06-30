import { Terminal } from 'lucide-react'
import PagePlaceholder from '@/components/common/PagePlaceholder'

export default function SystemLogs() {
  return (
    <PagePlaceholder
      icon={Terminal}
      title="System Logs"
      description="Live system terminal — pipeline events, inference timings and service diagnostics."
    />
  )
}
