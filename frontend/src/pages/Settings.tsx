import { Settings as SettingsIcon } from 'lucide-react'
import PagePlaceholder from '@/components/common/PagePlaceholder'

export default function Settings() {
  return (
    <PagePlaceholder
      icon={SettingsIcon}
      title="Configuration"
      description="Detection thresholds, camera sources, whitelist policy and console preferences."
    />
  )
}
