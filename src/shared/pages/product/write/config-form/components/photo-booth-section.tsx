import {
  Card,
  Checkbox,
  Flex,
  Form,
  Image,
  Input,
  Space,
  Typography,
} from 'antd'
import { useContext } from 'react'
import SectionHeader from './section-header'
import type { CheckboxChangeEvent } from 'antd/es/checkbox'
import type { ConfigSectionProps } from '../type/index.type'
import type { GetPhotoboothThemeResponse } from '@/shared/api/photobooth/useGetListPhotobooth'
import { useGetListPhotobooth } from '@/shared/api/photobooth/useGetListPhotobooth'
import { FormContext } from '@/routes/(protected)/product/list/route'
import FormLabel from '@/shared/components/form/label'

export default function PhotoBoothSection({ field }: ConfigSectionProps) {
  const form = useContext(FormContext)
  const { data } = useGetListPhotobooth()
  const photoboothThemes: Array<GetPhotoboothThemeResponse> = data?.data ?? []

  const handleThemeSelectionChange = (selectedThemeIds: Array<number>) => {
    // If all themes are selected, automatically check "Allow All"
    if (
      selectedThemeIds.length === photoboothThemes.length &&
      photoboothThemes.length > 0
    ) {
      form?.setFieldValue(
        ['configs', field.name, 'configData', 'allowAll'],
        true,
      )
    }
  }

  const handleAllowAllChange = (e: CheckboxChangeEvent): void => {
    if (e.target.checked) {
      // If checked, select all themes
      const allThemeIds = photoboothThemes.map((theme) => theme.id)
      form?.setFieldValue(
        ['configs', field.name, 'configData', 'specificThemeIds'],
        allThemeIds,
      )
    } else {
      // If unchecked, clear the selected themes
      form?.setFieldValue(
        ['configs', field.name, 'configData', 'specificThemeIds'],
        [],
      )
    }
  }

  return (
    <>
      <SectionHeader title="Tuỳ chỉnh Photobooth" />
      <Space vertical size={20} style={{ width: '100%' }}>
        <Form.Item
          name={[field.name, 'configData', 'label']}
          label={<FormLabel label={'Tên tuỳ chọn'} />}
          rules={[{ required: true, message: 'Tên tuỳ chọn là bắt buộc' }]}
        >
          <Input placeholder="Khung ảnh kỷ niệm" />
        </Form.Item>

        <Form.Item
          name={[field.name, 'configData', 'allowAll']}
          valuePropName="checked"
        >
          <Checkbox onChange={handleAllowAllChange}>Cho phép tất cả</Checkbox>
        </Form.Item>

        <Form.Item noStyle shouldUpdate={() => true}>
          {({ getFieldValue }) => {
            const allowAll = getFieldValue([
              'configs',
              field.name,
              'configData',
              'allowAll',
            ])
            return (
              <>
                <Form.Item
                  label={<FormLabel label={'Chọn hình nền'} />}
                  name={[field.name, 'configData', 'specificThemeIds']}
                >
                  <Checkbox.Group
                    style={{ width: '100%' }}
                    onChange={handleThemeSelectionChange}
                    disabled={allowAll}
                  >
                    <Flex gap={16}>
                      {photoboothThemes.map((theme) => (
                        <Checkbox
                          key={theme.id}
                          value={theme.id}
                          style={{ width: '100%' }}
                          disabled={allowAll}
                        >
                          <Flex gap={12} align="center">
                            <Card>
                              <Image
                                src={theme.previewImage}
                                width={120}
                                style={{ objectFit: 'cover', borderRadius: 8 }}
                                alt={theme.name}
                                preview
                              />
                              <Flex vertical gap={4} align="center">
                                <Typography.Text>{theme.name}</Typography.Text>
                                <Flex
                                  style={{ width: '100%' }}
                                  gap={4}
                                  align="center"
                                  justify="space-between"
                                >
                                  <Typography.Text type="secondary">
                                    Số slot
                                  </Typography.Text>{' '}
                                  <Typography.Text type="secondary">
                                    {theme.slotsCount}
                                  </Typography.Text>
                                </Flex>
                              </Flex>
                            </Card>
                          </Flex>
                        </Checkbox>
                      ))}
                    </Flex>
                  </Checkbox.Group>
                </Form.Item>
              </>
            )
          }}
        </Form.Item>
      </Space>
    </>
  )
}
