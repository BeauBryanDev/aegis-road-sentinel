import { Bell } from 'lucide-react'
import PagePlaceholder from '@/components/common/PagePlaceholder'

export default function Alerts() {
  return (
    <PagePlaceholder
      icon={Bell}
      title="Alerts"
      description="Access-control events — unauthorized vehicles and policy violations as they are detected."
    />
  )
}
