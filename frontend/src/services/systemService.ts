import { api } from './api'
import type { Stats, ConfidenceMetrics, SystemMetrics } from '@/types'

// --- Raw backend response shapes (see backend/app/routers/stats.py & health.py) ---

interface RawStats {
  total_detections: number
  by_vehicle_type: { cars: number; trucks: number; buses: number; motorcycles: number }
  confidence: { vehicle_detection: number; plate_detection: number }
  access_control: { allowed: number; denied: number }
  avg_processing_ms: number
}

interface RawHealth {
  status: 'healthy' | 'degraded'
  service: string
  checks: Record<string, string>
}

/** Fetch aggregate stats + the AI-confidence metrics in one call. */
export async function getStats(): Promise<{ stats: Stats; confidence: ConfidenceMetrics }> {
  const { data } = await api.get<RawStats>('/api/stats')

  const stats: Stats = {
    totalDetections: data.total_detections,
    // The backend counts one detection per vehicle-with-plate, so these align.
    vehicles: data.total_detections,
    plates: data.total_detections,
    byType: {
      car: data.by_vehicle_type.cars,
      truck: data.by_vehicle_type.trucks,
      bus: data.by_vehicle_type.buses,
      motorcycle: data.by_vehicle_type.motorcycles,
    },
    authorized: data.access_control.allowed,
    denied: data.access_control.denied,
    avgProcessingMs: data.avg_processing_ms,
  }

  const confidence: ConfidenceMetrics = {
    vehicleDetection: data.confidence.vehicle_detection,
    plateDetection: data.confidence.plate_detection,
    // The DB conflates OCR into plate_confidence (no separate OCR avg is
    // persisted), so we surface plate_detection as the OCR proxy.
    ocrRecognition: data.confidence.plate_detection,
  }

  return { stats, confidence }
}

/** Probe API/DB/model health and derive System Core telemetry. */
export async function getSystemMetrics(avgProcessingMs: number): Promise<SystemMetrics> {
  let healthy = false
  try {
    const { data } = await api.get<RawHealth>('/api/health')
    healthy = data.status === 'healthy'
  } catch {
    healthy = false
  }

  return {
    avgProcessingMs,
    throughputFps: avgProcessingMs > 0 ? 1000 / avgProcessingMs : 0,
    provider: 'CPU · ONNXRuntime',
    uptime: formatUptime(),
    healthy,
  }
}

// Client-side uptime since the console (tab) loaded — backend exposes no uptime.
const bootTime = Date.now()
function formatUptime(): string {
  const secs = Math.floor((Date.now() - bootTime) / 1000)
  const h = String(Math.floor(secs / 3600)).padStart(2, '0')
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0')
  const s = String(secs % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}
