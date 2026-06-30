import { Camera } from 'lucide-react'
import { useCameraStore } from '@/stores/useCameraStore'

/** Dropdown to pick which webcam feeds the live monitor. */
export default function CamSelector() {
  const { devices, deviceId, setDeviceId } = useCameraStore()

  return (
    <label className="flex items-center gap-2 text-[11px] text-cyber-muted">
      <Camera className="h-3.5 w-3.5 text-cyber-gold" />
      <select
        value={deviceId ?? ''}
        onChange={(e) => setDeviceId(e.target.value || null)}
        disabled={devices.length === 0}
        className="max-w-[200px] truncate rounded-sm border border-cyber-border bg-cyber-panel-2 px-2 py-1 text-cyber-text outline-none focus:border-cyber-gold/60 disabled:opacity-50"
      >
        {devices.length === 0 && <option value="">No camera</option>}
        {devices.map((d, i) => (
          <option key={d.deviceId} value={d.deviceId}>
            {d.label || `Camera ${i + 1}`}
          </option>
        ))}
      </select>
    </label>
  )
}
