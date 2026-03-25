import { Select as AntdSelect } from 'antd'
import type { SelectProps } from 'antd'
import { IconChevronDown } from '@/shared/assets/icons'

export interface Props extends SelectProps {}
export default function Select(props: Props) {
  return <AntdSelect suffixIcon={<IconChevronDown />} {...props} />
}
