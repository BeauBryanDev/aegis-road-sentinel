import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import AuthShell, { authInputClass } from '@/components/common/AuthShell'
import CyberButton from '@/components/common/CyberButton'
import { useAppStore } from '@/stores/useAppStore'
import { login } from '@/services/authService'
import { apiErrorMessage } from '@/services/api'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const setToken = useAppStore((s) => s.setToken)

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Where to go after a successful login (set by route guards / redirects).
  const from = (location.state as { from?: string } | null)?.from ?? '/app'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const token = await login(identifier.trim(), password)
      setToken(token)
      navigate(from, { replace: true })
    } catch (err) {
      setError(apiErrorMessage(err, 'Invalid username or password'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Operator Sign In"
      subtitle="Authenticate to access the live stream and controls"
      footer={
        <>
          No account?{' '}
          <Link to="/register" className="text-cyber-gold hover:text-cyber-gold-bright">
            Register
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          className={authInputClass}
          placeholder="Username or email"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          autoComplete="username"
          autoFocus
        />
        <input
          className={authInputClass}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        {error && <span className="text-[11px] text-cyber-red">{error}</span>}
        <CyberButton
          variant="solid"
          type="submit"
          disabled={busy || !identifier || !password}
          className="justify-center py-2"
        >
          <LogIn className="h-4 w-4" />
          {busy ? 'Authenticating…' : 'Sign In'}
        </CyberButton>
      </form>
    </AuthShell>
  )
}
