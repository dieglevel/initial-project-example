import { createFileRoute } from '@tanstack/react-router'
import ProductWritePage from '@/shared/pages/product/write'

export const Route = createFileRoute(
  '/(protected)/product/list/$subList/write/$id',
)({
  component: RouteComponent,
  context: ({ params }) => {
    const { id } = params

    if (id === 'new') {
      return {
        breadcrumb: 'Tạo mới',
      }
    }
    return {
      breadcrumb: 'Cập nhật',
    }
  },
})

function RouteComponent() {
  return <ProductWritePage />
}
