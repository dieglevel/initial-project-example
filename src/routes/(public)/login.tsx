import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { Button, Card, Flex, Form, Input } from 'antd'
import useApp from 'antd/es/app/useApp'
import { useForm } from 'antd/es/form/Form'
import { useState } from 'react'
import type { WriteItemProps } from '@/shared/components/WriteItem'
import type { SignInDto } from '@/api'
import type { IUser } from '@/shared/auth/auth.type'
import WriteItem from '@/shared/components/WriteItem'
import { useAuthStore } from '@/shared/store/auth.store'
import { useAuthControllerSignIn } from '@/api'
import { AuthTokenService } from '@/shared/auth/authToken.service'

type SignInField = WriteItemProps<React.ElementType, SignInDto>
export const Route = createFileRoute('/(public)/login')({
  component: RouteComponent,
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState()

    if (isAuthenticated) {
      throw redirect({
        to: '/dashboard',
      })
    }
  },
})

function RouteComponent() {
  const router = useRouter()
  const [form] = useForm<SignInDto>()
  const [isLoading, setIsLoading] = useState(false)
  const { mutate } = useAuthControllerSignIn()
  const { message } = useApp()

  const field: Array<SignInField> = [
    {
      form: {
        label: 'Identifier',
        name: 'identifier',
        rules: [{ required: true, message: 'Please input your identifier!' }],
      },
      component: Input,
      componentProps: {
        placeholder: 'Username or Email',
      },
    } as WriteItemProps<typeof Input, SignInDto>,
    {
      form: {
        label: 'Password',
        name: 'password',
        rules: [{ required: true, message: 'Please input your password!' }],
      },
      component: Input.Password,
      componentProps: {},
    } as WriteItemProps<typeof Input.Password, SignInDto>,
  ]

  const handleLogin = (values: SignInDto) => {
    setIsLoading(true)
    try {
      mutate(
        {
          data: values,
        },
        {
          onSuccess(data) {
            const response = data.data

            message.success('Login successful')

            AuthTokenService.setTokens(
              response.accessToken,
              response.refreshToken,
              response.user as IUser,
            )

            router.navigate({
              to: '/dashboard',
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
          {field.map((item, index) => (
            <WriteItem key={index} {...item} />
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
