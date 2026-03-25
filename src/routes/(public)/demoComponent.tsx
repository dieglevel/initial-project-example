import { Button, Flex, Form } from 'antd'
import { createFileRoute } from '@tanstack/react-router'
import { useForm, useWatch } from 'antd/es/form/Form'
import axios from 'axios'
import Pagination from '@/shared/components/pagination'
import Select from '@/shared/components/select'
import {
  getValueFromEvent,
  getValuePropsUploadFileList,
} from '@/shared/utils/helper/other'
import FormUpload from '@/shared/components/form/upload'

export const Route = createFileRoute('/(public)/demoComponent')({
  component: RouteComponent,
})

function RouteComponent() {
  const [form] = useForm()
  const watch = useWatch({ form })

  const handleUpload = async () => {
    const uploadValue = form.getFieldValue('upload')

    console.log('Upload value:', watch)

    const formData = new FormData()

    uploadValue?.forEach((file: any) => {
      if (file.originFileObj) {
        formData.append('files', file.originFileObj)
      }
    })

    const res = await axios.post('https://httpbin.org/post', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    console.log(res.data)
  }

  return (
    <Flex vertical gap={'large'}>
      <Pagination total={100} />
      <Select />

      <Form form={form}>
        <Form.Item
          name="upload"
          label="Upload"
          valuePropName="fileList"
          getValueFromEvent={getValueFromEvent}
          getValueProps={(value) => {
            return {
              fileList: getValuePropsUploadFileList(value),
            }
          }}
        >
          <FormUpload multiple></FormUpload>
        </Form.Item>

        <Button onClick={handleUpload}>Upload</Button>
      </Form>
    </Flex>
  )
}
