import { create } from 'zustand'
import type { Alert } from '@/types'
import { listDetections } from '@/services/ANRPService'
import { apiErrorMessage } from '@/services/api'

interface AlertState {
  alerts: Alert[]
  loading: boolean
  error: string | null
  /** Build the alerts feed from recent unauthorized (denied) detections. */
  fetchAlerts: (limit?: number) => Promise<void>
}

export const useAlertStore = create<AlertState>((set) => ({
  alerts: [],
  loading: false,
  error: null,

  fetchAlerts: async (limit = 8) => {
    set({ loading: true, error: null })
    try {
      // The backend has no dedicated alerts endpoint; the access-control use
      // case treats every denied (non-whitelisted) detection as an alert.
      const denied = await listDetections({ isAllowed: false, limit })
      const alerts: Alert[] = denied.map((d) => ({
        id: d.id,
        level: 'critical',
        title: `Unauthorized Vehicle · ${d.licensePlate}`,
        camera: 'CAM_01',
        timestamp: d.createdAt,
      }))
      set({ alerts, loading: false })
    } catch (err) {
      set({ error: apiErrorMessage(err, 'Failed to load alerts'), loading: false })
    }
  },
}))
