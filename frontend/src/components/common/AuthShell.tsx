import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { APP_NAME, APP_SUBTITLE } from '@/types/constant'

interface AuthShellProps {
  title: string
  subtitle: string
  children: ReactNode
  /** Footer slot — typically the link to the other auth page. */
  footer?: ReactNode
}

/** Full-screen centered container for the Login / Register pages. */
export default function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cyber-bg p-4 font-mono text-cyber-text">
      <div className="hud-panel hud-corners w-full max-w-sm p-6">
        {/* Back to landing page */}
        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.15em] text-cyber-muted transition-colors hover:text-cyber-gold"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Home
        </Link>

        {/* Brand */}
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <ShieldAlert className="h-8 w-8 text-cyber-gold drop-shadow-[0_0_8px_rgba(255,192,30,0.5)]" />
          <div className="font-display text-lg font-bold tracking-[0.3em] text-cyber-gold">
            {APP_NAME}
          </div>
          <div className="text-[9px] uppercase tracking-[0.3em] text-cyber-muted">{APP_SUBTITLE}</div>
        </div>

        <h1 className="hud-title mb-1 text-center">{title}</h1>
        <p className="mb-5 text-center text-[11px] text-cyber-muted">{subtitle}</p>

        {children}

        {footer && <div className="mt-5 text-center text-[11px] text-cyber-muted">{footer}</div>}
      </div>
    </div>
  )
}

/** Shared input style for auth forms. */
export const authInputClass =
  'w-full rounded-sm border border-cyber-border bg-cyber-panel-2 px-3 py-2 text-[13px] text-cyber-text outline-none placeholder:text-cyber-muted focus:border-cyber-gold/60'
