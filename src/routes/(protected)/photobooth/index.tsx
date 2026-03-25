import { createFileRoute } from '@tanstack/react-router'
import PhotoboothListPage from '@/shared/pages/photobooth/list'

export const Route = createFileRoute('/(protected)/photobooth/')({
  component: RouteComponent,
  context: () => ({
    breadcrumb: undefined,
  }),
})

function RouteComponent() {
  return <PhotoboothListPage />
}
