/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import type { InputNumberProps } from 'antd'

export const formatVND: InputNumberProps<number>['formatter'] = (value) => {
  if (value === undefined || value === null) return ''

  return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export const parserVND: InputNumberProps<number>['parser'] = (value) =>
  Number(value?.replace(/[^\d]/g, '') || 0)

export const formatVNDValue = (value: number | undefined) => {
  if (value === undefined) return ''
  return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
}
