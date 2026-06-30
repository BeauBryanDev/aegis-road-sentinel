import { NavLink, Outlet } from 'react-router-dom'
import { NAV_ITEMS } from '@/types/constant'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'

/** Desktop console: left sidebar nav + top bar + scrollable workspace + status bar. */
export default function DesktopLayout() {
  return (
    <div className="flex h-screen flex-col bg-cyber-bg text-cyber-text">
      <Header />
      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <nav className="flex w-56 flex-col gap-1 border-r border-cyber-border bg-cyber-panel/60 p-2">
          <div className="px-2 pb-2 pt-1 text-[9px] uppercase tracking-[0.3em] text-cyber-muted">
            Navigation
          </div>
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                [
                  'group relative flex items-center gap-3 rounded-sm px-3 py-2 text-[13px] tracking-wide transition-colors',
                  isActive
                    ? 'bg-cyber-gold/10 text-cyber-gold shadow-gold-inset'
                    : 'text-cyber-muted hover:bg-cyber-gold/5 hover:text-cyber-text',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-cyber-gold transition-opacity ${
                      isActive ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Workspace */}
        <main className="min-w-0 flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}
