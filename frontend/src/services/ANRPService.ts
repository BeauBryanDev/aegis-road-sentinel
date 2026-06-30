import { api } from './api'
import type { Detection, VehicleType } from '@/types'

/** Raw detection row from GET /api/vehicles/detections (see detections_schema.py). */
interface RawDetection {
  id: number
  vehicle_type: string
  vehicle_confidence: number | null
  plate_text: string
  plate_confidence: number | null
  is_allowed: boolean
  processing_time_ms: number | null
  source: string
  created_at: string
}

const KNOWN_TYPES: VehicleType[] = ['car', 'truck', 'bus', 'motorcycle', 'van', 'pickup', 'microbus']

function toVehicleType(raw: string): VehicleType {
  const t = raw.toLowerCase()
  return (KNOWN_TYPES as string[]).includes(t) ? (t as VehicleType) : 'car'
}

function mapDetection(r: RawDetection): Detection {
  return {
    id: r.id,
    licensePlate: r.plate_text,
    vehicleType: toVehicleType(r.vehicle_type),
    vehicleConfidence: r.vehicle_confidence ?? 0,
    plateConfidence: r.plate_confidence ?? 0,
    // No separate OCR confidence is persisted; plate_confidence is the proxy.
    ocrConfidence: r.plate_confidence ?? 0,
    authorized: r.is_allowed,
    processingTimeMs: r.processing_time_ms ?? 0,
    createdAt: r.created_at,
  }
}

interface ListParams {
  skip?: number
  limit?: number
  plate?: string
  isAllowed?: boolean
}

/** Paginated, filterable detection history. */
export async function listDetections(params: ListParams = {}): Promise<Detection[]> {
  const { data } = await api.get<RawDetection[]>('/api/vehicles/detections', {
    params: {
      skip: params.skip,
      limit: params.limit,
      plate: params.plate,
      is_allowed: params.isAllowed,
    },
  })
  return data.map(mapDetection)
}

/** Run ANPR on an uploaded image (JWT-protected). Returns persisted detections. */
export async function detectImage(file: File): Promise<Detection[]> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post<RawDetection[]>('/api/anpr/detect', form)
  return data.map(mapDetection)
}
