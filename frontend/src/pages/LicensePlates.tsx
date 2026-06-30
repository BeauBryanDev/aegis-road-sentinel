import { ScanLine } from 'lucide-react'
import PagePlaceholder from '@/components/common/PagePlaceholder'

export default function LicensePlates() {
  return (
    <PagePlaceholder
      icon={ScanLine}
      title="License Plates"
      description="Searchable plate history, recognition crops, authorization status and whitelist management."
    />
  )
}
