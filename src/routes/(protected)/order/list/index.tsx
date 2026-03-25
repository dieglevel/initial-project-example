import { createFileRoute } from '@tanstack/react-router'
import OrderListPage from '@/shared/pages/order/list'

export const Route = createFileRoute('/(protected)/order/list/')({
  component: RouteComponent,
  context: () => ({
    breadcrumb: undefined,
  }),
})

function RouteComponent() {
  return <OrderListPage />
}
