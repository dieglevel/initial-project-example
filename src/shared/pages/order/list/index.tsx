import { Button, Flex, Table, Tag } from 'antd'

import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import useApp from 'antd/es/app/useApp'
import Toolbar from './toolbar'
import type { TableColumnType } from 'antd'

import type { Order } from '@/shared/api/order/order.type'
import {
  FinancialStatusEnum,
  FinancialStatusLabel,
  FiniancialStatusColor,
  FulfillmentStatusColor,
  FulfillmentStatusEnum,
  FulfillmentStatusLabel,
  OrderStatusColor,
  OrderStatusEnum,
  OrderStatusLabel,
} from '@/shared/api/order/order.type'
import { useGetListOrder } from '@/shared/api/order/useGetListOrder'
import { MAIN_CONTAINER_PADDING } from '@/shared/common/layout'
import SmartText from '@/shared/components/smart-text'
import { formatVNDValue } from '@/shared/utils/helper/format-number'
import { formatPhone } from '@/shared/utils/helper/format-phone'
import { enumToOptionsWithCustomLabel } from '@/shared/utils/helper/enum-to-option'
import Select from '@/shared/components/select'
import { useMutationOrder } from '@/shared/api/order/mutation'
import { enumToColor } from '@/shared/utils/helper/enum-to-color'
import { Route } from '@/routes/(protected)/order/list/view.$id'

export default function OrderListPage() {
  const navigate = Route.useNavigate()

  const { data, isFetching, refetch } = useGetListOrder({})
  const { mUpdateStatusOrder } = useMutationOrder()
  const { mutateAsync } = mUpdateStatusOrder
  const { message } = useApp()

  const handleChangeOrderStatus = async (
    orderId: number,
    status?: OrderStatusEnum,
  ) => {
    await mutateAsync({
      pathParams: {
        id: orderId,
      },
      body: { status },
    })
    message.success('Cập nhật trạng thái đơn hàng thành công')
    refetch()
  }

  const handleChangeFinancialStatus = async (
    orderId: number,
    status?: FinancialStatusEnum,
  ) => {
    await mutateAsync({
      pathParams: {
        id: orderId,
      },
      body: { financialStatus: status },
    })
    message.success('Cập nhật trạng thái thanh toán thành công')
    refetch()
  }

  const handleChangeFulfillmentStatus = async (
    orderId: number,
    status?: FulfillmentStatusEnum,
  ) => {
    await mutateAsync({
      pathParams: {
        id: orderId,
      },
      body: { fulfillmentStatus: status },
    })
    message.success('Cập nhật trạng thái vận chuyển thành công')
    refetch()
  }

  const handleOnRow = (record: Order) => {
    navigate({
      to: '/order/list/view/$id',
      params: {
        id: String(record.id),
      },
    })
  }

  const columns: Array<TableColumnType<Order>> = [
    {
      title: 'Order Number',
      key: 'orderNumber',
      dataIndex: 'orderNumber',
      align: 'center',
      width: 'fit-content',
      render: (value) => <SmartText>{value}</SmartText>,
    },
    {
      title: 'Trạng thái đơn hàng',
      key: 'status',
      dataIndex: 'status',
      align: 'center',
      width: 'fit-content',
      render: (value, record) => {
        return (
          <Select
            style={{ width: '100%' }}
            options={enumToOptionsWithCustomLabel(
              OrderStatusEnum,
              (status) => OrderStatusLabel[status],
            )}
            defaultValue={value}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(select) => handleChangeOrderStatus(record.id, select)}
            labelRender={(props) => {
              const { label, value: valueProps } = props
              return (
                <Tag
                  color={enumToColor(OrderStatusColor, valueProps)}
                  style={{ marginInlineEnd: 4, width: '100%' }}
                >
                  {label}
                </Tag>
              )
            }}
          />
        )
      },
    },
    {
      title: 'Tên khách hàng',
      key: 'customerName',
      dataIndex: 'customerName',
      align: 'center',
      ellipsis: true,
      minWidth: 300,
      width: 300,
      render: (_, record) => (
        <SmartText>
          {record.customerName + ' - ' + formatPhone(record.customerPhone)}
        </SmartText>
      ),
    },

    {
      title: 'Phương thức thanh toán',
      key: 'paymentMethod',
      dataIndex: 'paymentMethod',
      align: 'center',
      render: (value) => formatVNDValue(value),
    },

    {
      title: 'Trạng thái thanh toán',
      key: 'financialStatus',
      dataIndex: 'financialStatus',
      align: 'center',
      width: 'fit-content',
      render: (value, record) => {
        return (
          <Select
            style={{ width: '100%' }}
            options={enumToOptionsWithCustomLabel(
              FinancialStatusEnum,
              (status) => FinancialStatusLabel[status],
            )}
            defaultValue={value}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(select) =>
              handleChangeFinancialStatus(record.id, select)
            }
            labelRender={(props) => {
              const { label, value: valueProps } = props
              return (
                <Tag
                  color={enumToColor(FiniancialStatusColor, valueProps)}
                  style={{ marginInlineEnd: 4, width: '100%' }}
                >
                  {label}
                </Tag>
              )
            }}
          />
        )
      },
    },
    {
      title: 'Trạng thái vận chuyển',
      key: 'fulfillmentStatus',
      dataIndex: 'fulfillmentStatus',
      align: 'center',
      width: 'fit-content',
      render: (value, record) => {
        return (
          <Select
            style={{ width: '100%' }}
            options={enumToOptionsWithCustomLabel(
              FulfillmentStatusEnum,
              (status) => FulfillmentStatusLabel[status],
            )}
            defaultValue={value}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(select) =>
              handleChangeFulfillmentStatus(record.id, select)
            }
            labelRender={(props) => {
              const { label, value: valueProps } = props
              return (
                <Tag
                  color={enumToColor(FulfillmentStatusColor, valueProps)}
                  style={{ marginInlineEnd: 4, width: '100%' }}
                >
                  {label}
                </Tag>
              )
            }}
          />
        )
      },
    },
    {
      title: 'Tổng tiền',
      key: 'totalPrice',
      align: 'center',
      dataIndex: 'totalPrice',
      width: 'fit-content',
      render: (value) => formatVNDValue(value),
    },
    {
      title: 'Số lượng',
      key: 'totalItems',
      dataIndex: 'totalItems',
      width: 'fit-content',
      align: 'center',
      render: (_, record) => record.items.length,
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Flex gap={8} justify="center">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOnRow(record)}
          />
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Flex>
      ),
    },
  ]

  return (
    <Flex
      className="hide-scrollbar"
      style={{
        padding: MAIN_CONTAINER_PADDING,
        position: 'relative',
        overflow: 'auto',
      }}
    >
      {/* Main Content */}
      <Flex vertical gap={16} style={{ flex: 1 }}>
        <Toolbar />
        {/* Table */}
        <Flex gap={8} style={{ flex: 1 }}>
          <Table<Order>
            rowKey={'id'}
            columns={columns}
            dataSource={data?.data.content || []}
            loading={isFetching}
            size="small"
            pagination={false}
            onRow={(record) => {
              return {
                onClick: () => handleOnRow(record),
                style: { cursor: 'pointer' },
              }
            }}
          />
        </Flex>
      </Flex>
    </Flex>
  )
}
