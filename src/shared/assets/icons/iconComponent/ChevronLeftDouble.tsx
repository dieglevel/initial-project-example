import Icon from '@ant-design/icons'
import type { CustomIconComponentProps } from '@ant-design/icons/lib/components/Icon'

const ChevronLeftDoubleSvg = () => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M18 17L13 12L18 7M11 17L6 12L11 7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const IconChevronLeftDouble = (
  props: Partial<CustomIconComponentProps>,
) => <Icon component={ChevronLeftDoubleSvg} {...props} />
