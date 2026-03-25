import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { Button, Flex } from 'antd'

import { createContext, useMemo } from 'react'
import { useForm } from 'antd/es/form/Form'
import { ReloadOutlined } from '@ant-design/icons'
import type { FormInstance } from 'antd'
import type { RightTopBarProps } from '@/shared/components/layout/top-bar'
import type { PhotoboothFormItems } from '@/shared/pages/photobooth/list/form.type'
import { usePageType } from '@/shared/hooks/use-page-type'
import { queryClient } from '@/shared/lib/query-client'
import TopBar from '@/shared/components/layout/top-bar'

export const Route = createFileRoute('/(protected)/order')({
  component: RouteComponent,

  beforeLoad: ({ location }) => {
    if (location.pathname === '/order') {
      throw redirect({
        to: '/order/list',
      })
    }
  },
})

export const FormContext = createContext<
  FormInstance<PhotoboothFormItems> | undefined
>(undefined)

function RouteComponent() {
  const [form] = useForm<PhotoboothFormItems>()

  const { isWritePage, isListPage, isViewPage, location } = usePageType()

  const handleReload = () => {
    if (isWritePage) {
    } else if (isListPage) {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    } else if (isViewPage) {
    }
  }

  const rightComponents = useMemo((): Array<RightTopBarProps> => {
    return [
      {
        isShow: true,
        component: <Button icon={<ReloadOutlined />} onClick={handleReload} />,
      },
    ]
  }, [location])

  return (
    <FormContext.Provider value={form}>
      <Flex
        vertical
        style={{ height: '100%', minHeight: '100vh', maxHeight: '100vh' }}
        flex={1}
      >
        <TopBar rightComponent={rightComponents} />
        <Flex vertical flex={1} gap={8}>
          <Outlet />
        </Flex>
      </Flex>
    </FormContext.Provider>
  )
}
