import { Navigate, Route, Routes } from 'react-router-dom'
import RootLayout from '@/layouts/RootLayout'
import Dashboard from '@/pages/Dashboard'
import LiveMonitor from '@/pages/LiveMonitor'
import VehicleAnalytics from '@/pages/VehicleAnalytics'
import LicensePlates from '@/pages/LicensePlates'
import Alerts from '@/pages/Alerts'
import Reports from '@/pages/Remports'
import SystemLogs from '@/pages/SystemLogs'
import Settings from '@/pages/Settings'

/** Application route table. RootLayout provides the responsive shell + <Outlet />. */
export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="live" element={<LiveMonitor />} />
        <Route path="analytics" element={<VehicleAnalytics />} />
        <Route path="plates" element={<LicensePlates />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="reports" element={<Reports />} />
        <Route path="logs" element={<SystemLogs />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
