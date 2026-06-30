import { useNavigate } from 'react-router-dom'
import { ArrowRight, Car, Radar, ShieldCheck } from 'lucide-react'
import aegisIcon from '@/assets/aegis_anpr.webp'

export default function Home() {
  const navigate = useNavigate()

  return (
    <main className="min-h-screen bg-cyber-bg px-6 py-10 text-cyber-text sm:px-12 lg:px-20">
      <div className="relative mx-auto flex max-w-7xl flex-col gap-10 overflow-hidden rounded-[36px] border border-cyber-border bg-cyber-panel/90 p-8 shadow-[0_0_120px_rgba(255,192,30,0.12)] backdrop-blur-xl sm:p-10 lg:p-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,192,30,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,192,30,0.08),transparent_25%)] pointer-events-none" />
        <div className="relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <section className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyber-gold/25 bg-cyber-gold/10 px-4 py-1 text-[11px] uppercase tracking-[0.35em] text-cyber-gold shadow-gold-inset">
              perimeter AI security
            </div>

            <div className="flex items-center gap-4 rounded-3xl border border-cyber-border bg-cyber-panel/70 p-4 shadow-[0_0_24px_rgba(255,192,30,0.12)] sm:p-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-cyber-gold/20 bg-cyber-bg/60 p-3 shadow-gold-inset">
                <img src={aegisIcon} alt="Aegis ANPR shield" className="h-full w-full object-contain" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-cyber-gold">Powered by ANPR</p>
                <p className="text-base font-semibold text-white">Aegis image intelligence</p>
              </div>
            </div>

            <div className="space-y-5">
              <h1 className="max-w-3xl text-4xl font-display leading-tight tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl">
                Aegis Road Sentinel
              </h1>
              <p className="max-w-2xl text-base leading-8 text-cyber-muted sm:text-lg">
                AI-driven vehicle intelligence for real-time license plate recognition, monitoring, alerts, and traffic analytics across secure sites.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => navigate('/app')}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-cyber-gold px-6 py-3 text-sm font-semibold text-black shadow-gold-glow transition hover:bg-cyber-gold-bright"
              >
                Open dashboard
                <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href="#overview"
                className="inline-flex items-center justify-center rounded-full border border-cyber-border bg-white/5 px-6 py-3 text-sm text-cyber-text transition hover:border-cyber-gold hover:text-cyber-gold"
              >
                Discover features
              </a>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="hud-panel p-4">
                <p className="text-[10px] uppercase tracking-[0.35em] text-cyber-gold">Live detection</p>
                <p className="mt-3 text-sm font-semibold text-white">24/7 vehicle and plate recognition</p>
              </div>
              <div className="hud-panel p-4">
                <p className="text-[10px] uppercase tracking-[0.35em] text-cyber-gold">Adaptive alerts</p>
                <p className="mt-3 text-sm font-semibold text-white">Automated event scoring and breach notification</p>
              </div>
              <div className="hud-panel p-4">
                <p className="text-[10px] uppercase tracking-[0.35em] text-cyber-gold">Secure insights</p>
                <p className="mt-3 text-sm font-semibold text-white">Traffic analytics, plate history, and operator-ready reports</p>
              </div>
            </div>
          </section>

          <aside className="relative overflow-hidden rounded-[32px] border border-cyber-border bg-cyber-panel p-6 shadow-[0_0_36px_rgba(0,0,0,0.35)] sm:p-8">
            <div className="absolute inset-x-8 top-6 h-1 rounded-full bg-gradient-to-r from-cyber-gold to-transparent opacity-80" />
            <div className="relative space-y-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-cyber-gold">Sentinel console</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Threat surface overview</h2>
                </div>
                <span className="rounded-full border border-cyber-gold/20 bg-cyber-gold/10 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-cyber-gold">
                  Beta
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="hud-panel p-4">
                  <div className="inline-flex items-center gap-2 text-cyber-gold">
                    <Radar className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-[0.35em]">Detection</span>
                  </div>
                  <p className="mt-3 text-3xl font-semibold text-white">98.6%</p>
                  <p className="mt-2 text-sm text-cyber-muted">vehicle accuracy</p>
                </div>
                <div className="hud-panel p-4">
                  <div className="inline-flex items-center gap-2 text-cyber-gold">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-[0.35em]">Response</span>
                  </div>
                  <p className="mt-3 text-3xl font-semibold text-white"><span className="text-cyber-gold">4.2s</span></p>
                  <p className="mt-2 text-sm text-cyber-muted">average threat cycle</p>
                </div>
              </div>

              <div className="hud-panel rounded-[28px] border-cyber-gold/20 bg-cyber-bg/70 p-5 text-sm leading-6 text-cyber-muted">
                <div className="flex items-center gap-2 text-cyber-gold">
                  <Car className="h-4 w-4" />
                  <span className="font-semibold text-white">Vehicle intelligence</span>
                </div>
                <p className="mt-3">
                  Seamless insight into plate logs, authorized access events, and system health across all monitored lanes.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <section id="overview" className="mt-12 grid gap-5 rounded-[32px] border border-cyber-border bg-cyber-panel/80 p-8 sm:p-10">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.35em] text-cyber-gold">Built for ops</p>
            <h3 className="text-xl font-semibold text-white">Secure every checkpoint</h3>
            <p className="text-sm text-cyber-muted">From perimeter gates to parking entry, manage detection and response from one modern console.</p>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.35em] text-cyber-gold">Fast insights</p>
            <h3 className="text-xl font-semibold text-white">Actionable analytics</h3>
            <p className="text-sm text-cyber-muted">Spot trends, investigate plate history, and surface anomalous vehicles in seconds.</p>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.35em] text-cyber-gold">Always on</p>
            <h3 className="text-xl font-semibold text-white">Live monitoring</h3>
            <p className="text-sm text-cyber-muted">Keep a constant watch on feeds, alarms, and system health across your fleet of cameras.</p>
          </div>
        </div>
      </section>
    </main>
  )
}
