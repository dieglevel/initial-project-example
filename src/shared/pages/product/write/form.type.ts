import type {
  BagType,
  ColorCodeEnum,
  ProductAvailabilityEnum,
  ProductStatusEnum,
  ProductTagEnum,
  Product_TypeEnum,
  ShirtSizeEnum,
  StepTypeEnum,
} from '@/shared/api/product/product.type'
import type { WriteItemProps } from '@/shared/components/form/write-item'
import type { UploadFile } from 'antd'

export interface BagOption {
  type: BagType
  name: string
  image: Array<UploadFile<File>>
}

export interface BagConfigData {
  label: string
  options: Array<BagOption>
}

export interface ShirtColorOption {
  colorCode: ColorCodeEnum
  name: string
  code: string
  image: Array<UploadFile<File>>
}

export interface ShirtConfigData {
  label: string
  sizes: ShirtSizeEnum
  colors: Array<ShirtColorOption>
}

export interface LetterConfigData {
  title: string
  maxLength: number
  placeholder: string
  isEditTitle: boolean
  isHaveDate: boolean
  thumbnail?: Array<UploadFile<File>>
  frontOfLetter?: Array<UploadFile<File>>
  backOfLetter?: Array<UploadFile<File>>
}

export interface PhotoBoothConfigData {
  label: string
  allowAll: boolean
  specificThemeIds?: Array<number>
}

export interface BagConfig {
  id?: number
  stepType: StepTypeEnum.BAG
  extraPrice: number
  configData: BagConfigData
}

export interface ShirtConfig {
  id?: number
  stepType: StepTypeEnum.SHIRT
  extraPrice: number
  configData: ShirtConfigData
}

export interface LetterConfig {
  id?: number
  stepType: StepTypeEnum.LETTER
  extraPrice: number
  configData: LetterConfigData
}

export interface PhotoBoothConfig {
  id?: number
  stepType: StepTypeEnum.PHOTOBOOTH
  extraPrice: number
  configData: PhotoBoothConfigData
}

export type Configs = BagConfig | ShirtConfig | LetterConfig | PhotoBoothConfig

export interface ProductFormItems {
  name: string
  alias: string
  summary: string
  content: string
  price: number
  compareAtPrice: number
  vendor: string
  type: Product_TypeEnum
  thumbnail?: Array<UploadFile<File>>
  images?: Array<UploadFile<File>>
  inventoryQuantity: number

  status: ProductStatusEnum
  availability: ProductAvailabilityEnum
  tag: ProductTagEnum

  configs: Array<Configs>
}

export type WriteItemFormProps = WriteItemProps<
  React.ElementType,
  ProductFormItems
>

export type ConfigsWriteItemFormRow = WriteItemProps<React.ElementType, Configs>
