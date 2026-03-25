import type { MessageInstance } from 'antd/es/message/interface'

let messageInstance: MessageInstance

export const setMessageInstance = (instance: MessageInstance) => {
  messageInstance = instance
}

export const getMessageInstance = () => messageInstance
