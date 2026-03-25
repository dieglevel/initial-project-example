import { Button, Flex, Input } from 'antd'
import {
  FilterOutlined,
  PrinterOutlined,
  ProfileOutlined,
  SearchOutlined,
} from '@ant-design/icons'

interface ToolbarProps {
  filterOpen?: boolean
  setFilterOpen?: (open: boolean) => void
}

export default function Toolbar({ filterOpen, setFilterOpen }: ToolbarProps) {
  return (
    <Flex gap={16} align="center" justify="space-between">
      <Flex gap={4} style={{ width: '100%' }}>
        <Button
          size="middle"
          icon={<FilterOutlined />}
          onClick={() => setFilterOpen && setFilterOpen(!filterOpen)}
        />
        <Input
          placeholder="Search"
          style={{ width: 300 }}
          suffix={<SearchOutlined />}
        />
      </Flex>
      <Flex gap={4}>
        <Button icon={<ProfileOutlined />}>Excel</Button>
        <Button icon={<PrinterOutlined />}>Print</Button>
      </Flex>
    </Flex>
  )
}
