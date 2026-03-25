import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Card, Divider, Flex, Form, Input, Space } from 'antd'
import SectionHeader from './section-header'
import type { ConfigSectionProps } from '../type/index.type'
import { BagType, BagTypeMapper } from '@/shared/api/product/product.type'
import FormLabel from '@/shared/components/form/label'
import Select from '@/shared/components/select'
import { enumToOptionsWithCustomLabel } from '@/shared/utils/helper/enum-to-option'
import {
  getValueFromEvent,
  getValuePropsUploadFileList,
} from '@/shared/utils/helper/other'
import FormUpload from '@/shared/components/form/upload'

export default function BagSection({ field }: ConfigSectionProps) {
  return (
    <>
      <Form.Item
        name={[field.name, 'configData', 'label']}
        label={<FormLabel label="Tiêu đề" />}
        rules={[{ required: true, message: 'Tiêu đề là bắt buộc' }]}
      >
        <Input placeholder="Chọn loại túi" />
      </Form.Item>

      <Divider />

      <SectionHeader title="Tuỳ chọn" />
      <Form.List name={[field.name, 'configData', 'options']}>
        {(optionFields, { add: addOption, remove: removeOption }) => (
          <Space vertical size={12} style={{ width: '100%' }}>
            {optionFields.map((opt) => (
              <Card
                key={opt.key}
                size="small"
                style={{
                  borderRadius: 12,
                  background: '#fafafa',
                }}
              >
                <Flex gap={12} align="center">
                  <Form.Item
                    name={[opt.name, 'type']}
                    style={{ flex: 1, marginBottom: 0 }}
                    rules={[{ required: true, message: 'Loại là bắt buộc' }]}
                  >
                    <Select
                      placeholder="Chọn loại áo gói"
                      options={enumToOptionsWithCustomLabel(
                        BagType,
                        (value) => BagTypeMapper[value],
                      )}
                    />
                  </Form.Item>

                  <Form.Item
                    name={[opt.name, 'name']}
                    style={{ flex: 1, marginBottom: 0 }}
                    rules={[{ required: true, message: 'Name is required' }]}
                  >
                    <Input placeholder="Túi đơn (1 áo)" />
                  </Form.Item>

                  <Form.Item
                    name={[opt.name, 'image']}
                    style={{ flex: 1, marginBottom: 0 }}
                    rules={[{ required: true, message: 'Image is required' }]}
                    valuePropName="fileList"
                    getValueFromEvent={getValueFromEvent}
                    getValueProps={(value) => {
                      return {
                        fileList: getValuePropsUploadFileList(value),
                      }
                    }}
                  >
                    <FormUpload
                      maxCount={1}
                      multiple={false}
                      listType="picture"
                      accept={'image/*'}
                      styleItem={{ width: '30%' }}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>

                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeOption(opt.name)}
                  />
                </Flex>
              </Card>
            ))}

            <Button
              type="dashed"
              block
              icon={<PlusOutlined />}
              onClick={() => addOption()}
            >
              Thêm tuỳ chọn
            </Button>
          </Space>
        )}
      </Form.List>
    </>
  )
}
