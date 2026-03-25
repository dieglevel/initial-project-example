import { Checkbox, Flex, Form, Input, InputNumber, Space } from 'antd'
import SectionHeader from './section-header'
import type { ConfigSectionProps } from '../type/index.type'
import FormLabel from '@/shared/components/form/label'
import FormUpload from '@/shared/components/form/upload'
import {
  getValueFromEvent,
  getValuePropsUploadFileList,
} from '@/shared/utils/helper/other'

export default function LetterSection({ field }: ConfigSectionProps) {
  return (
    <>
      <SectionHeader title="Cấu hình thư" />
      <Space vertical size={20} style={{ width: '100%' }}>
        <Form.Item
          name={[field.name, 'configData', 'title']}
          label={<FormLabel label="Tiêu đề" />}
          rules={[{ required: true, message: 'Tiêu đề là bắt buộc' }]}
        >
          <Input placeholder="Gửi lời chúc của bạn" />
        </Form.Item>

        <Form.Item
          name={[field.name, 'configData', 'maxLength']}
          label={<FormLabel label="Chiều dài tối đa" />}
          rules={[{ required: true, message: 'Chiều dài tối đa là bắt buộc' }]}
        >
          <InputNumber min={1} style={{ width: '100%' }} placeholder="250" />
        </Form.Item>

        <Form.Item
          name={[field.name, 'configData', 'content']}
          label={<FormLabel label={'Lời nhắn'} />}
          rules={[{ required: true, message: 'Lời nhắn là bắt buộc' }]}
        >
          <Input placeholder="Nhập lời nhắn tại đây..." />
        </Form.Item>

        <Flex gap={8} align="center">
          <Form.Item
            name={[field.name, 'configData', 'isEditTitle']}
            valuePropName="checked"
            initialValue={false}
          >
            <Checkbox>Cho phép sửa tiêu đề</Checkbox>
          </Form.Item>

          <Form.Item
            name={[field.name, 'configData', 'isHaveDate']}
            valuePropName="checked"
            initialValue={false}
          >
            <Checkbox>Hiển thị ngày</Checkbox>
          </Form.Item>
        </Flex>

        <Flex gap={16}>
          <Form.Item
            valuePropName="fileList"
            getValueFromEvent={getValueFromEvent}
            getValueProps={(value) => {
              return {
                fileList: getValuePropsUploadFileList(value),
              }
            }}
            name={[field.name, 'configData', 'thumbnail']}
            label={<FormLabel label="Thumbnail" />}
            style={{ flex: 1 }}
          >
            <FormUpload
              maxCount={1}
              multiple={false}
              listType="picture"
              accept={'image/*'}
              styleItem={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            valuePropName="fileList"
            getValueFromEvent={getValueFromEvent}
            getValueProps={(value) => {
              return {
                fileList: getValuePropsUploadFileList(value),
              }
            }}
            name={[field.name, 'configData', 'frontOfLetter']}
            label={<FormLabel label="Mặt trước tờ thư" />}
            style={{ flex: 1 }}
          >
            <FormUpload
              maxCount={1}
              multiple={false}
              listType="picture"
              accept={'image/*'}
              styleItem={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            valuePropName="fileList"
            getValueFromEvent={getValueFromEvent}
            getValueProps={(value) => {
              return {
                fileList: getValuePropsUploadFileList(value),
              }
            }}
            name={[field.name, 'configData', 'backOfLetter']}
            label={<FormLabel label="Mặt sau tờ thư" />}
            style={{ flex: 1 }}
          >
            <FormUpload
              maxCount={1}
              multiple={false}
              listType="picture"
              accept={'image/*'}
              styleItem={{ width: '100%' }}
            />
          </Form.Item>
        </Flex>
      </Space>
    </>
  )
}
