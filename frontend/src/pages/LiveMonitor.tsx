import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { Play, Square, Lock, LogIn } from 'lucide-react'
import Panel from '@/components/common/Panel'
import CyberButton from '@/components/common/CyberButton'
import DateTime from '@/components/common/Date'
import LiveStream from '@/components/monitor/LiveStream'
import CamSelector from '@/components/monitor/CamSelector'
import FrameInfo, { type WsStatus } from '@/components/monitor/FrameInfo'
import { useAppStore } from '@/stores/useAppStore'
import type { FrameResult } from '@/services/websocketService'

export default function LiveMonitor() {
  const token = useAppStore((s) => s.token)
  const setToken = useAppStore((s) => s.setToken)
  const canInfer = Boolean(token)

  const [active, setActive] = useState(false)
  const [status, setStatus] = useState<WsStatus>('idle')
  const [result, setResult] = useState<FrameResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Stable callbacks so the stream's effects don't reconnect every render.
  const onResult = useCallback((r: FrameResult) => setResult(r), [])
  const onStatus = useCallback((s: WsStatus) => setStatus(s), [])
  const onError = useCallback((m: string) => setError(m), [])

  const detections = result?.detections ?? []

  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
      {/* Feed */}
      <div className="xl:col-span-2">
        <Panel
          flush
          title="Live Monitor"
          action={
            <div className="flex items-center gap-3">
              <CamSelector />
              <DateTime className="hidden text-[11px] text-cyber-muted sm:inline" />
            </div>
          }
        >
          <LiveStream
            active={active}
            canInfer={canInfer}
            onResult={onResult}
            onStatus={onStatus}
            onError={onError}
          />
          <div className="flex items-center justify-between gap-3 p-3">
            <CyberButton
              variant={active ? 'outline' : 'solid'}
              onClick={() => {
                setError(null)
                setActive((a) => !a)
              }}
            >
              {active ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {active ? 'Stop' : 'Start Camera'}
            </CyberButton>
            {!canInfer && (
              <span className="flex items-center gap-1.5 text-[11px] text-cyber-gold-dim">
                <Lock className="h-3.5 w-3.5" /> Preview only — sign in for ANPR
              </span>
            )}
          </div>
        </Panel>
      </div>

      {/* Side rail: telemetry + session */}
      <div className="flex flex-col gap-3">
        <Panel title="Telemetry">
          <FrameInfo
            status={status}
            frameIndex={result?.frame_index ?? 0}
            processingMs={result?.processing_time_ms ?? 0}
            detectionCount={detections.length}
            resolution={active ? 'Webcam' : '—'}
          />
        </Panel>

        {canInfer ? (
          <Panel title="Session">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-cyber-green">● Authenticated</span>
              <CyberButton variant="ghost" onClick={() => setToken(null)}>
                Sign out
              </CyberButton>
            </div>
          </Panel>
        ) : (
          <Panel title="Authentication">
            <p className="mb-3 text-[12px] leading-relaxed text-cyber-muted">
              ANPR inference runs over an authenticated WebSocket. Sign in to enable live
              vehicle &amp; plate overlays — the camera preview works without it.
            </p>
            <Link to="/login" state={{ from: '/app/live' }}>
              <CyberButton variant="solid" className="w-full justify-center py-2">
                <LogIn className="h-4 w-4" />
                Sign In
              </CyberButton>
            </Link>
          </Panel>
        )}

        {error && (
          <div className="rounded-sm border border-cyber-red/50 bg-cyber-red/10 px-3 py-2 text-[12px] text-cyber-red">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
