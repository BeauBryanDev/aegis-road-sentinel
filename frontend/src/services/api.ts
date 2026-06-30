import axios from 'axios'

/**
 * Shared axios instance.
 * `VITE_API_BASE_URL` is empty by default so requests hit the Vite dev proxy
 * (`/api/*` → http://localhost:8000). Set it for production / direct calls.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
})

const TOKEN_KEY = 'aegis_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

// Attach the bearer token (when present) to every request.
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/** Normalize an axios error into a short, displayable message. */
export function apiErrorMessage(err: unknown, fallback = 'Request failed'): string {
  if (axios.isAxiosError(err)) {
    const detail = (err.response?.data as { detail?: string } | undefined)?.detail
    return detail ?? err.message ?? fallback
  }
  return err instanceof Error ? err.message : fallback
}
