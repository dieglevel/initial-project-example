import { createFileRoute } from '@tanstack/react-router'
import OrderViewPage from '@/shared/pages/order/view'

export const Route = createFileRoute('/(protected)/order/list/view/$id')({
  component: RouteComponent,
  context: () => ({
    breadcrumb: 'Chi tiết đơn hàng',
  }),
})

function RouteComponent() {
  return <OrderViewPage />
}
