/** Animated horizontal scan line + faint scanline texture, for camera feeds. */
export default function ScanLine() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Sweeping beam */}
      <div className="absolute left-0 top-0 h-8 w-full animate-scan bg-gradient-to-b from-transparent via-cyber-gold/25 to-transparent" />
      {/* Static CRT-style scanlines */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(255,192,30,0.05) 0px, rgba(255,192,30,0.05) 1px, transparent 1px, transparent 3px)',
        }}
      />
    </div>
  )
}
