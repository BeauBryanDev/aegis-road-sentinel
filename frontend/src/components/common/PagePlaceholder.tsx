import type { LucideIcon } from 'lucide-react'

interface PagePlaceholderProps {
  title: string
  description: string
  icon: LucideIcon
}

/**
 * Temporary themed stub for routed pages. Each real page replaces this with
 * its panels as they get built out.
 */
export default function PagePlaceholder({ title, description, icon: Icon }: PagePlaceholderProps) {
  return (
    <section className="hud-panel hud-corners flex min-h-[60vh] flex-col items-center justify-center gap-3 p-8 text-center">
      <Icon className="h-10 w-10 text-cyber-gold/70 drop-shadow-[0_0_8px_rgba(255,192,30,0.4)]" />
      <h1 className="font-display text-xl font-bold tracking-[0.2em] text-cyber-gold">{title}</h1>
      <p className="max-w-md text-[13px] leading-relaxed text-cyber-muted">{description}</p>
      <span className="mt-2 rounded-sm border border-cyber-border px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-cyber-gold-dim">
        Module Pending
      </span>
    </section>
  )
}
