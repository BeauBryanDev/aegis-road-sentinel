import { Activity, Car, Bike, Truck, Bus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Panel from '@/components/common/Panel'
import StatusBadge from '@/components/common/StatusBadge'
import type { Stats } from '@/types'
import { formatNumber, formatDelta } from '@/types/formatter'

interface Counter {
  key: string
  label: string
  icon: LucideIcon
  value: number
  delta: number
  accent?: boolean
}

interface RealTimeOverviewProps {
  stats: Stats
  /** Per-counter deltas (%), keyed to the counter list below. */
  deltas?: Record<string, number>
}

/** Real-Time Statistics / Overview — headline detection counters with trend deltas. */
export default function RealTimeOverview({ stats, deltas = {} }: RealTimeOverviewProps) {
  const counters: Counter[] = [
    { key: 'total', label: 'Total Detections', icon: Activity, value: stats.totalDetections, delta: deltas.total ?? 12.4, accent: true },
    { key: 'car', label: 'Cars', icon: Car, value: stats.byType.car ?? 0, delta: deltas.car ?? 8.1 },
    { key: 'motorcycle', label: 'Motorcycles', icon: Bike, value: stats.byType.motorcycle ?? 0, delta: deltas.motorcycle ?? 15.2 },
    { key: 'van', label: 'Vans', icon: Truck, value: stats.byType.van ?? 0, delta: deltas.van ?? 5.3 },
    { key: 'truck', label: 'Trucks', icon: Bus, value: stats.byType.truck ?? 0, delta: deltas.truck ?? 3.0 },
  ]

  return (
    <Panel
      title="Real-Time Overview"
      action={<StatusBadge status="online" pulse>Live</StatusBadge>}
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {counters.map(({ key, label, icon: Icon, value, delta, accent }) => (
          <div
            key={key}
            className={`flex flex-col gap-1 rounded-sm border p-2.5 ${
              accent ? 'border-cyber-gold/40 bg-cyber-gold/5' : 'border-cyber-border bg-cyber-panel-2/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <Icon className={`h-4 w-4 ${accent ? 'text-cyber-gold' : 'text-cyber-muted'}`} />
              <span className={`text-[10px] tabular-nums ${delta >= 0 ? 'text-cyber-green' : 'text-cyber-red'}`}>
                {formatDelta(delta)}
              </span>
            </div>
            <div className="font-display text-lg font-bold tabular-nums text-cyber-text">
              {formatNumber(value)}
            </div>
            <div className="text-[9px] uppercase tracking-[0.12em] text-cyber-muted">{label}</div>
          </div>
        ))}
      </div>
    </Panel>
  )
}
