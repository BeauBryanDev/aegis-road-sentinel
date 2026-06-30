import { create } from 'zustand'
import type { Detection } from '@/types'
import { listDetections } from '@/services/ANRPService'
import { apiErrorMessage } from '@/services/api'

interface PlateState {
  recent: Detection[]
  loading: boolean
  error: string | null
  /** Load the most recent detections (newest first). */
  fetchRecent: (limit?: number) => Promise<void>
}

export const usePlateStore = create<PlateState>((set) => ({
  recent: [],
  loading: false,
  error: null,

  fetchRecent: async (limit = 5) => {
    set({ loading: true, error: null })
    try {
      const recent = await listDetections({ limit })
      set({ recent, loading: false })
    } catch (err) {
      set({ error: apiErrorMessage(err, 'Failed to load plates'), loading: false })
    }
  },
}))
