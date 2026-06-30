// Navigation + static config for the console shell.
import {
  LayoutDashboard,
  Video,
  BarChart3,
  ScanLine,
  Bell,
  FileText,
  Terminal,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  /** Router path. */
  to: string
  /** Sidebar label (desktop). */
  label: string
  /** Short label for the mobile tab bar. */
  shortLabel: string
  icon: LucideIcon
  /** Whether this item appears in the mobile bottom tab bar. */
  mobileTab?: boolean
}

/**
 * Full navigation set, mirroring the desktop sidebar in the mockup.
 * Traffic Signs / Crash / Network panels are intentionally omitted (out of scope).
 */
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard },
  { to: '/live', label: 'Live Monitor', shortLabel: 'Live', icon: Video, mobileTab: true },
  { to: '/analytics', label: 'Vehicle Analytics', shortLabel: 'Analytics', icon: BarChart3, mobileTab: true },
  { to: '/plates', label: 'License Plates', shortLabel: 'Plates', icon: ScanLine, mobileTab: true },
  { to: '/alerts', label: 'Alerts', shortLabel: 'Alerts', icon: Bell, mobileTab: true },
  { to: '/reports', label: 'Reports', shortLabel: 'Reports', icon: FileText },
  { to: '/logs', label: 'System Logs', shortLabel: 'Logs', icon: Terminal },
  { to: '/settings', label: 'Configuration', shortLabel: 'Config', icon: Settings },
]

/** Items shown directly in the mobile bottom tab bar (rest live behind "Menu"). */
export const MOBILE_TABS = NAV_ITEMS.filter((item) => item.mobileTab)

/** Items surfaced in the mobile "Menu" drawer (everything not a primary tab). */
export const MOBILE_MENU_ITEMS = NAV_ITEMS.filter((item) => !item.mobileTab)

export const APP_NAME = 'AEGIS'
export const APP_SUBTITLE = 'TRAFFIC VISION'

/** Tailwind breakpoint (px) below which the mobile layout is used. */
export const MOBILE_BREAKPOINT = 768
