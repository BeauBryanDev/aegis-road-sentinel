import { api } from './api'

interface TokenResponse {
  access_token: string
  token_type: string
}

/** Registration payload — mirrors backend UserCreate (user_schema.py). */
export interface RegisterPayload {
  full_name: string
  username: string
  email: string
  password: string // min 8 chars (backend-enforced)
  phone_number?: string
  gender?: 'male' | 'female'
  country?: string
  address?: string
}

/**
 * Log in via the OAuth2 password flow (POST /api/auth/login).
 * `identifier` may be a username OR an email. Returns the JWT access token.
 */
export async function login(identifier: string, password: string): Promise<string> {
  const form = new URLSearchParams()
  form.set('username', identifier)
  form.set('password', password)

  const { data } = await api.post<TokenResponse>('/api/auth/login', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return data.access_token
}

/**
 * Register a new user (POST /api/auth/register), then log them in.
 * The register endpoint returns the user (no token), so we follow up with a
 * login call and return the resulting JWT.
 */
export async function register(payload: RegisterPayload): Promise<string> {
  // Strip empty optional fields so we don't send "" for nullable columns.
  const body = Object.fromEntries(
    Object.entries(payload).filter(([, v]) => v !== '' && v != null),
  )
  await api.post('/api/auth/register', body)
  return login(payload.username, payload.password)
}

/**
 * Notify the backend of logout (best-effort). JWT is stateless, so the real
 * logout is the client discarding its token; this is a hook for audit/revocation.
 */
export async function logout(): Promise<void> {
  try {
    await api.post('/api/auth/logout')
  } catch {
    /* ignore — token is cleared client-side regardless */
  }
}
