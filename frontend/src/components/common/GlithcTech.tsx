interface GlitchTextProps {
  text: string
  className?: string
}

/**
 * Cyberpunk glitch text: two offset color-fringed copies behind the base text.
 * Uses the `flicker` animation; cheap and decorative for panel/section titles.
 */
export default function GlitchText({ text, className = '' }: GlitchTextProps) {
  return (
    <span className={`relative inline-block ${className}`} data-text={text}>
      <span className="relative z-10">{text}</span>
      <span
        aria-hidden
        className="absolute left-[1px] top-0 z-0 animate-flicker select-none text-cyber-red/40"
      >
        {text}
      </span>
      <span
        aria-hidden
        className="absolute -left-[1px] top-0 z-0 animate-flicker select-none text-cyber-gold/40 [animation-delay:0.4s]"
      >
        {text}
      </span>
    </span>
  )
}
