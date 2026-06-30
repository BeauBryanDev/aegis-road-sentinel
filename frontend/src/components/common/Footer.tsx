import StatusBadge from './StatusBadge'

/** Slim desktop status bar pinned to the bottom of the console. */
export default function Footer() {
  return (
    <footer className="flex h-7 items-center justify-between border-t border-cyber-border bg-cyber-panel/90 px-4 text-[10px] uppercase tracking-[0.2em] text-cyber-muted">
      <div className="flex items-center gap-4">
        <StatusBadge status="online">System Nominal</StatusBadge>
        <span>ANPR Pipeline · 3-Head ONNX</span>
      </div>
      <span>© Aegis Road Sentinel</span>
    </footer>
  )
}
