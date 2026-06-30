import { formatPercent } from '@/types/formatter'

type Tone = 'gold' | 'green' | 'red'

const TRACK: Record<Tone, string> = {
  gold: 'bg-cyber-gold shadow-[0_0_8px_rgba(255,192,30,0.55)]',
  green: 'bg-cyber-green shadow-[0_0_8px_rgba(59,209,111,0.5)]',
  red: 'bg-cyber-red shadow-[0_0_8px_rgba(255,59,59,0.5)]',
}

interface ProgressBarProps {
  /** 0..1 */
  value: number
  label?: string
  tone?: Tone
  /** Show the percentage value on the right of the label row. */
  showValue?: boolean
  className?: string
}

/** Labeled HUD progress/confidence bar with a glowing gold fill. */
export default function ProgressBar({
  value,
  label,
  tone = 'gold',
  showValue = true,
  className = '',
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value * 100))
  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="mb-1 flex items-center justify-between text-[11px]">
          {label && <span className="uppercase tracking-[0.12em] text-cyber-muted">{label}</span>}
          {showValue && (
            <span className="font-semibold tabular-nums text-cyber-text">{formatPercent(value)}</span>
          )}
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-sm bg-cyber-panel-2">
        <div
          className={`h-full animate-bar-grow rounded-sm ${TRACK[tone]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
