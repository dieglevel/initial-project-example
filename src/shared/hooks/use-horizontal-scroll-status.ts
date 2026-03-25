import { useEffect, useRef, useState } from 'react'

export default function useHorizontalScrollStatus() {
  const ref = useRef<HTMLDivElement | null>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const updateStatus = () => {
      const overflowing = el.scrollWidth > el.clientWidth + 1
      setIsOverflowing(overflowing)
    }

    const resizeObserver = new ResizeObserver(updateStatus)
    resizeObserver.observe(el)

    updateStatus()

    window.addEventListener('resize', updateStatus)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateStatus)
    }
  }, [])

  return { ref, isOverflowing }
}
