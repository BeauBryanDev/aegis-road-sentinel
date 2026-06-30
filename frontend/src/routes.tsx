import { Route, Routes } from 'react-router-dom'
import PublicLayout from '@/layouts/PublicLayout'
import RootLayout from '@/layouts/RootLayout'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import NotFound from '@/pages/NotFound'
import Dashboard from '@/pages/Dashboard'
import LiveMonitor from '@/pages/LiveMonitor'
import VehicleAnalytics from '@/pages/VehicleAnalytics'
import LicensePlates from '@/pages/LicensePlates'
import Alerts from '@/pages/Alerts'
import Reports from '@/pages/Reports'
import SystemLogs from '@/pages/SystemLogs'
import Settings from '@/pages/Settings'

/**
 * Route table.
 * - Public site (Home) lives at `/` under PublicLayout (marketing header).
 * - Auth pages render full-screen.
 * - The authenticated console lives under `/app` inside RootLayout.
 */
export default function AppRoutes() {
  return (
    <Routes>
      {/* Public site */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<Home />} />
      </Route>

      {/* Auth (full-screen) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Console */}
      <Route path="/app" element={<RootLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="live" element={<LiveMonitor />} />
        <Route path="analytics" element={<VehicleAnalytics />} />
        <Route path="plates" element={<LicensePlates />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="reports" element={<Reports />} />
        <Route path="logs" element={<SystemLogs />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
