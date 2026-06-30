import { Link, NavLink, Outlet } from 'react-router-dom'
import { ShieldAlert, LogIn, UserPlus } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { APP_NAME, APP_SUBTITLE } from '@/types/constant'

/**
 * Public marketing shell. Hosts the landing Header with sign-in / register
 * links and renders public pages (Home) via <Outlet />.
 */
export default function PublicLayout() {
  const token = useAppStore((s) => s.token)

  return (
    <div className="min-h-screen bg-cyber-bg font-mono text-cyber-text">
      <header className="sticky top-0 z-40 border-b border-cyber-border bg-cyber-bg/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-12 lg:px-20">
          {/* Brand → home */}
          <Link to="/" className="flex items-center gap-2.5">
            <ShieldAlert className="h-6 w-6 text-cyber-gold drop-shadow-[0_0_6px_rgba(255,192,30,0.5)]" />
            <span className="leading-none">
              <span className="font-display text-base font-bold tracking-[0.25em] text-cyber-gold">
                {APP_NAME}
              </span>
              <span className="mt-0.5 block text-[9px] uppercase tracking-[0.3em] text-cyber-muted">
                {APP_SUBTITLE}
              </span>
            </span>
          </Link>

          {/* Auth actions */}
          <nav className="flex items-center gap-3">
            {token ? (
              <NavLink
                to="/app"
                className="inline-flex items-center gap-1.5 rounded-sm bg-cyber-gold px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.15em] text-black shadow-gold-glow transition hover:bg-cyber-gold-bright"
              >
                Open Console
              </NavLink>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className="inline-flex items-center gap-1.5 rounded-sm border border-cyber-border px-4 py-2 text-[12px] font-medium uppercase tracking-[0.15em] text-cyber-text transition hover:border-cyber-gold/60 hover:text-cyber-gold"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  className="inline-flex items-center gap-1.5 rounded-sm bg-cyber-gold px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.15em] text-black shadow-gold-glow transition hover:bg-cyber-gold-bright"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Register
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>

      <Outlet />
    </div>
  )
}
