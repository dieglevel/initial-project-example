import type { PresetStatusColorType } from 'antd/es/_util/colors'
import type { ApiBasePage } from '../baseResponse'
import type { PresetColorType } from 'antd/es/theme/internal'
import type { LiteralUnion } from 'antd/es/_util/type'

export interface GetOrdersResponse {
  content: Array<Order>
  page: ApiBasePage
}

export type GetOrderDetailResponse = Order

export interface ShippingAddress {
  firstName: string
  lastName: string
  phone: string
  email: string
  address1: string
  address2: string
  province: string
  provinceCode: string
  district: string
  districtCode: string
  ward: string
  wardCode: string
  country: string
  countryCode: string
  zip: null
}

export interface OrderItem {
  customizable: boolean
  customizationImageUrls: Array<string> | null
  customizationSummary: string
  id: number
  imageUrl: string
  name: string
  price: number
  quantity: number
  sku: string
  totalPrice: number
}

export interface Order {
  createdOn: string
  customerEmail: string
  customerName: string
  customerPhone: string
  finalAmount: number
  financialStatus: FinancialStatusEnum
  fulfillmentStatus: FulfillmentStatusEnum
  id: number
  items: Array<OrderItem>
  note: string
  orderNumber: string
  paymentMethod: string
  paymentProofImage: string | null
  shippingAddress: ShippingAddress
  status: OrderStatusEnum
  totalDiscounts: number
  totalPrice: number
  totalTax: number
}

export enum OrderStatusEnum {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  CANCELED = 'CANCELED',
}

export const OrderStatusLabel: Record<OrderStatusEnum, string> = {
  [OrderStatusEnum.OPEN]: 'OPEN',
  [OrderStatusEnum.CLOSED]: 'CLOSED',
  [OrderStatusEnum.CANCELED]: 'CANCELED',
}

export const OrderStatusColor: Record<
  OrderStatusEnum,
  LiteralUnion<PresetColorType | PresetStatusColorType>
> = {
  [OrderStatusEnum.OPEN]: 'green',
  [OrderStatusEnum.CLOSED]: 'blue',
  [OrderStatusEnum.CANCELED]: 'red',
}

export enum FinancialStatusEnum {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  VOIDED = 'VOIDED',
  AUTHORIZED = 'AUTHORIZED',
}

export const FinancialStatusLabel: Record<FinancialStatusEnum, string> = {
  [FinancialStatusEnum.PENDING]: 'Chờ thanh toán',
  [FinancialStatusEnum.PAID]: 'Đã thanh toán',
  [FinancialStatusEnum.PARTIALLY_PAID]: 'Thanh toán một phần',
  [FinancialStatusEnum.REFUNDED]: 'Đã hoàn tiền',
  [FinancialStatusEnum.PARTIALLY_REFUNDED]: 'Hoàn tiền một phần',
  [FinancialStatusEnum.VOIDED]: 'Bỏ qua',
  [FinancialStatusEnum.AUTHORIZED]: 'Được ủy quyền',
}

export const FiniancialStatusColor: Record<
  FinancialStatusEnum,
  LiteralUnion<PresetColorType | PresetStatusColorType>
> = {
  [FinancialStatusEnum.PENDING]: 'orange',
  [FinancialStatusEnum.PAID]: 'green',
  [FinancialStatusEnum.PARTIALLY_PAID]: 'yellow',
  [FinancialStatusEnum.REFUNDED]: 'blue',
  [FinancialStatusEnum.PARTIALLY_REFUNDED]: 'cyan',
  [FinancialStatusEnum.VOIDED]: 'red',
  [FinancialStatusEnum.AUTHORIZED]: 'purple',
}

export enum FulfillmentStatusEnum {
  NULL = 'NULL',
  PARTIAL = 'PARTIAL',
  FULFILLED = 'FULFILLED',
  RESTOCKED = 'RESTOCKED',
  NOT_ELIGIBLE = 'NOT_ELIGIBLE',
}

export const FulfillmentStatusLabel: Record<FulfillmentStatusEnum, string> = {
  [FulfillmentStatusEnum.NULL]: 'Chưa xử lý',
  [FulfillmentStatusEnum.PARTIAL]: 'Xử lý một phần',
  [FulfillmentStatusEnum.FULFILLED]: 'Đã xử lý',
  [FulfillmentStatusEnum.RESTOCKED]: 'Đã hoàn hàng',
  [FulfillmentStatusEnum.NOT_ELIGIBLE]: 'Không đủ điều kiện',
}

export const FulfillmentStatusColor: Record<
  FulfillmentStatusEnum,
  LiteralUnion<PresetColorType | PresetStatusColorType>
> = {
  [FulfillmentStatusEnum.NULL]: 'orange',
  [FulfillmentStatusEnum.PARTIAL]: 'yellow',
  [FulfillmentStatusEnum.FULFILLED]: 'green',
  [FulfillmentStatusEnum.RESTOCKED]: 'blue',
  [FulfillmentStatusEnum.NOT_ELIGIBLE]: 'red',
}
