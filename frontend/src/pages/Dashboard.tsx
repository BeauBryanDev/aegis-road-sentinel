import { useNavigate } from 'react-router-dom'
import LiveFeed from '@/components/monitor/LiveFeed'
import RealTimeOverview from '@/components/dashboard/RealTimeOverview'
import AIConfidence from '@/components/dashboard/AIConfidence'
import RecentPlatesTable from '@/components/dashboard/RecentPlatesTable'
import AlertsList from '@/components/dashboard/AlersList'
import SystemCore from '@/components/dashboard/SystemCore'
import {
  mockStats,
  mockConfidence,
  mockSystem,
  mockRecentPlates,
  mockAlerts,
  mockFeedBoxes,
} from '@/mocks/dashboardData'

/**
 * Command dashboard. Mirrors both mockups:
 *  - Desktop (≥xl): live feed + overview on the left, right rail with confidence,
 *    system core and alerts.
 *  - Mobile / narrow: everything stacks in a single column in mockup order
 *    (feed → overview → confidence → recent plates → alerts).
 */
export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
      {/* Main column */}
      <div className="flex flex-col gap-3 xl:col-span-2">
        <LiveFeed camera="CAMERA_01" boxes={mockFeedBoxes} />
        <RealTimeOverview stats={mockStats} />
        <RecentPlatesTable plates={mockRecentPlates} onViewAll={() => navigate('/plates')} />
      </div>

      {/* Right rail */}
      <div className="flex flex-col gap-3">
        <AIConfidence metrics={mockConfidence} />
        <SystemCore metrics={mockSystem} />
        <AlertsList alerts={mockAlerts} onViewAll={() => navigate('/alerts')} />
      </div>
    </div>
  )
}
