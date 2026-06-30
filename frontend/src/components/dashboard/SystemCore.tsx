import { Cpu, Gauge, Timer, Server } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Panel from '@/components/common/Panel'
import StatusBadge from '@/components/common/StatusBadge'

export interface SystemMetrics {
  avgProcessingMs: number
  throughputFps: number
  provider: string // e.g. "CPU · ONNXRuntime"
  uptime: string // e.g. "07:42:11"
}

interface SystemCoreProps {
  metrics: SystemMetrics
}

/** System Core — live pipeline health and inference telemetry. */
export default function SystemCore({ metrics }: SystemCoreProps) {
  const rows: { icon: LucideIcon; label: string; value: string }[] = [
    { icon: Timer, label: 'Avg Latency', value: `${metrics.avgProcessingMs.toFixed(0)} ms` },
    { icon: Gauge, label: 'Throughput', value: `${metrics.throughputFps.toFixed(1)} fps` },
    { icon: Server, label: 'Provider', value: metrics.provider },
    { icon: Cpu, label: 'Uptime', value: metrics.uptime },
  ]

  return (
    <Panel title="System Core" action={<StatusBadge status="online">Online</StatusBadge>}>
      <div className="flex flex-col divide-y divide-cyber-border">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center justify-between py-2 text-[12px]">
            <span className="flex items-center gap-2 text-cyber-muted">
              <Icon className="h-3.5 w-3.5" />
              <span className="uppercase tracking-[0.1em]">{label}</span>
            </span>
            <span className="tabular-nums font-semibold text-cyber-text">{value}</span>
          </div>
        ))}
      </div>
    </Panel>
  )
}
