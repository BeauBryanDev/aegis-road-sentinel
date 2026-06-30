import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'solid' | 'outline' | 'ghost'

const VARIANTS: Record<Variant, string> = {
  solid: 'bg-cyber-gold/15 text-cyber-gold border-cyber-gold/50 hover:bg-cyber-gold/25',
  outline: 'bg-transparent text-cyber-text border-cyber-border hover:border-cyber-gold/60 hover:text-cyber-gold',
  ghost: 'bg-transparent text-cyber-muted border-transparent hover:text-cyber-gold',
}

interface CyberButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

/** Angular HUD button with a gold accent. */
export default function CyberButton({
  variant = 'outline',
  children,
  className = '',
  ...props
}: CyberButtonProps) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded-sm border px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.15em] transition-colors disabled:opacity-40 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
