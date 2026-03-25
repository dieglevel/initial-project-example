import type {
  FinancialStatusEnum,
  FulfillmentStatusEnum,
  OrderStatusEnum,
} from './order.type'
import { useMutationPut } from '@/shared/lib/mutation/useMutation'

interface UpdateStatusOrderRequest {
  status?: OrderStatusEnum
  financialStatus?: FinancialStatusEnum
  fulfillmentStatus?: FulfillmentStatusEnum
}

export const useMutationOrder = () => {
  const mUpdateStatusOrder = useMutationPut<
    void,
    UpdateStatusOrderRequest,
    '/admin/orders/:id/status',
    {
      id: string
    }
  >({
    endPoint: '/admin/orders/:id/status',
    queryKey: ['updateStatusOrder'],
  })

  return { mUpdateStatusOrder }
}
