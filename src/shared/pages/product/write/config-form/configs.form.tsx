import {
  Button,
  Card,
  Divider,
  Flex,
  Form,
  InputNumber,
  Space,
  Typography,
} from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { useState } from 'react'
import BagSection from './components/bag-section'
import ShirtSection from './components/shirt-section'
import LetterSection from './components/letter-section'
import PhotoBoothSection from './components/photo-booth-section'
import { enumToOptionsWithCustomLabel } from '@/shared/utils/helper/enum-to-option'
import { StepTypeEnum, StepTypeMapper } from '@/shared/api/product/product.type'
import Select from '@/shared/components/select'
import FormLabel from '@/shared/components/form/label'
import { formatVND, parserVND } from '@/shared/utils/helper/format-number'
import { Route } from '@/routes/(protected)/product/list/$subList/write.$id'

const { Title } = Typography

interface ConfigsFormProductProps {
  onUpdateConfig?: (
    configIndex: number,
    stepType?: StepTypeEnum,
  ) => Promise<void> | void
}

function getValueFromStepType(stepType?: StepTypeEnum) {
  if (!stepType) return null

  return StepTypeMapper[stepType]
}

export default function ConfigsFormProduct({
  onUpdateConfig,
}: ConfigsFormProductProps) {
  const { id } = Route.useParams()
  const isUpdatePage = id !== 'new'
  const [updatingConfigIndex, setUpdatingConfigIndex] = useState<number | null>(
    null,
  )

  const handleUpdateClick = async (
    configIndex: number,
    stepType?: StepTypeEnum,
  ) => {
    if (!onUpdateConfig) return

    setUpdatingConfigIndex(configIndex)
    try {
      await onUpdateConfig(configIndex, stepType)
    } finally {
      setUpdatingConfigIndex(null)
    }
  }

  return (
    <Form.List name="configs">
      {(fields, { add, remove }) => (
        <Space vertical size={24} style={{ width: '100%' }}>
          {fields.map((field, index) => (
            <Card
              key={field.key}
              style={{
                borderRadius: 16,
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              }}
              title={
                <Flex justify="space-between" align="center">
                  <Title level={5} style={{ margin: 0 }}>
                    Món quà #{index + 1}
                  </Title>

                  <Button
                    danger
                    type="text"
                    icon={<DeleteOutlined />}
                    onClick={() => remove(field.name)}
                  />
                </Flex>
              }
            >
              <Form.Item name={[field.name, 'id']} hidden>
                <InputNumber />
              </Form.Item>

              {/* Basic Info */}
              <Space vertical size={20} style={{ width: '100%' }}>
                <Flex gap={16}>
                  <Form.Item
                    name={[field.name, 'stepType']}
                    label={<FormLabel label="Món quà" />}
                    style={{ flex: 1 }}
                  >
                    <Select
                      placeholder="Chọn loại quà"
                      disabled={isUpdatePage}
                      options={enumToOptionsWithCustomLabel(
                        StepTypeEnum,
                        (value) => StepTypeMapper[value],
                      )}
                    />
                  </Form.Item>

                  <Form.Item
                    name={[field.name, 'extraPrice']}
                    label={<FormLabel label="Phí thêm" />}
                    style={{ flex: 1 }}
                  >
                    <InputNumber
                      min={0}
                      style={{ width: '100%' }}
                      placeholder="0"
                      formatter={formatVND}
                      parser={parserVND}
                      suffix="₫"
                    />
                  </Form.Item>
                </Flex>
              </Space>

              <Form.Item noStyle shouldUpdate={() => true}>
                {({ getFieldValue }) => {
                  const stepType = getFieldValue([
                    'configs',
                    field.name,
                    'stepType',
                  ]) as StepTypeEnum | undefined

                  const stepTypeLabel = getValueFromStepType(stepType)

                  return (
                    <>
                      <Divider />
                      {stepType === StepTypeEnum.BAG && (
                        <BagSection field={field} />
                      )}
                      {stepType === StepTypeEnum.SHIRT && (
                        <ShirtSection field={field} />
                      )}
                      {stepType === StepTypeEnum.LETTER && (
                        <LetterSection field={field} />
                      )}
                      {stepType === StepTypeEnum.PHOTOBOOTH && (
                        <PhotoBoothSection field={field} />
                      )}

                      {isUpdatePage && stepTypeLabel && (
                        <Flex justify="flex-end" style={{ marginTop: 20 }}>
                          <Button
                            type="primary"
                            htmlType="button"
                            loading={updatingConfigIndex === field.name}
                            onClick={() =>
                              void handleUpdateClick(field.name, stepType)
                            }
                          >
                            Cập nhật {stepTypeLabel}
                          </Button>
                        </Flex>
                      )}
                    </>
                  )
                }}
              </Form.Item>
            </Card>
          ))}

          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => add()}
          >
            Thêm quà
          </Button>
        </Space>
      )}
    </Form.List>
  )
}
