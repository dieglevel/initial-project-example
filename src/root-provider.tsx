import { QueryClientProvider } from '@tanstack/react-query'
import { App, ConfigProvider } from 'antd'
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
    <QueryClientProvider client={queryClient}>
      <App>
        <ConfigProvider {...configAntd}>{children}</ConfigProvider>
      </App>
    </QueryClientProvider>
  )
}
