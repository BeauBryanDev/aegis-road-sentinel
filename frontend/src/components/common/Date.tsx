import { useEffect, useState } from 'react'

interface DateTimeProps {
  /** Show the date alongside the time. */
  showDate?: boolean
  className?: string
}

/** Live ticking clock (and optional date) for HUD headers. */
export default function DateTime({ showDate = false, className = '' }: DateTimeProps) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const time = now.toLocaleTimeString('en-GB', { hour12: false })
  const date = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <span className={`tabular-nums tracking-[0.15em] ${className}`}>
      {showDate && <span className="text-cyber-muted">{date} · </span>}
      {time}
    </span>
  )
}
