import * as React from "react"

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

const MOBILE_MAX = 767
const TABLET_MAX = 1439

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = React.useState<Breakpoint>('desktop')

  React.useEffect(() => {
    const getBreakpoint = (): Breakpoint => {
      const width = window.innerWidth
      if (width <= MOBILE_MAX) return 'mobile'
      if (width <= TABLET_MAX) return 'tablet'
      return 'desktop'
    }

    const handleResize = () => {
      setBreakpoint(getBreakpoint())
    }

    const mobileQuery = window.matchMedia(`(max-width: ${MOBILE_MAX}px)`)
    const tabletQuery = window.matchMedia(`(min-width: ${MOBILE_MAX + 1}px) and (max-width: ${TABLET_MAX}px)`)

    mobileQuery.addEventListener("change", handleResize)
    tabletQuery.addEventListener("change", handleResize)

    setBreakpoint(getBreakpoint())

    return () => {
      mobileQuery.removeEventListener("change", handleResize)
      tabletQuery.removeEventListener("change", handleResize)
    }
  }, [])

  return breakpoint
}

export function useIsMobileOrTablet(): boolean {
  const breakpoint = useBreakpoint()
  return breakpoint === 'mobile' || breakpoint === 'tablet'
}
