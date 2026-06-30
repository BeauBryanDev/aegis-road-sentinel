// Core domain types for Aegis Road Sentinel (ANPR console).
// These mirror the backend (see CLAUDE.md) and are refined as the service
// layer is built out. Crash / traffic-sign / network types are intentionally
// absent — those features are out of scope.

export type VehicleType =
  | 'car'
  | 'truck'
  | 'bus'
  | 'motorcycle'
  | 'van'
  | 'pickup'
  | 'microbus'

/** A single ANPR detection row (audit log entry). */
export interface Detection {
  id: number
  licensePlate: string
  vehicleType: VehicleType
  vehicleConfidence: number // 0..1
  plateConfidence: number // 0..1
  ocrConfidence: number // 0..1
  authorized: boolean
  processingTimeMs: number
  createdAt: string // ISO timestamp
}

/** AI confidence metrics — only the in-scope heads (vehicle / plate / OCR). */
export interface ConfidenceMetrics {
  vehicleDetection: number // 0..1
  plateDetection: number // 0..1
  ocrRecognition: number // 0..1
}

/** Aggregate counters for the Real-Time Statistics / Overview panels. */
export interface Stats {
  totalDetections: number
  vehicles: number
  plates: number
  byType: Partial<Record<VehicleType, number>>
  authorized: number
  denied: number
  avgProcessingMs: number
}

export type AlertLevel = 'info' | 'warning' | 'critical'

export interface Alert {
  id: number
  level: AlertLevel
  title: string
  camera: string
  timestamp: string // ISO timestamp
}
