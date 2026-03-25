import { Flex, Typography } from 'antd'
import { background } from '@/shared/common/design-token'

interface WrapperTitleProps {
  label: React.ReactNode
  formComponent: React.ReactNode
}

export default function WrapperFormTitle({
  label,
  formComponent,
}: WrapperTitleProps) {
  return (
    <Flex vertical flex={1}>
      <Typography
        style={{
          fontSize: 28,
          fontWeight: 700,
          marginBottom: 12,
        }}
      >
        {label}
      </Typography>

      <Flex
        vertical
        gap={16}
        style={{
          width: '100%',
          background: background.elevated,
          padding: 24,
          borderRadius: 8,
        }}
      >
        {formComponent}
      </Flex>
    </Flex>
  )
}
