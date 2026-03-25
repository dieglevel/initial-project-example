import { Flex } from 'antd'
import { AppBreadcrumb } from '../../breadcrumb'
import { background } from '@/shared/common/design-token'
import { TOP_BREADCRUMB_HEIGHT } from '@/shared/common/layout'

export interface RightTopBarProps {
  component: React.ReactNode
  isShow: boolean
}

export interface TopBarProps {
  rightComponent?: Array<RightTopBarProps>
}

export default function TopBar({ rightComponent }: TopBarProps) {
  return (
    <Flex
      align="center"
      justify="space-between"
      style={{
        background: background.elevated,
        padding: '0 8px',
        minHeight: TOP_BREADCRUMB_HEIGHT,
        borderBottom: `1px solid var(--border-base)`,
      }}
    >
      <AppBreadcrumb />
      <Flex gap={8} style={{ justifyContent: 'flex-end', width: '100%' }}>
        {rightComponent?.map((item, index) => {
          if (item.isShow) {
            return <div key={index}>{item.component}</div>
          }
          return null
        })}
      </Flex>
    </Flex>
  )
}
