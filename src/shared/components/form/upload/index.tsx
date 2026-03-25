import { Button, Flex, Image, Upload } from 'antd'
import { DeleteOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import FormUploadItem from './item'
import type { UploadFile, UploadProps } from 'antd'
import './index.css'

export interface FormUploadProps extends UploadProps<File> {
  styleItem?: React.CSSProperties
}

export default function FormUpload({
  fileList = [],
  ...props
}: FormUploadProps) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState<Array<string>>([])
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0)
  const [thumbnailImage, setThumbnailImage] = useState<string>()

  useEffect(() => {
    if (props.maxCount === 1 && fileList.length > 0) {
      const file = fileList[0]

      if (file.originFileObj) {
        getBase64(file.originFileObj).then(setThumbnailImage)
      } else {
        setThumbnailImage(file.url)
      }
    }
  }, [fileList, props.maxCount])

  const handleOnPreview = async (fileChoice: UploadFile<File>) => {
    const srcList = await Promise.all(
      fileList.map((f) => {
        if (f.originFileObj && f.type?.startsWith('image/')) {
          return getBase64(f.originFileObj)
        }
        return f.url || ''
      }),
    )
    setCurrentPreviewIndex(fileList.indexOf(fileChoice))
    setPreviewImage(srcList)
    setPreviewOpen(true)
  }

  return (
    <>
      <Upload<File>
        style={{
          width: '100%',
          display: 'flex',
        }}
        styles={{
          trigger: {
            width: '100%',
          },
        }}
        // customRequest={({ file: _file, onSuccess }) => {
        //   onSuccess?.({}, new XMLHttpRequest())
        // }}
        beforeUpload={() => false}
        fileList={fileList}
        onPreview={handleOnPreview}
        itemRender={(originNode, file, uploadFileList, action) => {
          if (props.maxCount === 1 && uploadFileList.length >= 1) {
            return (
              <div className="form-upload-thumbnail" style={props.styleItem}>
                <Image src={thumbnailImage} />
                <Flex
                  className="form-upload-actions"
                  justify="center"
                  gap={8}
                  style={{
                    position: 'absolute',
                    bottom: 8,
                    left: 0,
                    right: 0,
                  }}
                >
                  <Button onClick={action.preview} icon={<EyeOutlined />} />
                  <Button onClick={action.remove} icon={<DeleteOutlined />} />
                </Flex>
              </div>
            )
          }
          return (
            <FormUploadItem
              originNode={originNode}
              file={file}
              uploadFileList={uploadFileList}
              action={action}
            />
          )
        }}
        {...props}
      >
        {!(props.maxCount === 1 && fileList.length >= 1) && (
          <Button icon={<PlusOutlined />} style={{ width: '100%' }}>
            Upload
          </Button>
        )}
      </Upload>

      <Image.PreviewGroup
        items={[...previewImage]}
        preview={{
          current: currentPreviewIndex,
          onChange(current) {
            setCurrentPreviewIndex(current)
          },
          open: previewOpen,
          onOpenChange: (open) => setPreviewOpen(open),
        }}
      />
    </>
  )
}

function getBase64(file?: File) {
  if (!file) return Promise.reject(new Error('No file provided'))

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}
