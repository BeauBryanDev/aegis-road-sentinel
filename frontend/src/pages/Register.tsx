import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import AuthShell, { authInputClass } from '@/components/common/AuthShell'
import CyberButton from '@/components/common/CyberButton'
import { useAppStore } from '@/stores/useAppStore'
import { register, type RegisterPayload } from '@/services/authService'
import { apiErrorMessage } from '@/services/api'

export default function Register() {
  const navigate = useNavigate()
  const setToken = useAppStore((s) => s.setToken)

  const [form, setForm] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    confirm: '',
    phone_number: '',
    country: '',
    gender: '' as '' | 'male' | 'female',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }

    setBusy(true)
    try {
      const payload: RegisterPayload = {
        full_name: form.full_name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        phone_number: form.phone_number.trim() || undefined,
        country: form.country.trim() || undefined,
        gender: form.gender || undefined,
      }
      const token = await register(payload)
      setToken(token)
      navigate('/app', { replace: true })
    } catch (err) {
      setError(apiErrorMessage(err, 'Registration failed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Create Operator"
      subtitle="Register a new console account"
      footer={
        <>
          Already registered?{' '}
          <Link to="/login" className="text-cyber-gold hover:text-cyber-gold-bright">
            Sign In
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input className={authInputClass} placeholder="Full name" value={form.full_name} onChange={set('full_name')} autoComplete="name" />
        <input className={authInputClass} placeholder="Username" value={form.username} onChange={set('username')} autoComplete="username" />
        <input className={authInputClass} type="email" placeholder="Email" value={form.email} onChange={set('email')} autoComplete="email" />
        <div className="grid grid-cols-2 gap-3">
          <input className={authInputClass} placeholder="Phone (optional)" value={form.phone_number} onChange={set('phone_number')} autoComplete="tel" />
          <select className={authInputClass} value={form.gender} onChange={set('gender')}>
            <option value="">Gender…</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <input className={authInputClass} placeholder="Country (optional)" value={form.country} onChange={set('country')} autoComplete="country-name" />
        <input className={authInputClass} type="password" placeholder="Password (min 8)" value={form.password} onChange={set('password')} autoComplete="new-password" />
        <input className={authInputClass} type="password" placeholder="Confirm password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
        {error && <span className="text-[11px] text-cyber-red">{error}</span>}
        <CyberButton
          variant="solid"
          type="submit"
          disabled={busy || !form.full_name || !form.username || !form.email || !form.password}
          className="justify-center py-2"
        >
          <UserPlus className="h-4 w-4" />
          {busy ? 'Creating…' : 'Register'}
        </CyberButton>
      </form>
    </AuthShell>
  )
}
