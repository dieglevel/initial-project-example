import type { UploadFile } from 'antd/es/upload/interface'

interface Props<T> {
  originNode: React.ReactNode
  file: UploadFile<T>
  uploadFileList: Array<UploadFile<T>>
  action: {
    preview: () => void
    remove: () => void
    download: () => void
  }
}

export default function FormUploadItem(props: Props<any>) {
  return <div>{props.originNode}</div>
}
