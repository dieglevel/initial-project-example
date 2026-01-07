import { Link, createFileRoute } from '@tanstack/react-router'
import { Flex, Typography } from 'antd'

export const Route = createFileRoute('/401')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <Flex
      align="center"
      justify="center"
      style={{ height: '100vh', flexDirection: 'column' }}
    >
      <Typography.Title>Page not found</Typography.Title>
      <Typography.Text>404</Typography.Text>
      <Link to={'/'}>
        <Typography.Link>Go back to Home</Typography.Link>
      </Link>
    </Flex>
  )
}
