import type { ReactNode } from 'react'

type Status = 'online' | 'warning' | 'offline'

const STYLES: Record<Status, { dot: string; text: string }> = {
  online: { dot: 'bg-cyber-green shadow-[0_0_6px] shadow-cyber-green', text: 'text-cyber-green' },
  warning: { dot: 'bg-cyber-gold shadow-[0_0_6px] shadow-cyber-gold', text: 'text-cyber-gold' },
  offline: { dot: 'bg-cyber-red shadow-[0_0_6px] shadow-cyber-red', text: 'text-cyber-red' },
}

interface StatusBadgeProps {
  status?: Status
  children: ReactNode
  /** Pulse the indicator dot (e.g. for a live/recording state). */
  pulse?: boolean
  className?: string
}

/** Small HUD status pill: glowing dot + uppercase label. */
export default function StatusBadge({
  status = 'online',
  children,
  pulse = false,
  className = '',
}: StatusBadgeProps) {
  const s = STYLES[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.15em] ${s.text} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot} ${pulse ? 'animate-pulse' : ''}`} />
      {children}
    </span>
  )
}
