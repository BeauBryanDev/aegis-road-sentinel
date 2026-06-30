import { getToken } from './api'

/**
 * Live-stream WebSocket client for `WS /api/stream/ws?token=<jwt>`.
 * Client sends raw JPEG frame bytes; server replies with per-frame detections.
 * Wired here for the Live Monitor page (not yet consumed by the Dashboard).
 */
/** A single detection in a frame result (see anpr_service / tracking_service). */
export interface StreamDetection {
  track_id?: number
  vehicle_type: string
  vehicle_confidence: number
  vehicle_bbox: [number, number, number, number] // [x1, y1, x2, y2] in frame pixels
  plate_detected: boolean
  plate_text: string | null
  plate_text_confidence: number | null
  plate_bbox: [number, number, number, number] | null
}

export interface FrameResult {
  frame_index: number
  detections: StreamDetection[]
  processing_time_ms: number
  /** Present on error frames; connection stays open. */
  error?: string
}

export interface StreamHandlers {
  onResult?: (result: FrameResult) => void
  onOpen?: () => void
  onClose?: (ev: CloseEvent) => void
  onError?: (ev: Event) => void
}

export class StreamSocket {
  private ws: WebSocket | null = null

  connect(handlers: StreamHandlers = {}): void {
    const token = getToken()
    const base = import.meta.env.VITE_API_BASE_URL || window.location.origin
    const wsUrl = base.replace(/^http/, 'ws') + `/api/stream/ws?token=${token ?? ''}`

    const ws = new WebSocket(wsUrl)
    ws.binaryType = 'arraybuffer'
    ws.onopen = () => handlers.onOpen?.()
    ws.onclose = (ev) => handlers.onClose?.(ev)
    ws.onerror = (ev) => handlers.onError?.(ev)
    ws.onmessage = (ev) => {
      try {
        handlers.onResult?.(JSON.parse(ev.data) as FrameResult)
      } catch {
        /* ignore malformed frames */
      }
    }
    this.ws = ws
  }

  /** Send a single JPEG frame (Blob or ArrayBuffer) for inference. */
  sendFrame(frame: Blob | ArrayBuffer): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(frame)
  }

  disconnect(): void {
    this.ws?.close()
    this.ws = null
  }
}
