import { Flex } from 'antd'

export default function Toolbar() {
  return (
    <Flex gap={16} align="center" justify="space-between">
      <Flex gap={4} style={{ width: '100%' }}>
        <div></div>
      </Flex>
      <Flex gap={4}></Flex>
    </Flex>
  )
}
