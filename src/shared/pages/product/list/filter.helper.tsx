import { InputNumber } from 'antd'
import type { WriteItemProps } from '@/shared/components/form/write-item'
import type { GetListProductParams } from '@/shared/api/product/useGetListProduct'
import { enumToOptionsWithCustomLabel } from '@/shared/utils/helper/enum-to-option'
import {
  ProductStatusEnum,
  ProductStatusMapper,
} from '@/shared/api/product/product.type'
import { formatVND, parserVND } from '@/shared/utils/helper/format-number'
import Select from '@/shared/components/select'

type FilterItemProps = WriteItemProps<React.ElementType, GetListProductParams>

export const filterItems: Array<FilterItemProps> = [
  {
    form: { name: 'status', label: 'Status' },
    component: Select,
    componentProps: {
      placeholder: 'Select status',
      options: enumToOptionsWithCustomLabel(
        ProductStatusEnum,
        (value) => ProductStatusMapper[value],
      ),
    },
  } as WriteItemProps<typeof Select, GetListProductParams>,
  {
    form: { name: 'minPrice', label: 'Min Price' },
    component: InputNumber,
    componentProps: {
      placeholder: 'Min',
      formatter: formatVND,
      parser: parserVND,
      suffix: '₫',
      stringMode: true,
      style: { width: '100%' },
    },
  } as WriteItemProps<typeof InputNumber, GetListProductParams>,
  {
    form: { name: 'maxPrice', label: 'Max Price' },
    component: InputNumber,
    componentProps: {
      placeholder: 'Max',
      formatter: formatVND,
      parser: parserVND,
      suffix: '₫',
      stringMode: true,
      style: { width: '100%' },
    },
  } as WriteItemProps<typeof InputNumber, GetListProductParams>,
]
