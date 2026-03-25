import { useLocation } from '@tanstack/react-router'
import { useMemo } from 'react'

export function usePageType() {
  const location = useLocation()

  return useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean)

    const isWritePage = segments.includes('write')
    const isViewPage = segments.includes('view')

    const isListPage = segments.includes('list') && !isWritePage && !isViewPage

    return {
      isWritePage,
      isListPage,
      isViewPage,
      location,
    }
  }, [location.pathname])
}
