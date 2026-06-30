import { BarChart3 } from 'lucide-react'
import PagePlaceholder from '@/components/common/PagePlaceholder'

export default function VehicleAnalytics() {
  return (
    <PagePlaceholder
      icon={BarChart3}
      title="Vehicle Analytics"
      description="Detection trends over time, per-type breakdowns and confidence distributions."
    />
  )
}
