import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(protected)/order/list')({
  component: RouteComponent,
  context: () => ({
    breadcrumb: 'Danh sách đơn hàng',
  }),
})

function RouteComponent() {
  return <Outlet />
}
