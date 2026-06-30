import { create } from 'zustand'
import type { Stats, ConfidenceMetrics, SystemMetrics } from '@/types'
import { getStats, getSystemMetrics } from '@/services/systemService'
import { getToken, setToken as persistToken, apiErrorMessage } from '@/services/api'
import { logout as logoutApi } from '@/services/authService'

interface AppState {
  // Auth
  token: string | null
  setToken: (token: string | null) => void
  /** Clear the session: best-effort backend call + discard token + reset data. */
  logout: () => void

  // Dashboard overview
  stats: Stats | null
  confidence: ConfidenceMetrics | null
  system: SystemMetrics | null
  loading: boolean
  error: string | null

  /** Fetch stats, confidence and system telemetry for the dashboard. */
  fetchOverview: () => Promise<void>
}

export const useAppStore = create<AppState>((set) => ({
  token: getToken(),
  setToken: (token) => {
    persistToken(token)
    set({ token })
  },

  logout: () => {
    // Fire-and-forget: tell the backend, but clear locally regardless.
    void logoutApi()
    persistToken(null)
    set({ token: null, stats: null, confidence: null, system: null, error: null })
  },

  stats: null,
  confidence: null,
  system: null,
  loading: false,
  error: null,

  fetchOverview: async () => {
    set({ loading: true, error: null })
    try {
      const { stats, confidence } = await getStats()
      const system = await getSystemMetrics(stats.avgProcessingMs)
      set({ stats, confidence, system, loading: false })
    } catch (err) {
      set({ error: apiErrorMessage(err, 'Failed to load overview'), loading: false })
    }
  },
}))
