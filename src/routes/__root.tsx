import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'

import { Spin } from 'antd'
import type { QueryClient } from '@tanstack/react-query'
import { SpinGlobal } from '@/shared/components/spin-global'
import NotFound from '@/shared/pages/_global/notFound'

interface MyRouterContext {
  queryClient: QueryClient
  breadcrumb?: string
}

Spin.setDefaultIndicator(SpinGlobal)

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => (
    <>
      <Outlet />
      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'Tanstack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
          {
            name: 'Tanstack Query',
            render: <ReactQueryDevtoolsPanel />,
          },
        ]}
      />
    </>
  ),
  notFoundComponent: () => <NotFound />,
})
