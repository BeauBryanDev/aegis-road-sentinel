import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import LiveFeed from '@/components/monitor/LiveFeed'
import RealTimeOverview from '@/components/dashboard/RealTimeOverview'
import AIConfidence from '@/components/dashboard/AIConfidence'
import RecentPlatesTable from '@/components/dashboard/RecentPlatesTable'
import AlertsList from '@/components/dashboard/AlersList'
import SystemCore from '@/components/dashboard/SystemCore'
import { useAppStore } from '@/stores/useAppStore'
import { usePlateStore } from '@/stores/usePlateStore'
import { useAlertStore } from '@/stores/useAlertStore'
import type { Stats, ConfidenceMetrics, SystemMetrics } from '@/types'
import { mockFeedBoxes } from '@/mocks/dashboardData'

// Empty-state fallbacks so panels render before/without data.
const EMPTY_STATS: Stats = {
  totalDetections: 0,
  vehicles: 0,
  plates: 0,
  byType: {},
  authorized: 0,
  denied: 0,
  avgProcessingMs: 0,
}
const EMPTY_CONFIDENCE: ConfidenceMetrics = {
  vehicleDetection: 0,
  plateDetection: 0,
  ocrRecognition: 0,
}
const EMPTY_SYSTEM: SystemMetrics = {
  avgProcessingMs: 0,
  throughputFps: 0,
  provider: '—',
  uptime: '00:00:00',
  healthy: false,
}

/**
 * Command dashboard — live data via the Zustand stores / API service layer.
 * Layout mirrors both mockups: desktop = main column + right rail; mobile = stacked.
 *
 * The live-feed bounding boxes remain demo data; real-time overlays arrive with
 * the WebSocket live stream (Live Monitor page).
 */
export default function Dashboard() {
  const navigate = useNavigate()

  const { stats, confidence, system, error, fetchOverview } = useAppStore()
  const { recent, fetchRecent } = usePlateStore()
  const { alerts, fetchAlerts } = useAlertStore()

  useEffect(() => {
    fetchOverview()
    fetchRecent(5)
    fetchAlerts(8)
  }, [fetchOverview, fetchRecent, fetchAlerts])

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <div className="flex items-center gap-2 rounded-sm border border-cyber-red/50 bg-cyber-red/10 px-3 py-2 text-[12px] text-cyber-red">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Backend unreachable — {error}. Showing empty state.</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        {/* Main column */}
        <div className="flex flex-col gap-3 xl:col-span-2">
          <LiveFeed camera="CAMERA_01" boxes={mockFeedBoxes} />
          <RealTimeOverview stats={stats ?? EMPTY_STATS} />
          <RecentPlatesTable plates={recent} onViewAll={() => navigate('/app/plates')} />
        </div>

        {/* Right rail */}
        <div className="flex flex-col gap-3">
          <AIConfidence metrics={confidence ?? EMPTY_CONFIDENCE} />
          <SystemCore metrics={system ?? EMPTY_SYSTEM} />
          <AlertsList alerts={alerts} onViewAll={() => navigate('/app/alerts')} />
        </div>
      </div>
    </div>
  )
}
