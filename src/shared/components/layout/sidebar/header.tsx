import { Flex } from 'antd'
import { Brand } from '@/shared/assets/images'

export default function SidebarHeader() {
  return (
    <Flex align="center" gap={8} justify="center" vertical>
      <Flex
        align="center"
        gap={12}
        justify="center"
        style={{
          margin: '12px 0px',
        }}
      >
        {/* <DeploymentUnitOutlined
          style={{
            color: colors.primary.light,
            fontSize: 48,
            padding: 8,
            borderRadius: 6,
            cursor: 'pointer',
            background: colors.primary.base,
          }}
        /> */}
        <img src={Brand} style={{ width: '80%' }} />
      </Flex>
    </Flex>
  )
}
