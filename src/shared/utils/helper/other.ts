import type { UploadFile } from 'antd'

// make it a UploadFile[] if value is string or string[]
export function getValuePropsUploadFileList(
  value?: string | Array<string> | Array<UploadFile<File>>,
): Array<UploadFile<File>> {
  if (!value) return []

  // case: string
  if (typeof value === 'string') {
    return [
      {
        uid: 'image-url-0',
        name: 'image-1.jpg',
        status: 'done',
        url: value,
      },
    ]
  }

  // case: string[]
  if (Array.isArray(value) && typeof value[0] === 'string') {
    return (value as Array<string>).map((url, index) => ({
      uid: `image-url-${index}`,
      name: `image-${index + 1}.jpg`,
      status: 'done',
      url,
    }))
  }

  // case: UploadFile[]
  return value as Array<UploadFile<File>>
}

// Using for normFile of Form.Item when value is Upload component's fileList
export const getValueFromEvent = (e: any) => {
  if (Array.isArray(e)) return e
  return e?.fileList ?? []
}
