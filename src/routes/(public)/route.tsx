import { Outlet, createFileRoute } from '@tanstack/react-router'
import EmptyLayout from '@/shared/components/layout/empty-layout'

export const Route = createFileRoute('/(public)')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <EmptyLayout>
      <Outlet />
    </EmptyLayout>
  )
}
