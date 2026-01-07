import { createFileRoute } from '@tanstack/react-router'
import { Flex, Typography } from 'antd'

export const Route = createFileRoute('/404')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <Flex>
      <Typography>403 - You do not have access to this page.</Typography>
    </Flex>
  )
}
