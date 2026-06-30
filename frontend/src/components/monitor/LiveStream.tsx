import { useEffect, useRef } from 'react'
import ScanLine from '@/components/common/ScanLine'
import { useCameraStore } from '@/stores/useCameraStore'
import { StreamSocket, type FrameResult, type StreamDetection } from '@/services/websocketService'
import type { WsStatus } from './FrameInfo'

/** How often to grab and send a frame (ms). Backend inference is ~430ms ≈ 2fps. */
const CAPTURE_INTERVAL_MS = 500
const INFLIGHT_TIMEOUT_MS = 4000

interface LiveStreamProps {
  active: boolean
  /** True when a JWT is present — enables WS inference + overlays. */
  canInfer: boolean
  onResult: (result: FrameResult) => void
  onStatus: (status: WsStatus) => void
  onError: (message: string) => void
}

/**
 * Webcam preview with live ANPR overlays.
 * - Asks for camera permission via getUserMedia when `active`.
 * - When `canInfer`, samples frames to JPEG and streams them to the backend
 *   WebSocket, drawing the returned vehicle/plate boxes on an overlay canvas.
 */
export default function LiveStream({ active, canInfer, onResult, onStatus, onError }: LiveStreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const captureRef = useRef<HTMLCanvasElement>(null)
  const socketRef = useRef<StreamSocket | null>(null)
  const inFlightRef = useRef(false)
  const inFlightAtRef = useRef(0)

  const { deviceId, setDevices, setDeviceId } = useCameraStore()

  // --- Camera acquisition -------------------------------------------------
  useEffect(() => {
    if (!active) return
    let stream: MediaStream | null = null
    let cancelled = false

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: deviceId ? { deviceId: { exact: deviceId } } : true,
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
        // Labels become available only after permission is granted.
        const devices = await navigator.mediaDevices.enumerateDevices()
        const cams = devices.filter((d) => d.kind === 'videoinput')
        setDevices(cams)
        if (!deviceId && cams[0]) setDeviceId(cams[0].deviceId)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Camera access denied'
        onError(`Camera permission failed: ${msg}`)
        onStatus('error')
      }
    }
    start()

    return () => {
      cancelled = true
      stream?.getTracks().forEach((t) => t.stop())
      if (videoRef.current) videoRef.current.srcObject = null
    }
  }, [active, deviceId, setDevices, setDeviceId, onError, onStatus])

  // --- WebSocket + frame capture loop ------------------------------------
  useEffect(() => {
    if (!active) {
      onStatus('idle')
      clearOverlay()
      return
    }
    if (!canInfer) {
      // Preview only — no inference until signed in.
      onStatus('idle')
      clearOverlay()
      return
    }

    onStatus('connecting')
    const socket = new StreamSocket()
    socketRef.current = socket
    inFlightRef.current = false

    socket.connect({
      onOpen: () => onStatus('live'),
      onClose: () => onStatus('idle'),
      onError: () => {
        onStatus('error')
        onError('Live stream connection failed. Check that you are signed in.')
      },
      onResult: (result: FrameResult) => {
        inFlightRef.current = false
        if (result.error) return
        drawOverlay(result.detections)
        onResult(result)
      },
    })

    const id = window.setInterval(() => {
      const v = videoRef.current
      const c = captureRef.current
      if (!v || !c || !v.videoWidth) return
      // Drop the in-flight gate if the server went quiet.
      if (inFlightRef.current && Date.now() - inFlightAtRef.current > INFLIGHT_TIMEOUT_MS) {
        inFlightRef.current = false
      }
      if (inFlightRef.current) return

      c.width = v.videoWidth
      c.height = v.videoHeight
      c.getContext('2d')?.drawImage(v, 0, 0)
      c.toBlob(
        (blob) => {
          if (blob) {
            inFlightRef.current = true
            inFlightAtRef.current = Date.now()
            socket.sendFrame(blob)
          }
        },
        'image/jpeg',
        0.6,
      )
    }, CAPTURE_INTERVAL_MS)

    return () => {
      window.clearInterval(id)
      socket.disconnect()
      socketRef.current = null
      clearOverlay()
    }
  }, [active, canInfer, onResult, onStatus, onError])

  function clearOverlay() {
    const canvas = overlayRef.current
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
  }

  function drawOverlay(detections: StreamDetection[]) {
    const video = videoRef.current
    const canvas = overlayRef.current
    if (!video || !canvas || !video.videoWidth) return

    // Match canvas to the displayed video size, scale from frame pixels.
    const w = video.clientWidth
    const h = video.clientHeight
    canvas.width = w
    canvas.height = h
    const sx = w / video.videoWidth
    const sy = h / video.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, w, h)
    ctx.lineWidth = 2
    ctx.font = '600 11px "JetBrains Mono", monospace'

    for (const d of detections) {
      const [x1, y1, x2, y2] = d.vehicle_bbox
      const x = x1 * sx
      const y = y1 * sy
      const bw = (x2 - x1) * sx
      const bh = (y2 - y1) * sy

      ctx.strokeStyle = '#ffc01e'
      ctx.shadowColor = 'rgba(255,192,30,0.7)'
      ctx.shadowBlur = 8
      ctx.strokeRect(x, y, bw, bh)
      ctx.shadowBlur = 0

      // Vehicle label tag
      const label = `${d.vehicle_type.toUpperCase()} ${(d.vehicle_confidence * 100).toFixed(0)}%`
      ctx.fillStyle = '#ffc01e'
      const tagW = ctx.measureText(label).width + 8
      ctx.fillRect(x, y - 16, tagW, 16)
      ctx.fillStyle = '#000'
      ctx.fillText(label, x + 4, y - 4)

      // Plate readout
      if (d.plate_text) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)'
        const pw = ctx.measureText(d.plate_text).width + 10
        ctx.fillRect(x, y + bh, pw, 18)
        ctx.strokeStyle = '#ffc01e'
        ctx.strokeRect(x, y + bh, pw, 18)
        ctx.fillStyle = '#ffc01e'
        ctx.fillText(d.plate_text, x + 5, y + bh + 13)
      }
    }
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-black">
      <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
      <canvas ref={overlayRef} className="pointer-events-none absolute inset-0 h-full w-full" />
      <canvas ref={captureRef} className="hidden" />

      {active && <ScanLine />}

      {!active && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-cyber-muted">
          <span className="font-display text-sm tracking-[0.2em]">CAMERA OFFLINE</span>
          <span className="text-[11px]">Press Start to enable the live feed</span>
        </div>
      )}
    </div>
  )
}
