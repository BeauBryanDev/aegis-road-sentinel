import { Video } from 'lucide-react'
import PagePlaceholder from '@/components/common/PagePlaceholder'

export default function LiveMonitor() {
  return (
    <PagePlaceholder
      icon={Video}
      title="Live Monitor"
      description="Real-time camera feed with vehicle and plate bounding-box overlays, scanline and frame telemetry."
    />
  )
}
