import { App } from 'antd'
import { setMessageInstance } from '../utils/message-instance'

export function AntdProvider({ children }: { children: React.ReactNode }) {
  const { message } = App.useApp()

  setMessageInstance(message)

  return children
}
