import {
  Outlet,
  createFileRoute,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import { Button, Flex } from 'antd'

import { createContext, useMemo } from 'react'
import { useForm } from 'antd/es/form/Form'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import type { FormInstance } from 'antd'
import type { ProductFormItems } from '@/shared/pages/product/write/form.type'
import type { RightTopBarProps } from '@/shared/components/layout/top-bar'
import { usePageType } from '@/shared/hooks/use-page-type'
import { queryClient } from '@/shared/lib/query-client'
import TopBar from '@/shared/components/layout/top-bar'

export const Route = createFileRoute('/(protected)/product/list')({
  component: RouteComponent,
  beforeLoad: ({ location }) => {
    if (location.pathname === '/product/list') {
      throw redirect({
        to: '/product/list/$subList',
        params: { subList: 'all' },
      })
    }
  },
})

export const FormContext = createContext<
  FormInstance<ProductFormItems> | undefined
>(undefined)

function RouteComponent() {
  const navigate = useNavigate()

  const [form] = useForm<ProductFormItems>()

  const { isWritePage, isListPage, isViewPage, location } = usePageType()

  const handleReload = () => {
    if (isWritePage) {
    } else if (isListPage) {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
    } else if (isViewPage) {
    }
  }

  const rightComponents = useMemo((): Array<RightTopBarProps> => {
    return [
      {
        isShow: isListPage,
        component: <Button icon={<ReloadOutlined />} onClick={handleReload} />,
      },
      {
        isShow: !isWritePage,
        component: (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              navigate({
                to: '/product/list/$subList/write/$id',
                params: { subList: 'all', id: 'new' },
              })
            }}
          />
        ),
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
