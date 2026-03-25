import { Button, Flex, Form, Input, InputNumber, Spin } from 'antd'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'

import { useContext, useEffect } from 'react'
import useApp from 'antd/es/app/useApp'
import type { PhotoboothFormItems, WriteItemFormProps } from './form.type'
import type { WriteItemProps } from '@/shared/components/form/write-item'
import type { Photobooth } from '@/shared/api/photobooth/photobooth.type'
import type { UploadFile } from 'antd/es/upload/interface'
import { baseForm } from '@/shared/common/form'
import WriteItem from '@/shared/components/form/write-item'
import FormLabel from '@/shared/components/form/label'
import { FormContext } from '@/routes/(protected)/photobooth/route'
import {
  getValueFromEvent,
  getValuePropsUploadFileList,
} from '@/shared/utils/helper/other'
import FormUpload from '@/shared/components/form/upload'
import { useMutationPhotobooth } from '@/shared/api/photobooth/mutation'
import { createPhotoboothFormData } from '@/shared/api/photobooth/request.type'
import { queryClient } from '@/shared/lib/query-client'

interface Props {
  data?: Photobooth | null
  onCancel: () => void
}

export default function PhotoboothForm({ data, onCancel }: Props) {
  const writeFormContext = useContext(FormContext)
  const { message } = useApp()

  const { mCreatePhotobooth, mUpdatePhotobooth } = useMutationPhotobooth()

  const { mutateAsync, isPending } = mCreatePhotobooth
  const { mutateAsync: mutateAsyncUpdate, isPending: isPendingUpdate } =
    mUpdatePhotobooth

  useEffect(() => {
    if (data) {
      const previewImageFileList: Array<UploadFile<File>> =
        getValuePropsUploadFileList(data.previewImage)

      writeFormContext?.setFieldsValue({
        name: data.name,
        previewImage: previewImageFileList,
        slotsCount: data.slotsCount,
        slots: data.slots,
      })
    } else {
      writeFormContext?.resetFields()
    }
  }, [data])

  const writeItems: Array<WriteItemFormProps> = [
    {
      key: 'name',
      form: {
        name: 'name',
        label: <FormLabel label="Tên" />,
        rules: [{ required: true, message: 'Tên không được để trống' }],
      },
      component: Input,
      componentProps: { placeholder: 'Nhập tên sản phẩm' },
    } as WriteItemProps<typeof Input, PhotoboothFormItems>,
    {
      key: 'slotsCount',
      form: {
        name: 'slotsCount',
        label: <FormLabel label="Số lượng slot" />,
      },
      component: InputNumber,
      componentProps: {
        placeholder: 'Nhập số lượng slot',
        style: { width: '100%' },
      },
    } as WriteItemProps<typeof InputNumber, PhotoboothFormItems>,
    {
      key: 'previewImage',
      form: {
        name: 'previewImage',
        label: <FormLabel label="Ảnh xem trước" />,
        valuePropName: 'fileList',
        getValueFromEvent: getValueFromEvent,
        getValueProps: (value) => {
          return {
            fileList: getValuePropsUploadFileList(value),
          }
        },
        rules: [{ required: true, message: 'Ảnh xem trước là bắt buộc' }],
      },
      component: FormUpload,
      componentProps: {
        placeholder: 'Nhập tên sản phẩm',
        styleItem: { width: '100%' },
        styles: {
          list: {
            width: '40%',
            justifySelf: 'center',
          },
          root: {
            justifyContent: 'center',
            display: 'flex',
            flexDirection: 'column',
          },
        },
        maxCount: 1,
        multiple: false,
        listType: 'picture',
        accept: 'image/*',
      },
    } as WriteItemProps<typeof FormUpload, PhotoboothFormItems>,
  ]

  const handleOnCancel = () => {
    writeFormContext?.resetFields()
    onCancel()
  }

  const handleFinish = async (values: PhotoboothFormItems) => {
    const { previewImage, ...restValues } = values

    const dataJson = JSON.stringify({
      ...restValues,
    })

    const formData: FormData = createPhotoboothFormData({
      data: dataJson,
      image: previewImage
        ? (previewImage[0]?.originFileObj as File)
        : undefined,
    })

    try {
      if (data) {
        await mutateAsyncUpdate(
          {
            body: formData,
            pathParams: {
              id: data.id,
            },
          },
          {
            onSuccess: () => {
              message.success('Cập nhật photobooth thành công')
            },
          },
        )
      } else {
        await mutateAsync(
          {
            body: formData,
          },
          {
            onSuccess: () => {
              message.success('Tạo photobooth thành công')
            },
          },
        )
      }
    } catch (error) {
      console.error(error)
      throw error
    } finally {
      queryClient.invalidateQueries({ queryKey: ['admin-photobooth-themes'] })
    }
  }

  return (
    <Spin spinning={false} style={{ width: '100%' }}>
      <Form
        form={writeFormContext}
        layout="vertical"
        style={{ padding: '0px 12px', paddingBottom: 24 }}
        onFinish={handleFinish}
        {...baseForm}
      >
        <Flex flex={1} vertical>
          {writeItems.map((item) => (
            <WriteItem {...item} key={item.key} />
          ))}
          <Form.List name="slots">
            {(fields, { add, remove }) => (
              <>
                <FormLabel label="Slots" />
                {fields.map(({ key, name, ...restField }) => (
                  <Flex
                    key={key}
                    gap={8}
                    align="flex-start"
                    style={{ marginBottom: 8 }}
                  >
                    <Form.Item
                      {...restField}
                      name={[name, 'x']}
                      label={<FormLabel label="X" />}
                      rules={[{ required: true, message: 'Nhập X' }]}
                      style={{ flex: 1, marginBottom: 0 }}
                    >
                      <InputNumber placeholder="X" style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'y']}
                      label={<FormLabel label="Y" />}
                      rules={[{ required: true, message: 'Nhập Y' }]}
                      style={{ flex: 1, marginBottom: 0 }}
                    >
                      <InputNumber placeholder="Y" style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'width']}
                      label={<FormLabel label="Width" />}
                      rules={[{ required: true, message: 'Nhập Width' }]}
                      style={{ flex: 1, marginBottom: 0 }}
                    >
                      <InputNumber
                        placeholder="Width"
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'height']}
                      label={<FormLabel label="Height" />}
                      rules={[{ required: true, message: 'Nhập Height' }]}
                      style={{ flex: 1, marginBottom: 0 }}
                    >
                      <InputNumber
                        placeholder="Height"
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                    <MinusCircleOutlined
                      onClick={() => remove(name)}
                      style={{
                        color: 'red',
                        fontSize: 18,
                        flexShrink: 0,
                        marginTop: 32,
                      }}
                    />
                  </Flex>
                ))}
                <Button
                  type="dashed"
                  onClick={() => {
                    const currentSlots: Array<{ id?: number }> =
                      writeFormContext?.getFieldValue('slots') ?? []
                    const nextId =
                      currentSlots.length > 0
                        ? Math.max(
                            ...currentSlots.map((slot) => slot.id ?? 0),
                          ) + 1
                        : 1

                    add({
                      id: nextId,
                      x: undefined,
                      y: undefined,
                      width: undefined,
                      height: undefined,
                    })
                  }}
                  icon={<PlusOutlined />}
                  style={{ width: '100%', marginBottom: 16 }}
                >
                  Thêm slot
                </Button>
              </>
            )}
          </Form.List>
          <Flex justify="center" gap={16} style={{ marginTop: 24 }}>
            <Button
              onClick={handleOnCancel}
              disabled={isPending || isPendingUpdate}
            >
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isPending || isPendingUpdate}
            >
              {data ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </Flex>
        </Flex>
      </Form>
    </Spin>
  )
}
