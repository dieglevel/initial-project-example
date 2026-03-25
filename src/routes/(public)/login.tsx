import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { Button, Card, Flex, Form, Input } from 'antd'
import useApp from 'antd/es/app/useApp'
import { useForm } from 'antd/es/form/Form'
import { useState } from 'react'
import type { WriteItemProps } from '@/shared/components/form/write-item'
import type { LoginRequest } from '@/shared/api/auth/index.type'
import WriteItem from '@/shared/components/form/write-item'
import { useAuthStore } from '@/shared/store/auth.store'
import { AuthTokenService } from '@/shared/auth/authToken.service'
import { useMutationAuth } from '@/shared/api/auth/mutation'
import { UserRoleEnum } from '@/shared/auth/auth.type'

export const Route = createFileRoute('/(public)/login')({
  component: RouteComponent,
  beforeLoad: () => {
    const loadToken = AuthTokenService.loadTokens()

    useAuthStore.setState({
      accessToken: loadToken?.accessToken || null,
      refreshToken: loadToken?.refreshToken || null,
      user: loadToken?.user || null,
      isAuthenticated: !!loadToken,
    })

    const { isAuthenticated } = useAuthStore.getState()

    if (isAuthenticated) {
      throw redirect({
        to: '/dashboard',
      })
    }
  },
})

type LoginField = WriteItemProps<React.ElementType, LoginRequest>

function RouteComponent() {
  const router = useRouter()
  const [form] = useForm<LoginRequest>()
  const [isLoading, setIsLoading] = useState(false)
  const { mLogin } = useMutationAuth()
  const { message } = useApp()

  const field: Array<LoginField> = [
    {
      form: {
        label: 'Email',
        name: 'email',
        rules: [{ required: true, message: 'Please input your email!' }],
      },
      component: Input,
      componentProps: {
        placeholder: 'Email',
      },
    } as WriteItemProps<typeof Input, LoginRequest>,
    {
      form: {
        label: 'Password',
        name: 'password',
        rules: [{ required: true, message: 'Please input your password!' }],
      },
      component: Input.Password,
      componentProps: {},
    } as WriteItemProps<typeof Input.Password, LoginRequest>,
  ]

  const handleLogin = (values: LoginRequest) => {
    setIsLoading(true)
    try {
      mLogin.mutate(
        {
          body: {
            email: values.email,
            password: values.password,
          },
        },
        {
          onSuccess(data) {
            const response = data.data

            if (response.user.role === UserRoleEnum.CUSTOMER) {
              message.error(
                'You do not have permission to access this application.',
              )
              return
            }

            message.success('Login successful')

            AuthTokenService.setTokens(
              response.accessToken,
              response.refreshToken,
              response.user,
            )

            router.navigate({
              to: '/dashboard',
              replace: true,
            })
          },
        },
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Flex
      justify="center"
      align="center"
      style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}
    >
      <Card title="Login" style={{ width: 400 }}>
        <Form layout="vertical" form={form} onFinish={handleLogin}>
          {field.map((item) => (
            <WriteItem key={item.form.name} {...item} />
          ))}
          <Form.Item>
            <Button
              htmlType="submit"
              type="primary"
              style={{
                width: '100%',
              }}
              loading={isLoading}
            >
              Login
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </Flex>
  )
}
