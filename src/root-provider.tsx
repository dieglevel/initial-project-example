import { QueryClientProvider } from '@tanstack/react-query'
import { App, ConfigProvider } from 'antd'
import { AntdProvider } from './shared/provider/antd-provider'
import type { ConfigProviderProps } from 'antd'
import type { QueryClient } from '@tanstack/react-query'

export function Provider({
  children,
  queryClient,
  configAntd,
}: {
  children: React.ReactNode
  queryClient: QueryClient
  configAntd: ConfigProviderProps
}) {
  return (
    <App>
      <ConfigProvider {...configAntd}>
        <QueryClientProvider client={queryClient}>
          <AntdProvider>{children}</AntdProvider>
        </QueryClientProvider>
      </ConfigProvider>
    </App>
  )
}
