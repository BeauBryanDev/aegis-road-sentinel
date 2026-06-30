import { FileText } from 'lucide-react'
import PagePlaceholder from '@/components/common/PagePlaceholder'

// File name kept as "Remports" to match the existing skeleton; component is Reports.
export default function Reports() {
  return (
    <PagePlaceholder
      icon={FileText}
      title="Reports"
      description="Exportable detection summaries and access-control logs over a selected time range."
    />
  )
}
