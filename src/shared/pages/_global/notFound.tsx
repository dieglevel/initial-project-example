import { useNavigate } from '@tanstack/react-router'
import { Button, Flex, Typography } from 'antd'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <Flex vertical justify="center" align="center" style={{ height: '100vh' }}>
      <Typography.Title>Page Not Found</Typography.Title>
      <Button onClick={() => navigate({ to: '/dashboard' })}>Go Home</Button>
    </Flex>
  )
}
