// Placeholder data for the Dashboard while the API service layer is built.
// Shapes match src/types so swapping in real endpoints is a drop-in change.
import type { Stats, ConfidenceMetrics, Detection, Alert, SystemMetrics } from '@/types'
import type { FeedBox } from '@/components/monitor/LiveFeed'

export const mockStats: Stats = {
  totalDetections: 1248,
  vehicles: 842,
  plates: 256,
  byType: { car: 842, motorcycle: 256, van: 78, truck: 38, bus: 12 },
  authorized: 1102,
  denied: 146,
  avgProcessingMs: 334,
}

export const mockConfidence: ConfidenceMetrics = {
  vehicleDetection: 0.963,
  plateDetection: 0.921,
  ocrRecognition: 0.917,
}

export const mockSystem: SystemMetrics = {
  avgProcessingMs: 334,
  throughputFps: 3.0,
  provider: 'CPU · ONNXRuntime',
  uptime: '07:42:11',
  healthy: true,
}

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString()

export const mockRecentPlates: Detection[] = [
  { id: 1, licensePlate: 'CAJ814', vehicleType: 'car', vehicleConfidence: 0.677, plateConfidence: 0.945, ocrConfidence: 0.825, authorized: true, processingTimeMs: 334, createdAt: minutesAgo(0.3) },
  { id: 2, licensePlate: 'ABC123', vehicleType: 'car', vehicleConfidence: 0.71, plateConfidence: 0.93, ocrConfidence: 0.952, authorized: true, processingTimeMs: 318, createdAt: minutesAgo(2) },
  { id: 3, licensePlate: 'XYZ789', vehicleType: 'motorcycle', vehicleConfidence: 0.64, plateConfidence: 0.9, ocrConfidence: 0.948, authorized: false, processingTimeMs: 351, createdAt: minutesAgo(5) },
  { id: 4, licensePlate: 'JKL456', vehicleType: 'car', vehicleConfidence: 0.69, plateConfidence: 0.91, ocrConfidence: 0.941, authorized: true, processingTimeMs: 327, createdAt: minutesAgo(8) },
  { id: 5, licensePlate: 'MNP201', vehicleType: 'van', vehicleConfidence: 0.66, plateConfidence: 0.88, ocrConfidence: 0.903, authorized: false, processingTimeMs: 342, createdAt: minutesAgo(13) },
]

export const mockAlerts: Alert[] = [
  { id: 1, level: 'critical', title: 'Unauthorized Vehicle', camera: 'CAM_01', timestamp: minutesAgo(0.5) },
  { id: 2, level: 'warning', title: 'Speeding Vehicle', camera: 'CAM_03', timestamp: minutesAgo(4) },
  { id: 3, level: 'warning', title: 'Red Light Violation', camera: 'CAM_02', timestamp: minutesAgo(9) },
  { id: 4, level: 'info', title: 'Plate Read Below Threshold', camera: 'CAM_01', timestamp: minutesAgo(16) },
]

export const mockFeedBoxes: FeedBox[] = [
  { id: 'v1', label: 'CAR', confidence: 0.677, x: 38, y: 42, w: 26, h: 34, plate: 'CAJ814' },
  { id: 'v2', label: 'CAR', confidence: 0.58, x: 8, y: 40, w: 16, h: 20 },
  { id: 'v3', label: 'TRUCK', confidence: 0.62, x: 70, y: 38, w: 20, h: 24 },
]
