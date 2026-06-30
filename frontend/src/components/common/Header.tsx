import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldAlert, Home, LogOut } from 'lucide-react'
import { APP_NAME, APP_SUBTITLE } from '@/types/constant'
import { useAppStore } from '@/stores/useAppStore'
import StatusBadge from './StatusBadge'

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

interface HeaderProps {
  /** Show the compact variant used by the mobile layout. */
  compact?: boolean
  /** Optional slot rendered on the right (e.g. mobile LIVE badge / menu). */
  right?: React.ReactNode
}

/** Top command bar: brand mark, operator clock, system status. */
export default function Header({ compact = false, right }: HeaderProps) {
  const now = useClock()
  const time = now.toLocaleTimeString('en-GB', { hour12: false })
  const navigate = useNavigate()
  const token = useAppStore((s) => s.token)
  const logout = useAppStore((s) => s.logout)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const iconBtn =
    'flex items-center justify-center rounded-sm border border-cyber-border p-1.5 text-cyber-muted transition-colors hover:border-cyber-gold/60 hover:text-cyber-gold'

  return (
    <header className="flex h-14 items-center justify-between border-b border-cyber-border bg-cyber-panel/90 px-4 backdrop-blur-sm">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <ShieldAlert className="h-6 w-6 text-cyber-gold drop-shadow-[0_0_6px_rgba(255,192,30,0.5)]" />
        <div className="leading-none">
          <div className="font-display text-base font-bold tracking-[0.25em] text-cyber-gold">
            {APP_NAME}
          </div>
          <div className="mt-0.5 text-[9px] uppercase tracking-[0.3em] text-cyber-muted">
            {APP_SUBTITLE}
          </div>
        </div>
      </div>

      {/* Center: operator clock (desktop only) */}
      {!compact && (
        <div className="hidden items-center gap-4 text-[11px] text-cyber-muted md:flex">
          <span className="tracking-widest">OPERATOR · UNIT-07</span>
          <span className="font-semibold tabular-nums text-cyber-text tracking-[0.2em]">{time}</span>
        </div>
      )}

      {/* Right: status / custom slot + session controls */}
      <div className="flex items-center gap-2.5">
        {right ?? (
          <>
            <StatusBadge status="online" pulse>
              Operational
            </StatusBadge>
            {!compact && (
              <StatusBadge status="warning" className="hidden lg:inline-flex">
                Rec
              </StatusBadge>
            )}
          </>
        )}

        {/* Return to the public landing page */}
        <Link to="/" title="Home" aria-label="Home" className={iconBtn}>
          <Home className="h-4 w-4" />
        </Link>

        {/* Sign out (only when authenticated) */}
        {token && (
          <button type="button" onClick={handleLogout} title="Sign out" aria-label="Sign out" className={iconBtn}>
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </header>
  )
}
