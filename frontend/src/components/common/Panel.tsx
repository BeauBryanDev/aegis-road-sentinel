import type { ReactNode } from 'react'

interface PanelProps {
  title?: string
 
  action?: ReactNode
  children: ReactNode
 
  flush?: boolean
  className?: string
  bodyClassName?: string
}

export default function Panel({
  title,
  action,
  children,
  flush = false,
  className = '',
  bodyClassName = '',
}: PanelProps) {
  return (
    <section className={`hud-panel hud-corners flex flex-col ${className}`}>
      {title && (
        <div className="flex items-center justify-between border-b border-cyber-border px-3 py-2">
          <h2 className="hud-title">{title}</h2>
          {action}
        </div>
      )}
      <div className={`${flush ? '' : 'p-3'} ${bodyClassName}`}>{children}</div>
    </section>
  )
}
