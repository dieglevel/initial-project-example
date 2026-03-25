import { Typography } from 'antd'

const { Text } = Typography

interface SectionHeaderProps {
  title: string
}

export default function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <div style={{ marginBottom: 12 }}>
      <Text strong style={{ fontSize: 14 }}>
        {title}
      </Text>
    </div>
  )
}
