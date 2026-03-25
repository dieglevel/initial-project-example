import { Flex } from 'antd'
import type { FormProps } from 'antd'

const customizeRequiredMark = (
  label: React.ReactNode,
  { required }: { required: boolean },
) => (
  <Flex gap={4}>
    {label}
    {required && <span style={{ color: 'red' }}>*</span>}
  </Flex>
)

export const baseForm: FormProps = {
  styles: {
    label: {
      minWidth: 110,
    },
  },
  requiredMark: customizeRequiredMark,
  labelAlign: 'left',
  scrollToFirstError: {
    behavior: 'smooth',
    block: 'center',
    inline: 'center',
  },
}
