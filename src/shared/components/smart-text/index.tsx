import { Tooltip, Typography } from 'antd'
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

type SmartTextProps = {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  rows?: number // số dòng cho multi-line ellipsis
  mode?: 'ellipsis' | 'scroll'
  debounceMs?: number
  tooltip?: boolean // có bật tooltip không
}

function useDebouncedCallback(callback: () => void, delay: number) {
  const timeoutRef = useRef<number>(1000)

  return () => {
    window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(callback, delay)
  }
}

const SmartText = forwardRef<HTMLDivElement, SmartTextProps>(
  (
    {
      children,
      className,
      style,
      rows = 1,
      mode = 'ellipsis',
      debounceMs = 100,
      tooltip = true,
    },
    ref,
  ) => {
    const innerRef = useRef<HTMLDivElement>(null)
    const [isOverflow, setIsOverflow] = useState(false)

    useImperativeHandle(ref, () => innerRef.current as HTMLDivElement)

    const checkOverflow = () => {
      const el = innerRef.current
      if (!el) return

      const horizontalOverflow = el.scrollWidth > el.clientWidth
      const verticalOverflow = el.scrollHeight > el.clientHeight

      setIsOverflow(horizontalOverflow || verticalOverflow)
    }

    const debouncedCheck = useDebouncedCallback(checkOverflow, debounceMs)

    useEffect(() => {
      checkOverflow()
    }, [children, rows])

    useEffect(() => {
      const el = innerRef.current
      if (!el) return

      const resizeObserver = new ResizeObserver(() => {
        debouncedCheck()
      })

      resizeObserver.observe(el)

      return () => {
        resizeObserver.disconnect()
      }
    }, [])

    const baseStyle: React.CSSProperties =
      mode === 'scroll'
        ? {
            overflow: 'auto',
            whiteSpace: 'nowrap',
          }
        : rows === 1
          ? {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }
          : {
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: rows,
              overflow: 'hidden',
            }

    const content = (
      <div
        ref={innerRef}
        className={className}
        style={{
          width: '100%',
          ...baseStyle,
          ...style,
        }}
      >
        <Typography.Text>{children}</Typography.Text>
      </div>
    )

    if (!tooltip) return content

    return isOverflow ? <Tooltip title={children}>{content}</Tooltip> : content
  },
)

SmartText.displayName = 'SmartText'

export default SmartText
