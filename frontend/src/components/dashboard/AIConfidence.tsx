import { Cpu } from 'lucide-react'
import Panel from '@/components/common/Panel'
import ProgressBar from '@/components/common/ProgresBar'
import type { ConfidenceMetrics } from '@/types'

interface AIConfidenceProps {
  metrics: ConfidenceMetrics
}

/**
 * AI Confidence panel — the three in-scope inference heads.
 * Traffic-sign and crash rows from the original mockup are intentionally omitted.
 */
export default function AIConfidence({ metrics }: AIConfidenceProps) {
  const rows = [
    { label: 'Vehicle Detection', value: metrics.vehicleDetection },
    { label: 'Plate Detection', value: metrics.plateDetection },
    { label: 'OCR Recognition', value: metrics.ocrRecognition },
  ]

  return (
    <Panel
      title="AI Confidence"
      action={<Cpu className="h-3.5 w-3.5 text-cyber-gold/70" />}
    >
      <div className="flex flex-col gap-3">
        {rows.map((r) => (
          <ProgressBar key={r.label} label={r.label} value={r.value} />
        ))}
      </div>
    </Panel>
  )
}
