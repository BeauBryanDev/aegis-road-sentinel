import roadImg from '@/assets/aegis_anpr.webp'
import ScanLine from '@/components/common/ScanLine'
import DateTime from '@/components/common/Date'
import { formatPercent } from '@/types/formatter'

export interface FeedBox {
  id: string
  label: string
  /** 0..1 detection confidence. */
  confidence: number
  /** Position + size as percentages of the frame (0..100). */
  x: number
  y: number
  w: number
  h: number
  /** Recognized plate text rendered under the box (the "hero" detection). */
  plate?: string
}

interface LiveFeedProps {
  camera?: string
  boxes?: FeedBox[]
  className?: string
}

/** Camera feed with vehicle/plate bounding-box overlays, scanline and HUD chrome. */
export default function LiveFeed({ camera = 'CAMERA_01', boxes = [], className = '' }: LiveFeedProps) {
  return (
    <div className={`hud-panel hud-corners overflow-hidden ${className}`}>
      {/* Title bar */}
      <div className="flex items-center justify-between border-b border-cyber-border px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="hud-title">Live Feed</span>
          <span className="text-[11px] text-cyber-muted">// {camera}</span>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.2em] text-cyber-red">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyber-red shadow-[0_0_6px] shadow-cyber-red" />
            Rec
          </span>
          <DateTime className="text-cyber-muted" />
        </div>
      </div>

      {/* Frame */}
      <div className="relative aspect-video w-full bg-black">
        <img src={roadImg} alt="Live camera feed" className="h-full w-full object-cover opacity-90" />

        {/* Bounding boxes */}
        {boxes.map((b) => (
          <div
            key={b.id}
            className="absolute"
            style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}
          >
            <div className="relative h-full w-full border border-cyber-gold shadow-[0_0_10px_-2px_rgba(255,192,30,0.7)]">
              {/* corner ticks */}
              <span className="absolute -left-px -top-px h-2 w-2 border-l-2 border-t-2 border-cyber-gold-bright" />
              <span className="absolute -right-px -top-px h-2 w-2 border-r-2 border-t-2 border-cyber-gold-bright" />
              <span className="absolute -bottom-px -left-px h-2 w-2 border-b-2 border-l-2 border-cyber-gold-bright" />
              <span className="absolute -bottom-px -right-px h-2 w-2 border-b-2 border-r-2 border-cyber-gold-bright" />
              {/* label tag */}
              <div className="absolute -top-[18px] left-0 whitespace-nowrap bg-cyber-gold px-1 py-px text-[9px] font-bold uppercase leading-none tracking-wider text-black">
                {b.label} {formatPercent(b.confidence, 0)}
              </div>
              {/* plate readout */}
              {b.plate && (
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 rounded-sm border border-cyber-gold bg-black/85 px-2 py-0.5 font-display text-sm font-bold tracking-[0.25em] text-cyber-gold shadow-gold-glow">
                  {b.plate}
                </div>
              )}
            </div>
          </div>
        ))}

        <ScanLine />

        {/* Corner HUD readouts */}
        <div className="absolute left-2 top-2 text-[9px] uppercase tracking-[0.2em] text-cyber-gold/80">
          ● LIVE · 1920×1080
        </div>
        <div className="absolute bottom-2 right-2 text-[9px] uppercase tracking-[0.2em] text-cyber-gold/80">
          ANPR · 3-HEAD ONNX
        </div>
      </div>
    </div>
  )
}
