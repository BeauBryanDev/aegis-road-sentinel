import { Car, Bike, Truck, Bus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Panel from '@/components/common/Panel'
import CyberButton from '@/components/common/CyberButton'
import type { Detection, VehicleType } from '@/types'
import { formatPercent, formatTime, vehicleLabel } from '@/types/formatter'

const TYPE_ICON: Partial<Record<VehicleType, LucideIcon>> = {
  car: Car,
  motorcycle: Bike,
  van: Truck,
  pickup: Truck,
  truck: Bus,
  bus: Bus,
  microbus: Bus,
}

interface RecentPlatesTableProps {
  plates: Detection[]
  onViewAll?: () => void
}

/** Recent / License-Plate Recognition list: plate, vehicle type, confidence, status. */
export default function RecentPlatesTable({ plates, onViewAll }: RecentPlatesTableProps) {
  return (
    <Panel
      title="Recent Plates"
      action={
        <CyberButton variant="ghost" onClick={onViewAll}>
          View All
        </CyberButton>
      }
      bodyClassName="p-2"
    >
      <ul className="flex flex-col divide-y divide-cyber-border">
        {plates.map((p) => {
          const Icon = TYPE_ICON[p.vehicleType] ?? Car
          return (
            <li key={p.id} className="flex items-center gap-3 py-2">
              {/* Plate chip */}
              <span className="rounded-sm border border-cyber-gold/50 bg-black px-2 py-1 font-display text-xs font-bold tracking-[0.18em] text-cyber-gold">
                {p.licensePlate}
              </span>

              {/* Type */}
              <div className="flex min-w-0 flex-1 items-center gap-1.5 text-[11px] text-cyber-muted">
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate uppercase tracking-wide">{vehicleLabel(p.vehicleType)}</span>
              </div>

              {/* Confidence */}
              <span className="tabular-nums text-[11px] font-semibold text-cyber-text">
                {formatPercent(p.ocrConfidence)}
              </span>

              {/* Status */}
              <span
                className={`rounded-sm px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                  p.authorized
                    ? 'bg-cyber-green/15 text-cyber-green'
                    : 'bg-cyber-red/15 text-cyber-red'
                }`}
              >
                {p.authorized ? 'Auth' : 'Denied'}
              </span>

              {/* Time */}
              <span className="hidden tabular-nums text-[10px] text-cyber-muted sm:inline">
                {formatTime(p.createdAt)}
              </span>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}
