import type { WriteItemProps } from '@/shared/components/form/write-item'
import type { UploadFile } from 'antd/es/upload/interface'

export interface PhotoboothFormItems {
  name: string
  previewImage?: Array<UploadFile<File>>
  slotsCount: number
  slots: Array<{
    id: number
    x: number
    y: number
    width: number
    height: number
  }>
}

export type WriteItemFormProps = WriteItemProps<
  React.ElementType,
  PhotoboothFormItems
>

export type ConfigsWriteItemFormRow = WriteItemProps<
  React.ElementType,
  PhotoboothFormItems
>
