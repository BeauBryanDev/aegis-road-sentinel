import { useEffect, useState } from 'react'
import { AlertTriangle, ShieldAlert, Info } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Panel from '@/components/common/Panel'
import CyberButton from '@/components/common/CyberButton'
import type { Alert, AlertLevel } from '@/types'
import { formatAgo } from '@/types/formatter'

const LEVEL: Record<AlertLevel, { icon: LucideIcon; text: string; dot: string }> = {
  critical: { icon: ShieldAlert, text: 'text-cyber-red', dot: 'bg-cyber-red' },
  warning: { icon: AlertTriangle, text: 'text-cyber-gold', dot: 'bg-cyber-gold' },
  info: { icon: Info, text: 'text-cyber-muted', dot: 'bg-cyber-muted' },
}

interface AlertsListProps {
  alerts: Alert[]
  onViewAll?: () => void
}

/** Live alerts feed — access-control violations and unauthorized vehicles. */
export default function AlertsList({ alerts, onViewAll }: AlertsListProps) {
  // Re-render periodically so the "time ago" stamps stay fresh.
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10_000)
    return () => clearInterval(id)
  }, [])

  return (
    <Panel
      title="Alerts"
      action={
        <CyberButton variant="ghost" onClick={onViewAll}>
          View All
        </CyberButton>
      }
      bodyClassName="p-2"
    >
      <ul className="flex flex-col gap-1.5">
        {alerts.map((a) => {
          const conf = LEVEL[a.level]
          const Icon = conf.icon
          return (
            <li
              key={a.id}
              className="flex items-center gap-2.5 rounded-sm border border-cyber-border bg-cyber-panel-2/40 px-2.5 py-2"
            >
              <Icon className={`h-4 w-4 shrink-0 ${conf.text}`} />
              <div className="min-w-0 flex-1">
                <div className={`truncate text-[12px] font-semibold uppercase tracking-wide ${conf.text}`}>
                  {a.title}
                </div>
                <div className="text-[10px] uppercase tracking-[0.1em] text-cyber-muted">{a.camera}</div>
              </div>
              <span className="shrink-0 tabular-nums text-[10px] text-cyber-muted">{formatAgo(a.timestamp)}</span>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}
