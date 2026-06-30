import { useEffect, useState } from 'react'
import { MOBILE_BREAKPOINT } from '@/types/constant'
import DesktopLayout from './DesktopLayout'
import MobileLayout from './MobileLayout'

/** Subscribe to a `(max-width: …)` media query and re-render on changes. */
function useIsMobile(): boolean {
  const query = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  )

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', onChange)
    setIsMobile(mql.matches)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return isMobile
}

/** Picks the desktop or mobile console shell based on viewport width. */
export default function RootLayout() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileLayout /> : <DesktopLayout />
}
