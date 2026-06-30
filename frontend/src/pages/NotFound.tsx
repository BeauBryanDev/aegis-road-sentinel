import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cyber-bg p-6 text-center font-mono text-cyber-text">
      <ShieldAlert className="h-12 w-12 text-cyber-gold/70 drop-shadow-[0_0_10px_rgba(255,192,30,0.4)]" />
      <div className="font-display text-6xl font-bold tracking-[0.2em] text-cyber-gold">404</div>
      <p className="text-[13px] uppercase tracking-[0.25em] text-cyber-muted">Signal lost — route not found</p>
      <Link
        to="/"
        className="mt-2 rounded-sm bg-cyber-gold px-5 py-2 text-[12px] font-semibold uppercase tracking-[0.15em] text-black shadow-gold-glow transition hover:bg-cyber-gold-bright"
      >
        Return Home
      </Link>
    </div>
  )
}
