import { Button, Flex, Form, Input, InputNumber, Spin, message } from 'antd'

import { useContext, useEffect, useState } from 'react'
import ConfigsFormProduct from './config-form/configs.form'
import type { UploadFile } from 'antd'
import type {
  BagConfig,
  BagConfigData,
  BagOption,
  Configs,
  LetterConfig,
  LetterConfigData,
  ProductFormItems,
  ShirtColorOption,
  ShirtConfig,
  ShirtConfigData,
  WriteItemFormProps,
} from './form.type'
import type { FormUploadProps } from '@/shared/components/form/upload'
import type { WriteItemProps } from '@/shared/components/form/write-item'
import Select from '@/shared/components/select'
import WriteItem from '@/shared/components/form/write-item'
import { enumToOptionsWithCustomLabel } from '@/shared/utils/helper/enum-to-option'
import {
  ProductAvailabilityEnum,
  ProductAvailabilityMapper,
  ProductStatusEnum,
  ProductStatusMapper,
  ProductTagEnum,
  ProductTagMapper,
  Product_TypeEnum,
  Product_TypeMapper,
} from '@/shared/api/product/product.type'
import FormUpload from '@/shared/components/form/upload'
import { baseForm } from '@/shared/common/form'
import WrapperFormTitle from '@/shared/components/form/write-item/wrapper-form-title'
import { FormContext } from '@/routes/(protected)/product/list/route'
import FormLabel from '@/shared/components/form/label'
import { Route } from '@/routes/(protected)/product/list/$subList/write.$id'
import { useGetDetailProduct } from '@/shared/api/product/useGetDetailProduct'
import {
  getValueFromEvent,
  getValuePropsUploadFileList,
} from '@/shared/utils/helper/other'
import { useMutationProduct } from '@/shared/api/product/mutation'
import {
  createProductFormData,
  updateConfigProductFormData,
  updateMainInformationProductFormData,
} from '@/shared/api/product/request.type'
import { formatVND, parserVND } from '@/shared/utils/helper/format-number'
import { useMutationUpload } from '@/shared/api/upload/mutation'
import { createUploadFormData } from '@/shared/api/upload/request.type'

export default function ProductWritePage() {
  const writeFormContext = useContext(FormContext)

  const { id } = Route.useParams()

  const { data, isFetching } = useGetDetailProduct({
    queryParams: { identifier: String(id) },
    options: {
      enabled: !!id && id !== 'new',
    },
  })

  const [isLoading, setIsLoading] = useState(false)

  const {
    mCreateProduct,
    mUpdateMainInformationProduct,
    mUpdateConfigProduct,
  } = useMutationProduct()

  const { mutateAsync: mutateAsyncCreate, isPending: isPendingCreate } =
    mCreateProduct
  const {
    mutateAsync: mutateAsyncUpdateMainInformation,
    isPending: isPendingUpdateMainInformation,
  } = mUpdateMainInformationProduct
  const {
    mutateAsync: mutateAsyncUpdateConfig,
    isPending: isPendingUpdateConfig,
  } = mUpdateConfigProduct

  const isPending =
    isPendingCreate ||
    isPendingUpdateMainInformation ||
    isPendingUpdateConfig ||
    isLoading

  const productInfoFields: Array<string> = [
    'name',
    'alias',
    'inventoryQuantity',
    'price',
    'compareAtPrice',
    'summary',
    'content',
    'thumbnail',
    'images',
    'status',
    'availability',
    'tag',
    'type',
  ]

  useEffect(() => {
    if (data?.data) {
      const product = data.data

      const productThumbnail = getValuePropsUploadFileList(product.thumbnail)
      const productImages = getValuePropsUploadFileList(product.images)

      const configsWithUploadFile: Array<Configs> = product.configs.map(
        (config) => {
          if (config.stepType === 'BAG') {
            const bagConfig = config as ProductFormItems['configs'][number] & {
              configData: BagConfigData & {
                options: Array<BagOption & { image: Array<UploadFile<File>> }>
              }
            }

            return {
              ...bagConfig,
              configData: {
                ...bagConfig.configData,
                options: bagConfig.configData.options.map((option) => ({
                  ...option,
                  image: getValuePropsUploadFileList(option.image),
                })),
              },
            } as BagConfig
          }

          if (config.stepType === 'SHIRT') {
            const shirtConfig =
              config as ProductFormItems['configs'][number] & {
                configData: ShirtConfigData & {
                  colors: Array<
                    ShirtColorOption & { image: Array<UploadFile<File>> }
                  >
                }
              }

            return {
              ...shirtConfig,
              configData: {
                ...shirtConfig.configData,
                colors: shirtConfig.configData.colors.map((color) => ({
                  ...color,
                  image: getValuePropsUploadFileList(color.image),
                })),
              },
            } as ShirtConfig
          }

          if (config.stepType === 'LETTER') {
            const letterConfig =
              config as ProductFormItems['configs'][number] & {
                configData: LetterConfigData & {
                  thumbnail: Array<UploadFile<File>>
                  frontOfLetter: Array<UploadFile<File>>
                  backOfLetter: Array<UploadFile<File>>
                }
              }

            return {
              ...letterConfig,
              configData: {
                ...letterConfig.configData,
                thumbnail: getValuePropsUploadFileList(
                  letterConfig.configData.thumbnail,
                ),
                frontOfLetter: getValuePropsUploadFileList(
                  letterConfig.configData.frontOfLetter,
                ),
                backOfLetter: getValuePropsUploadFileList(
                  letterConfig.configData.backOfLetter,
                ),
              },
            } as LetterConfig
          }

          return config
        },
      )

      writeFormContext?.setFieldsValue({
        name: product.name,
        alias: product.alias,
        inventoryQuantity: product.inventoryQuantity,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        summary: product.summary,
        content: product.content,
        type: product.type,
        status: product.status,
        availability: product.availability,
        tag: product.tag,
        configs: configsWithUploadFile,
        thumbnail: productThumbnail,
        images: productImages,
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
    } as WriteItemProps<typeof Input, ProductFormItems>,
    {
      key: 'alias',
      form: {
        name: 'alias',
        label: <FormLabel label="Alias" />,
        rules: [{ required: true, message: 'Alias không được để trống' }],
      },
      component: Input,
      componentProps: { placeholder: 'Nhập alias' },
    } as WriteItemProps<typeof Input, ProductFormItems>,
    {
      key: 'inventoryQuantity',
      form: {
        name: 'inventoryQuantity',
        label: <FormLabel label="Tồn kho" />,
        rules: [{ required: true, message: 'Nhập số lượng tồn' }],
      },
      component: InputNumber,
      componentProps: { placeholder: '0', min: 0, style: { width: '100%' } },
    } as WriteItemProps<typeof InputNumber, ProductFormItems>,
    {
      key: 'price',
      form: {
        name: 'price',
        label: <FormLabel label="Giá" />,
        rules: [{ required: true, message: 'Nhập giá sản phẩm' }],
      },
      component: InputNumber,
      componentProps: {
        placeholder: '0',
        min: 0,
        style: { width: '100%' },
        formatter: formatVND,
        parser: parserVND,
        suffix: '₫',
        stringMode: true,
      },
    } as WriteItemProps<typeof InputNumber, ProductFormItems>,
    {
      key: 'compareAtPrice',
      form: {
        name: 'compareAtPrice',
        label: <FormLabel label="Giá so sánh" />,
        rules: [{ required: true, message: 'Nhập giá so sánh' }],
      },
      component: InputNumber,
      componentProps: {
        placeholder: '0',
        min: 0,
        style: { width: '100%' },
        formatter: formatVND,
        parser: parserVND,
        suffix: '₫',
        stringMode: true,
      },
    } as WriteItemProps<typeof InputNumber, ProductFormItems>,
    {
      key: 'summary',
      form: {
        name: 'summary',
        label: <FormLabel label="Tóm tắt" />,
        rules: [{ required: true, message: 'Nhập tóm tắt sản phẩm' }],
      },
      component: Input.TextArea,
      componentProps: { rows: 3, placeholder: 'Tóm tắt ngắn' },
    } as WriteItemProps<typeof Input.TextArea, ProductFormItems>,
    {
      key: 'content',
      form: {
        name: 'content',
        label: <FormLabel label="Nội dung" />,
        rules: [{ required: true, message: 'Nhập nội dung sản phẩm' }],
      },
      component: Input.TextArea,
      componentProps: { rows: 5, placeholder: 'Nội dung chi tiết' },
    } as WriteItemProps<typeof Input.TextArea, ProductFormItems>,
    {
      key: 'configs',
      form: {
        name: 'configs',
        label: <FormLabel label="Cấu hình" />,
      },
      component: Input.TextArea,
      componentProps: { rows: 3, placeholder: 'Configs (JSON tạm thời)' },
    } as WriteItemProps<typeof Input.TextArea, ProductFormItems>,
    {
      key: 'thumbnail',
      form: {
        name: 'thumbnail',
        label: <FormLabel label="Thumbnail" />,
        valuePropName: 'fileList',
        getValueFromEvent: getValueFromEvent,
        getValueProps: (value) => {
          return {
            fileList: getValuePropsUploadFileList(value),
          }
        },
      },
      component: FormUpload,
      componentProps: {
        maxCount: 1,
        multiple: false,
        listType: 'picture',
        accept: 'image/*',
        styleItem: { width: 400, height: 'auto', objectFit: 'cover' },
      } as FormUploadProps,
    } as WriteItemProps<typeof FormUpload, ProductFormItems>,
    {
      key: 'images',
      form: {
        name: 'images',
        label: <FormLabel label="Images" />,
        valuePropName: 'fileList',
        getValueFromEvent: getValueFromEvent,
        getValueProps: (value) => {
          return {
            fileList: getValuePropsUploadFileList(value),
          }
        },
      },
      component: FormUpload,
      componentProps: {
        listType: 'picture',
        multiple: true,
        maxCount: 10,
        accept: 'image/*',
        children: 'Upload',
      } as FormUploadProps,
    } as WriteItemProps<typeof FormUpload, ProductFormItems>,
    {
      key: 'status',
      form: {
        name: 'status',
        label: <FormLabel label="Trạng thái hoạt động" />,
      },
      component: Select,
      componentProps: {
        options: enumToOptionsWithCustomLabel(
          ProductStatusEnum,
          (value) => ProductStatusMapper[value],
        ),
      },
    } as WriteItemProps<typeof Select, ProductFormItems>,
    {
      key: 'availability',
      form: {
        name: 'availability',
        label: <FormLabel label="Trạng thái hiển thị" />,
      },
      component: Select,
      componentProps: {
        options: enumToOptionsWithCustomLabel(
          ProductAvailabilityEnum,
          (value) => ProductAvailabilityMapper[value],
        ),
      },
    } as WriteItemProps<typeof Select, ProductFormItems>,
    {
      key: 'tag',
      form: {
        name: 'tag',
        label: <FormLabel label="Tag" />,
      },
      component: Select,
      componentProps: {
        options: enumToOptionsWithCustomLabel(
          ProductTagEnum,
          (value) => ProductTagMapper[value],
        ),
      },
    } as WriteItemProps<typeof Select, ProductFormItems>,
    {
      key: 'type',
      form: {
        name: 'type',
        label: <FormLabel label="Loại" />,
      },
      component: Select,
      componentProps: {
        options: enumToOptionsWithCustomLabel(
          Product_TypeEnum,
          (value) => Product_TypeMapper[value],
        ),
      },
    } as WriteItemProps<typeof Select, ProductFormItems>,
  ]

  const writeItemMap = Object.fromEntries(
    writeItems.map((item) => [item.key, item]),
  )

  const rows = [
    ['name', 'alias', 'inventoryQuantity'],
    ['price', 'compareAtPrice', 'type'],
    ['status', 'availability', 'tag'],
    ['summary'],
    ['content'],
    ['thumbnail', 'images'],
  ].map((rowKeys) => rowKeys.map((key) => writeItemMap[key]))

  const renderRow = (items: Array<WriteItemFormProps>) => (
    <Flex gap={16}>
      {items.map((item) => {
        // eslint-disable-next-line unused-imports/no-unused-vars
        const { key, ...rest } = item

        return (
          <div key={item.form.name} style={{ flex: 1 }}>
            <WriteItem
              {...rest}
              form={{
                ...rest.form,
              }}
            />
          </div>
        )
      })}
    </Flex>
  )

  const { mUploadRaw } = useMutationUpload()

  const submitCreateProduct = async (values: ProductFormItems) => {
    setIsLoading(true)
    const { thumbnail, images, configs, ...productValue } = values

    const uploadSingleImage = async (
      file: File | undefined,
    ): Promise<string | undefined> => {
      if (!file) return undefined

      const uploadResponse = await mUploadRaw.mutateAsync({
        body: createUploadFormData({ file }),
      })

      if (!uploadResponse.data) return undefined

      return uploadResponse.data
    }

    const getImageUrlFromFileList = (
      fileList?: Array<UploadFile<File>>,
    ): string | undefined => {
      const file = fileList?.[0]
      if (!file) return undefined

      return typeof file.url === 'string' ? file.url : undefined
    }

    const resolveImageUrl = async (
      fileList?: Array<UploadFile<File>>,
    ): Promise<string | undefined> => {
      const file = fileList?.[0]
      if (!file) return undefined

      const originFile = file.originFileObj as File | undefined
      if (originFile) {
        return uploadSingleImage(originFile)
      }

      return getImageUrlFromFileList(fileList)
    }

    // Duyet Configs de upload file va lay ket qua sau khi upload de dua vao payload
    const configUploadPromises = configs.map(async (config) => {
      if (config.stepType === 'BAG') {
        const bagConfig = config

        const options = await Promise.all(
          bagConfig.configData.options.map(async (option) => {
            return {
              ...option,
              image: await resolveImageUrl(option.image),
            }
          }),
        )

        return {
          ...bagConfig,
          configData: {
            ...bagConfig.configData,
            options,
          },
        }
      }

      if (config.stepType === 'SHIRT') {
        const shirtConfig = config

        const colors = await Promise.all(
          shirtConfig.configData.colors.map(async (color) => {
            return {
              ...color,
              image: await resolveImageUrl(color.image),
            }
          }),
        )

        return {
          ...shirtConfig,
          configData: {
            ...shirtConfig.configData,
            colors,
          },
        }
      }

      if (config.stepType !== 'LETTER') return config

      const letterConfig = config
      const [thumbnailUploaded, frontOfLetterUploaded, backOfLetterUploaded] =
        await Promise.all([
          resolveImageUrl(letterConfig.configData.thumbnail),
          resolveImageUrl(letterConfig.configData.frontOfLetter),
          resolveImageUrl(letterConfig.configData.backOfLetter),
        ])

      return {
        ...letterConfig,
        configData: {
          ...letterConfig.configData,
          thumbnail:
            thumbnailUploaded ??
            getImageUrlFromFileList(letterConfig.configData.thumbnail),
          frontOfLetter:
            frontOfLetterUploaded ??
            getImageUrlFromFileList(letterConfig.configData.frontOfLetter),
          backOfLetter:
            backOfLetterUploaded ??
            getImageUrlFromFileList(letterConfig.configData.backOfLetter),
        },
      }
    })

    const processedConfigs = await Promise.all(configUploadPromises)

    const productJson = JSON.stringify({
      ...productValue,
      configs: processedConfigs,
    })

    const payload = createProductFormData({
      product: productJson,
      thumbnail: thumbnail ? (thumbnail[0]?.originFileObj as File) : undefined,
      productImages: images
        ? (images
            .map((file) => file.originFileObj)
            .filter(Boolean) as Array<File>)
        : undefined,
    })

    console.log('Payload to submit:', productJson)

    await mutateAsyncCreate(
      {
        body: payload,
      },
      {
        onSuccess: () => {
          message.success('Tạo sản phẩm thành công')
        },
      },
    )
    setIsLoading(false)
  }

  const handleFinish = async (values: ProductFormItems) => {
    if (id === 'new') {
      await submitCreateProduct(values)
      return
    }

    await handleUpdateProductInfo()
  }

  const handleUpdateProductInfo = async () => {
    try {
      if (!id || id === 'new') {
        message.warning('Sản phẩm mới, vui lòng dùng nút Tạo mới')
        return
      }

      await writeFormContext?.validateFields(productInfoFields)
      const values = writeFormContext?.getFieldsValue(true) as ProductFormItems
      const {
        configs: _configs,
        thumbnail,
        images,
        ...mainInformation
      } = values

      const payload = updateMainInformationProductFormData({
        data: JSON.stringify(mainInformation),
        thumbnail: thumbnail
          ? (thumbnail[0]?.originFileObj as File)
          : undefined,
        newImages: images
          ? (images
              .map((file) => file.originFileObj)
              .filter(Boolean) as Array<File>)
          : undefined,
      })

      await mutateAsyncUpdateMainInformation(
        {
          body: payload,
          pathParams: {
            id: String(id),
          },
        },
        {
          onSuccess: () => {
            message.success('Cập nhật thông tin sản phẩm thành công')
          },
        },
      )
    } catch {
      // Validation errors are displayed by Ant Form.
    }
  }

  const handleUpdateSingleConfig = async (
    configIndex: number,
    stepType?: string,
  ) => {
    setIsLoading(true)
    try {
      if (!id || id === 'new') {
        message.warning('Sản phẩm mới, chưa thể cập nhật cấu hình riêng lẻ')
        return
      }

      await writeFormContext?.validateFields([['configs', configIndex]])
      const selectedConfig = writeFormContext?.getFieldValue([
        'configs',
        configIndex,
      ]) as ProductFormItems['configs'][number] | undefined

      if (!selectedConfig?.id) {
        message.error('Config chưa có id để cập nhật')
        return
      }

      const uploadSingleImage = async (
        file: File | undefined,
      ): Promise<string | undefined> => {
        if (!file) return undefined

        const uploadResponse = await mUploadRaw.mutateAsync({
          body: createUploadFormData({ file }),
        })

        return uploadResponse.data || undefined
      }

      const getImageUrlFromFileList = (
        fileList?: Array<UploadFile<File>>,
      ): string | undefined => {
        const file = fileList?.[0]
        if (!file) return undefined

        return typeof file.url === 'string' ? file.url : undefined
      }

      const resolveImageUrl = async (
        fileList?: Array<UploadFile<File>>,
      ): Promise<string | undefined> => {
        const file = fileList?.[0]
        if (!file) return undefined

        const originFile = file.originFileObj as File | undefined
        if (originFile) {
          return uploadSingleImage(originFile)
        }

        return getImageUrlFromFileList(fileList)
      }

      let normalizedConfig: unknown = selectedConfig

      if (selectedConfig.stepType === 'BAG') {
        const options = await Promise.all(
          selectedConfig.configData.options.map(async (option) => {
            return {
              ...option,
              image: await resolveImageUrl(option.image),
            }
          }),
        )

        normalizedConfig = {
          ...selectedConfig,
          configData: {
            ...selectedConfig.configData,
            options,
          },
        }
      }

      if (selectedConfig.stepType === 'SHIRT') {
        const colors = await Promise.all(
          selectedConfig.configData.colors.map(async (color) => {
            return {
              ...color,
              image: await resolveImageUrl(color.image),
            }
          }),
        )

        normalizedConfig = {
          ...selectedConfig,
          configData: {
            ...selectedConfig.configData,
            colors,
          },
        }
      }

      if (selectedConfig.stepType === 'LETTER') {
        const [thumbnail, frontOfLetter, backOfLetter] = await Promise.all([
          resolveImageUrl(selectedConfig.configData.thumbnail),
          resolveImageUrl(selectedConfig.configData.frontOfLetter),
          resolveImageUrl(selectedConfig.configData.backOfLetter),
        ])

        normalizedConfig = {
          ...selectedConfig,
          configData: {
            ...selectedConfig.configData,
            thumbnail,
            frontOfLetter,
            backOfLetter,
          },
        }
      }

      const payload = updateConfigProductFormData({
        data: JSON.stringify(normalizedConfig),
      })

      await mutateAsyncUpdateConfig(
        {
          body: payload,
          pathParams: {
            id: String(selectedConfig.id),
          },
        },
        {
          onSuccess: () => {
            message.success(
              stepType
                ? `Cập nhật cấu hình ${stepType} thành công`
                : 'Cập nhật cấu hình sản phẩm thành công',
            )
          },
        },
      )
    } catch {
      // Validation errors are displayed by Ant Form.
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Spin spinning={isFetching}>
      <Form
        form={writeFormContext}
        layout="inline"
        style={{ padding: '0px 12px', paddingBottom: 24 }}
        onFinish={handleFinish}
        initialValues={{
          status: ProductStatusEnum.archived,
          tag: ProductTagEnum.non_tags,
          type: Product_TypeEnum.combo,
        }}
        {...baseForm}
      >
        <Flex flex={1} gap={16} vertical>
          <WrapperFormTitle
            label="Thông tin sản phẩm"
            formComponent={
              <>
                {rows.map((row, index) => (
                  <div key={index}>{renderRow(row)}</div>
                ))}

                <Flex justify="flex-end">
                  <Button
                    type="primary"
                    htmlType="button"
                    loading={isPending}
                    onClick={handleUpdateProductInfo}
                  >
                    Cập nhật thông tin sản phẩm
                  </Button>
                </Flex>
              </>
            }
          />

          <WrapperFormTitle
            label="Cấu hình sản phẩm"
            formComponent={
              <ConfigsFormProduct onUpdateConfig={handleUpdateSingleConfig} />
            }
          />
          <Flex justify="center" style={{ marginTop: 24 }}>
            <Button type="primary" htmlType="submit" loading={isPending}>
              {data ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </Flex>
        </Flex>
      </Form>
    </Spin>
  )
}
