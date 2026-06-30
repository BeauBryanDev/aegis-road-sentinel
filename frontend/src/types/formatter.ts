import type { VehicleType } from './index'

/** 0..1 confidence → "96.3%". */
export function formatPercent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`
}

/** Thousands-separated integer → "1,248". */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}

/** Signed delta → "+12.4%" / "-3.1%". */
export function formatDelta(value: number, digits = 1): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(digits)}%`
}

/** ISO timestamp → "14:32:08". */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour12: false })
}

/** Compact "time ago" for feeds — "now", "12s", "4m", "2h". */
export function formatAgo(iso: string, now: number = Date.now()): string {
  const secs = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000))
  if (secs < 5) return 'now'
  if (secs < 60) return `${secs}s`
  if (secs < 3600) return `${Math.floor(secs / 60)}m`
  return `${Math.floor(secs / 3600)}h`
}

/** Human label for a vehicle class. */
export function vehicleLabel(type: VehicleType): string {
  const map: Record<VehicleType, string> = {
    car: 'Car',
    truck: 'Truck',
    bus: 'Bus',
    motorcycle: 'Motorcycle',
    van: 'Van',
    pickup: 'Pickup',
    microbus: 'Microbus',
  }
  return map[type]
}
