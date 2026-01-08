import { createFileRoute, redirect } from '@tanstack/react-router'
import { Button, Card, Flex, Form, Input } from 'antd'
import { useForm } from 'antd/es/form/Form'
import { useState } from 'react'
import useApp from 'antd/es/app/useApp'
import type { WriteItemProps } from '@/shared/components/WriteItem'
import type { SignInDto } from '@/api'
import { useAuthControllerSignIn, useProfileControllerMe } from '@/api'
import WriteItem from '@/shared/components/WriteItem'
import { useAuthStore } from '@/shared/auth/auth.store'

type SignInField = WriteItemProps<React.ElementType, SignInDto>
export const Route = createFileRoute('/(public)/login')({
  component: RouteComponent,
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState()

    if (isAuthenticated) {
      throw redirect({
        to: '/dashboard',
        search: {
          redirect: location.href,
        },
      })
    }
  },
})

function RouteComponent() {
  const [form] = useForm<SignInDto>()
  const [isLoading, setIsLoading] = useState(false)
  const { mutate } = useAuthControllerSignIn()
  const { message } = useApp()
  // const { data: userData, refetch } = useProfileControllerMe()

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
          onSuccess(data, variables, onMutateResult, context) {
            const response = data.data
            redirect({
              to: '/dashboard',
              search: {
                redirect: location.href,
              },
            })
            console.log('Login successful', response)

            // message.success('Login successful')

            // const user = userData!.data

            // useAuthStore
            //   .getState()
            //   .setAuth(user, response.accessToken, response.refreshToken)
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
