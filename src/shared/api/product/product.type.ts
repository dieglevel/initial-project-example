import type { ApiBasePage } from '../baseResponse'

export interface GetProductsResponse {
  content: Array<Product>
  page: ApiBasePage
}
export interface Product {
  id: number
  isCustomizable: boolean
  name: string
  alias: string
  vendor: string
  productType: string
  status: string
  tag: string
  type: string
  vatPitCategoryCode: string
  summary: null
  templateLayout: string
  metaTitle: null
  metaDescription: null
  publishedOn: null
  content: string
  createdOn: string
  modifiedOn: string
  image: Image
  variants: Array<VariantsItem>
  options: Array<OptionsItem>
  images: Array<ImagesItem>
  thumbnail: string
  inventoryQuantity: number
  availability: string
}
export interface Image {
  id: number
  src: string
  filename: string
  position: number
  size: number
  width: number
  height: number
  variantIds: Array<unknown>
}

export interface VariantsItem {
  id: number
  title: string
  sku: string
  barcode: string
  price: number
  compareAtPrice: number
  inventoryQuantity: number
  inventoryPolicy: string
  inventoryManagement: string
  taxable: boolean
  requiresShipping: boolean
  weightUnit: string
  weight: number
  grams: number
  unit: null
  inventoryItemId: number
  imageId: null
  option1: string
  option2: null
  option3: null
  position: number
}

export interface OptionsItem {
  id: number
  name: string
  position: number
  values: Array<string>
}

export interface ImagesItem {
  id: number
  src: string
  filename: string
  position: number
  size: number
  width: number
  height: number
  variantIds: Array<unknown>
}

export enum ProductStatusEnum {
  active = 'active',
  archived = 'archived',
  draft = 'draft',
}

export const ProductStatusMapper: Record<
  keyof typeof ProductStatusEnum,
  string
> = {
  active: 'Đang hiển thị ít nhất 1 kênh',
  archived: 'Đã bị ẩn khỏi tất cả kênh',
  draft: 'Chưa được hiển thị trên kênh nào',
}

export enum ProductAvailabilityEnum {
  IN_STOCK = 'IN_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  PREORDER = 'PREORDER',
  BACKORDER = 'BACKORDER',
  DISCONTINUED = 'DISCONTINUED',
}

export const ProductAvailabilityMapper: Record<
  keyof typeof ProductAvailabilityEnum,
  string
> = {
  IN_STOCK: 'Còn hàng',
  OUT_OF_STOCK: 'Hết hàng',
  PREORDER: 'Đặt trước',
  BACKORDER: 'Hàng về sau',
  DISCONTINUED: 'Ngừng kinh doanh',
}

export enum ProductTagEnum {
  lasted = 'lasted',
  sale = 'sale',
  popular = 'popular',
  limited = 'limited',
  exclusive = 'exclusive',
  best_seller = 'best_seller',
  non_tags = 'non_tags',
}

export const ProductTagMapper: Record<keyof typeof ProductTagEnum, string> = {
  lasted: 'Mới nhất',
  sale: 'Giảm giá',
  popular: 'Phổ biến',
  limited: 'Giới hạn',
  exclusive: 'Độc quyền',
  best_seller: 'Bán chạy',
  non_tags: 'Không có tag',
}

// Params filter
export enum Product_TypeEnum {
  normal = 'normal',
  combo = 'combo',
  pack_size = 'pack_size',
}

export const Product_TypeMapper: Record<keyof typeof Product_TypeEnum, string> =
  {
    normal: 'Bình thường',
    combo: 'Combo',
    pack_size: 'Đóng gói',
  }

export const IsCustomizableProductMapper: Record<string, string> = {
  true: 'Customizable',
  false: 'Normal',
}

export enum BagType {
  ONE_SHIRT = 'ONE_SHIRT',
  TWO_SHIRT = 'TWO_SHIRT',
}

export const BagTypeMapper: Record<keyof typeof BagType, string> = {
  ONE_SHIRT: '1 Áo',
  TWO_SHIRT: '2 Áo',
}

export enum StepTypeEnum {
  BAG = 'BAG',
  SHIRT = 'SHIRT',
  LETTER = 'LETTER',
  PHOTOBOOTH = 'PHOTOBOOTH',
}

export const StepTypeMapper: Record<keyof typeof StepTypeEnum, string> = {
  BAG: 'Áo gói',
  SHIRT: 'Áo',
  LETTER: 'Thư',
  PHOTOBOOTH: 'Photobooth',
}

export enum ShirtSizeEnum {
  S = 'S',
  M = 'M',
  L = 'L',
  XL = 'XL',
  XXL = 'XXL',
}

export const ShirtSizeMapper: Record<keyof typeof ShirtSizeEnum, string> = {
  S: 'S',
  M: 'M',
  L: 'L',
  XL: 'XL',
  XXL: 'XXL',
}

export enum ColorCodeEnum {
  WHITE = 'WHITE',
  BLACK = 'BLACK',
  RED = 'RED',
  BLUE = 'BLUE',
  YELLOW = 'YELLOW',
  GREEN = 'GREEN',
  GRAY = 'GRAY',
}

export const ColorCodeMapper: Record<keyof typeof ColorCodeEnum, string> = {
  WHITE: 'Trắng Basic',
  BLACK: 'Đen Minimal',
  RED: 'Đỏ',
  BLUE: 'Xanh dương',
  YELLOW: 'Vàng',
  GREEN: 'Xanh lá',
  GRAY: 'Xám',
}

export const ColorCodeToHexMapper: Record<keyof typeof ColorCodeEnum, string> =
  {
    WHITE: '#FFFFFF',
    BLACK: '#000000',
    RED: '#FF0000',
    BLUE: '#0000FF',
    YELLOW: '#FFFF00',
    GREEN: '#008000',
    GRAY: '#808080',
  }
