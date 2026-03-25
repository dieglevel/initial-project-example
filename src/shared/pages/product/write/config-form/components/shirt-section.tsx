import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import {
  Button,
  Card,
  ColorPicker,
  Divider,
  Flex,
  Form,
  Input,
  Space,
} from 'antd'
import { useContext } from 'react'
import SectionHeader from './section-header'
import type { ConfigSectionProps } from '../type/index.type'
import { FormContext } from '@/routes/(protected)/product/list/route'
import {
  ColorCodeEnum,
  ColorCodeMapper,
  ColorCodeToHexMapper,
  ShirtSizeEnum,
  ShirtSizeMapper,
} from '@/shared/api/product/product.type'
import FormLabel from '@/shared/components/form/label'
import Select from '@/shared/components/select'
import { enumToOptionsWithCustomLabel } from '@/shared/utils/helper/enum-to-option'
import FormUpload from '@/shared/components/form/upload'
import {
  getValueFromEvent,
  getValuePropsUploadFileList,
} from '@/shared/utils/helper/other'

export default function ShirtSection({ field }: ConfigSectionProps) {
  const writeFormContext = useContext(FormContext)

  const formApi = writeFormContext as any
  const selectedColors = Form.useWatch(
    ['configs', field.name, 'configData', 'colors'],
    writeFormContext,
  ) as Array<{ colorCode?: keyof typeof ColorCodeEnum }> | undefined

  const selectedColorCodes = (selectedColors ?? [])
    .map((item) => item.colorCode)
    .filter((item): item is keyof typeof ColorCodeEnum => Boolean(item))

  return (
    <>
      <Form.Item
        name={[field.name, 'configData', 'label']}
        label={<FormLabel label="Tên tuỳ chọn" />}
        rules={[{ required: true, message: 'Tên tuỳ chọn là bắt buộc' }]}
      >
        <Input placeholder="Tùy chọn áo thun" />
      </Form.Item>

      <Divider />

      <Form.Item
        name={[field.name, 'configData', 'sizes']}
        label={<FormLabel label="Kích cỡ" />}
        rules={[{ required: true, message: 'Kích cỡ là bắt buộc' }]}
      >
        <Select
          placeholder="Chọn kích cỡ"
          options={enumToOptionsWithCustomLabel(
            ShirtSizeEnum,
            (value) => ShirtSizeMapper[value],
          )}
          mode="multiple"
        />
      </Form.Item>

      <Divider />

      <SectionHeader title="Màu sắc" />
      <Form.List name={[field.name, 'configData', 'colors']}>
        {(colorFields, { add: addColor, remove: removeColor }) => (
          <Space vertical size={12} style={{ width: '100%' }}>
            {colorFields.map((color) => {
              const currentColorCode = formApi?.getFieldValue([
                'configs',
                field.name,
                'configData',
                'colors',
                color.name,
                'name',
              ]) as keyof typeof ColorCodeEnum | undefined

              return (
                <Card
                  key={color.key}
                  size="small"
                  style={{
                    borderRadius: 12,
                    background: '#fafafa',
                  }}
                >
                  <Flex gap={12} align="center">
                    <Form.Item
                      name={[color.name, 'name']}
                      style={{ flex: 1, marginBottom: 0 }}
                      rules={[
                        { required: true, message: 'Mã màu là bắt buộc' },
                      ]}
                    >
                      <Select
                        placeholder="Chọn màu"
                        options={enumToOptionsWithCustomLabel(
                          ColorCodeEnum,
                          (value) => value,
                        ).map((option) => {
                          const optionValue =
                            option.value as keyof typeof ColorCodeEnum

                          return {
                            ...option,
                            disabled:
                              selectedColorCodes.includes(optionValue) &&
                              optionValue !== currentColorCode,
                          }
                        })}
                        onChange={(value: keyof typeof ColorCodeEnum) => {
                          const colorName = ColorCodeMapper[value]
                          const hexCode = ColorCodeToHexMapper[value]

                          formApi?.setFieldValue(
                            [
                              'configs',
                              field.name,
                              'configData',
                              'colors',
                              color.name,
                              'name',
                            ],
                            colorName,
                          )

                          formApi?.setFieldValue(
                            [
                              'configs',
                              field.name,
                              'configData',
                              'colors',
                              color.name,
                              'code',
                            ],
                            hexCode,
                          )
                        }}
                      />
                    </Form.Item>

                    <Form.Item
                      name={[color.name, 'code']}
                      style={{ flex: 1, marginBottom: 0 }}
                      getValueFromEvent={(selectedColor) =>
                        selectedColor?.toHexString?.()?.toUpperCase?.() ??
                        selectedColor
                      }
                      getValueProps={(value) => ({ value })}
                    >
                      <ColorPicker format="hex" showText disabled />
                    </Form.Item>

                    <Form.Item
                      valuePropName="fileList"
                      getValueFromEvent={getValueFromEvent}
                      getValueProps={(value) => {
                        return {
                          fileList: getValuePropsUploadFileList(value),
                        }
                      }}
                      name={[color.name, 'image']}
                      style={{ flex: 1, marginBottom: 0 }}
                      rules={[{ required: true, message: 'Ảnh là bắt buộc' }]}
                    >
                      <FormUpload
                        maxCount={1}
                        multiple={false}
                        listType="picture"
                        accept={'image/*'}
                        styleItem={{ width: '30%' }}
                      />
                    </Form.Item>

                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeColor(color.name)}
                    />
                  </Flex>
                </Card>
              )
            })}

            <Button
              type="dashed"
              block
              icon={<PlusOutlined />}
              onClick={() => addColor()}
            >
              Thêm màu sắc
            </Button>
          </Space>
        )}
      </Form.List>
    </>
  )
}
