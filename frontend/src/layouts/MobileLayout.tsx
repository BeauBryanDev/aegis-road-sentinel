import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { MOBILE_TABS, MOBILE_MENU_ITEMS } from '@/types/constant'
import Header from '@/components/common/Header'
import StatusBadge from '@/components/common/StatusBadge'

const tabClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex flex-1 flex-col items-center justify-center gap-1 py-1.5 text-[9px] uppercase tracking-[0.12em] transition-colors',
    isActive ? 'text-cyber-gold' : 'text-cyber-muted',
  ].join(' ')

/** Mobile console: top bar + scrollable content + bottom tab bar with a "Menu" drawer. */
export default function MobileLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="flex h-screen flex-col bg-cyber-bg text-cyber-text">
      <Header compact right={<StatusBadge status="warning" pulse>Live</StatusBadge>} />

      <main className="min-h-0 flex-1 overflow-y-auto p-3 pb-2">
        <Outlet />
      </main>

      {/* Bottom tab bar */}
      <nav className="flex items-stretch border-t border-cyber-border bg-cyber-panel/95 backdrop-blur-sm">
        {MOBILE_TABS.map(({ to, shortLabel, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className={tabClass}>
            {({ isActive }) => (
              <>
                <Icon className={`h-5 w-5 ${isActive ? 'drop-shadow-[0_0_5px_rgba(255,192,30,0.6)]' : ''}`} />
                <span>{shortLabel}</span>
              </>
            )}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-1 py-1.5 text-[9px] uppercase tracking-[0.12em] text-cyber-muted"
        >
          <Menu className="h-5 w-5" />
          <span>Menu</span>
        </button>
      </nav>

      {/* "Menu" drawer for secondary destinations */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/70"
            onClick={() => setMenuOpen(false)}
          />
          <div className="relative max-h-[70vh] overflow-y-auto rounded-t-lg border-t border-cyber-border bg-cyber-panel p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="hud-title">Menu</span>
              <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close">
                <X className="h-5 w-5 text-cyber-muted" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MOBILE_MENU_ITEMS.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-2.5 rounded-sm border border-cyber-border px-3 py-3 text-[12px] tracking-wide',
                      isActive ? 'bg-cyber-gold/10 text-cyber-gold' : 'text-cyber-text',
                    ].join(' ')
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
