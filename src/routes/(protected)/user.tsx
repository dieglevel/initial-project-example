import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(protected)/user')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(protected)/user"!</div>
}
