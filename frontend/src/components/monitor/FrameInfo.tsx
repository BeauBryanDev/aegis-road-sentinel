import { Activity, Timer, Boxes, Hash } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type WsStatus = 'idle' | 'connecting' | 'live' | 'error'

interface FrameInfoProps {
  status: WsStatus
  frameIndex: number
  processingMs: number
  detectionCount: number
  resolution: string
}

const STATUS_LABEL: Record<WsStatus, { text: string; cls: string }> = {
  idle: { text: 'Idle', cls: 'text-cyber-muted' },
  connecting: { text: 'Connecting', cls: 'text-cyber-gold' },
  live: { text: 'Live', cls: 'text-cyber-green' },
  error: { text: 'Error', cls: 'text-cyber-red' },
}

/** Per-frame telemetry readout for the live stream. */
export default function FrameInfo({
  status,
  frameIndex,
  processingMs,
  detectionCount,
  resolution,
}: FrameInfoProps) {
  const s = STATUS_LABEL[status]
  const rows: { icon: LucideIcon; label: string; value: string }[] = [
    { icon: Hash, label: 'Frame', value: String(frameIndex) },
    { icon: Timer, label: 'Latency', value: `${processingMs.toFixed(0)} ms` },
    { icon: Boxes, label: 'Detections', value: String(detectionCount) },
    { icon: Activity, label: 'Resolution', value: resolution },
  ]

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-[11px]">
        <span className="uppercase tracking-[0.12em] text-cyber-muted">Stream</span>
        <span className={`inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.15em] ${s.cls}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${status === 'live' ? 'animate-pulse' : ''} bg-current`} />
          {s.text}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-sm border border-cyber-border bg-cyber-panel-2/50 p-2">
            <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.12em] text-cyber-muted">
              <Icon className="h-3 w-3" />
              {label}
            </div>
            <div className="mt-1 font-display text-sm font-bold tabular-nums text-cyber-text">{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
