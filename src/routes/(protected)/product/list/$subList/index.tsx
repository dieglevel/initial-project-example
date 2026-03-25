import { createFileRoute } from '@tanstack/react-router'
import ProductListPage from '@/shared/pages/product/list'

export const Route = createFileRoute('/(protected)/product/list/$subList/')({
  component: RouteComponent,
  context: () => ({
    breadcrumb: undefined,
  }),
})

function RouteComponent() {
  return <ProductListPage />
}
