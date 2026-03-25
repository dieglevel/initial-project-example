import type { Tag } from 'antd'
import type { ComponentProps } from 'react'

export const enumToColor = <T extends string>(
  colorMap: Record<T, unknown>,
  value: unknown,
): ComponentProps<typeof Tag>['color'] => {
  if (typeof value !== 'string') {
    return 'default'
  }

  return value in colorMap
    ? (colorMap[value as T] as ComponentProps<typeof Tag>['color'])
    : 'default'
}
