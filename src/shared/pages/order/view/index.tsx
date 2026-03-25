import {
  Alert,
  Button,
  Card,
  Descriptions,
  Empty,
  Flex,
  Image,
  Spin,
  Table,
  Tag,
  Typography,
} from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import type { TableColumnType } from 'antd'
import type { Order, OrderItem } from '@/shared/api/order/order.type'
import { Route } from '@/routes/(protected)/order/list/view.$id'
import { useGetOrderDetail } from '@/shared/api/order/useGetDetailOrder'
import {
  FinancialStatusLabel,
  FiniancialStatusColor,
  FulfillmentStatusColor,
  FulfillmentStatusLabel,
  OrderStatusColor,
  OrderStatusLabel,
} from '@/shared/api/order/order.type'
import { MAIN_CONTAINER_PADDING } from '@/shared/common/layout'
import { formatVNDValue } from '@/shared/utils/helper/format-number'
import { formatPhone } from '@/shared/utils/helper/format-phone'

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))

export default function OrderViewPage() {
  const { id } = Route.useParams()
  const { data, isFetching, isError } = useGetOrderDetail({
    queryParams: {
      id: id ? Number(id) : undefined,
    },
  })

  const handleDownloadAllImages = async (urls: Array<string> | null) => {
    if (!urls) return

    for (const [index, url] of urls.entries()) {
      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Download failed: ${response.status}`)
        }

        const blob = await response.blob()
        const blobUrl = window.URL.createObjectURL(blob)
        const fileExtension = blob.type.split('/')[1] || 'jpg'
        const link = document.createElement('a')

        link.href = blobUrl
        link.download = `customization-${index + 1}.${fileExtension}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(blobUrl)
      } catch {
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    }
  }

  const order = data?.data

  const itemColumns: Array<TableColumnType<OrderItem>> = [
    {
      title: 'Sản phẩm',
      key: 'name',
      dataIndex: 'name',
      render: (_, record) => (
        <Flex gap={12} align="center">
          <Image
            src={record.imageUrl}
            alt={record.name}
            width={56}
            height={56}
            style={{ borderRadius: 8, objectFit: 'cover' }}
            fallback="data:image/gif;base64,R0lGODlhAQABAAAAACw="
          />
          <Flex vertical gap={2}>
            <Typography.Text strong>{record.name}</Typography.Text>
            <Typography.Text type="secondary">
              SKU: {record.sku}
            </Typography.Text>
          </Flex>
        </Flex>
      ),
    },
    {
      title: 'Số lượng',
      key: 'quantity',
      dataIndex: 'quantity',
      width: 90,
    },
    {
      title: 'Đơn giá',
      key: 'price',
      dataIndex: 'price',
      align: 'right',
      width: 160,
      render: (value: number) => formatVNDValue(value),
    },
    {
      title: 'Thành tiền',
      key: 'totalPrice',
      dataIndex: 'totalPrice',
      align: 'right',
      width: 180,
      render: (value: number) => formatVNDValue(value),
    },
    {
      title: 'Tùy chỉnh',
      key: 'customizationSummary',
      dataIndex: 'customizationSummary',
      render: (value: string, record) => (
        <Flex vertical gap={8}>
          {value ? (
            <Typography.Text>{value}</Typography.Text>
          ) : (
            <Typography.Text type="secondary">
              Không có tùy chỉnh
            </Typography.Text>
          )}
          {!!record.customizationImageUrls?.length && (
            <Flex vertical gap={8}>
              <Button
                type="default"
                size="small"
                icon={<DownloadOutlined />}
                onClick={(event) => {
                  event.stopPropagation()
                  void handleDownloadAllImages(record.customizationImageUrls)
                }}
              >
                Tải tất cả ảnh
              </Button>

              <Image.PreviewGroup>
                <Flex wrap gap={8}>
                  {record.customizationImageUrls.map((url) => (
                    <Image
                      key={url}
                      src={url}
                      width={56}
                      height={56}
                      style={{ borderRadius: 8, objectFit: 'cover' }}
                    />
                  ))}
                </Flex>
              </Image.PreviewGroup>
            </Flex>
          )}
        </Flex>
      ),
    },
  ]

  const renderStatus = (label: string, color: unknown) => (
    <Tag color={color as React.ComponentProps<typeof Tag>['color']}>
      {label}
    </Tag>
  )

  const renderOrderInformation = (currentOrder: Order) => (
    <Descriptions
      column={{ xs: 1, sm: 2, md: 3 }}
      bordered
      size="small"
      items={[
        {
          key: 'orderNumber',
          label: 'Mã đơn',
          children: (
            <Typography.Text strong>{currentOrder.orderNumber}</Typography.Text>
          ),
        },
        {
          key: 'createdOn',
          label: 'Ngày tạo',
          children: formatDateTime(currentOrder.createdOn),
        },
        {
          key: 'paymentMethod',
          label: 'Thanh toán',
          children: currentOrder.paymentMethod,
        },
        {
          key: 'status',
          label: 'Trạng thái đơn',
          children: renderStatus(
            OrderStatusLabel[currentOrder.status],
            OrderStatusColor[currentOrder.status],
          ),
        },
        {
          key: 'financialStatus',
          label: 'Trạng thái thanh toán',
          children: renderStatus(
            FinancialStatusLabel[currentOrder.financialStatus],
            FiniancialStatusColor[currentOrder.financialStatus],
          ),
        },
        {
          key: 'fulfillmentStatus',
          label: 'Trạng thái vận chuyển',
          children: renderStatus(
            FulfillmentStatusLabel[currentOrder.fulfillmentStatus],
            FulfillmentStatusColor[currentOrder.fulfillmentStatus],
          ),
        },
      ]}
    />
  )

  const renderAddress = (currentOrder: Order) => (
    <Descriptions
      column={{ xs: 1, sm: 2 }}
      bordered
      size="small"
      items={[
        {
          key: 'fullName',
          label: 'Người nhận',
          children: `${currentOrder.shippingAddress.lastName} ${currentOrder.shippingAddress.firstName}`,
        },
        {
          key: 'phone',
          label: 'Số điện thoại',
          children: formatPhone(currentOrder.shippingAddress.phone),
        },
        {
          key: 'email',
          label: 'Email',
          children: currentOrder.shippingAddress.email,
        },
        {
          key: 'address',
          label: 'Địa chỉ',
          children: `${currentOrder.shippingAddress.address1} ${currentOrder.shippingAddress.address2}`,
        },
        {
          key: 'province',
          label: 'Tỉnh/Thành',
          children: currentOrder.shippingAddress.province,
        },
        {
          key: 'country',
          label: 'Quốc gia',
          children: currentOrder.shippingAddress.country,
        },
      ]}
    />
  )

  const renderSummary = (currentOrder: Order) => (
    <Descriptions
      column={1}
      bordered
      size="small"
      items={[
        {
          key: 'subtotal',
          label: 'Tổng tiền hàng',
          children: formatVNDValue(currentOrder.totalPrice),
        },
        {
          key: 'discount',
          label: 'Giảm giá',
          children: formatVNDValue(currentOrder.totalDiscounts),
        },
        {
          key: 'tax',
          label: 'Thuế',
          children: formatVNDValue(currentOrder.totalTax),
        },
        {
          key: 'finalAmount',
          label: 'Tổng thanh toán',
          children: (
            <Typography.Text strong>
              {formatVNDValue(currentOrder.finalAmount)}
            </Typography.Text>
          ),
        },
      ]}
    />
  )

  if (isError) {
    return (
      <Flex style={{ padding: MAIN_CONTAINER_PADDING }}>
        <Alert
          type="error"
          showIcon
          message="Không thể tải chi tiết đơn hàng"
        />
      </Flex>
    )
  }

  if (isFetching) {
    return (
      <Flex
        style={{ padding: MAIN_CONTAINER_PADDING, minHeight: 240 }}
        align="center"
        justify="center"
      >
        <Spin />
      </Flex>
    )
  }

  if (!order) {
    return (
      <Flex style={{ padding: MAIN_CONTAINER_PADDING }}>
        <Empty description="Không tìm thấy đơn hàng" />
      </Flex>
    )
  }

  return (
    <Flex
      className="hide-scrollbar"
      style={{
        padding: MAIN_CONTAINER_PADDING,
        position: 'relative',
        overflow: 'auto',
      }}
    >
      <Flex vertical gap={16} style={{ width: '100%' }}>
        <Card title="Thông tin đơn hàng">{renderOrderInformation(order)}</Card>

        <Card title="Khách hàng và giao hàng">
          <Flex vertical gap={16}>
            <Descriptions
              column={{ xs: 1, sm: 2 }}
              bordered
              size="small"
              items={[
                {
                  key: 'customerName',
                  label: 'Khách hàng',
                  children: order.customerName,
                },
                {
                  key: 'customerPhone',
                  label: 'Số điện thoại',
                  children: formatPhone(order.customerPhone),
                },
                {
                  key: 'customerEmail',
                  label: 'Email',
                  children: order.customerEmail,
                },
                {
                  key: 'note',
                  label: 'Ghi chú',
                  children: order.note || 'Không có',
                },
              ]}
            />

            {renderAddress(order)}
          </Flex>
        </Card>

        <Card title="Sản phẩm trong đơn">
          <Table<OrderItem>
            rowKey="id"
            columns={itemColumns}
            dataSource={order.items}
            pagination={false}
            scroll={{ x: 880 }}
          />
        </Card>

        <Card title="Tổng kết thanh toán">{renderSummary(order)}</Card>

        <Card title="Chứng từ thanh toán">
          {order.paymentProofImage ? (
            <Image
              src={order.paymentProofImage}
              width={280}
              style={{ borderRadius: 8 }}
            />
          ) : (
            <Typography.Text type="secondary">
              Chưa có ảnh xác nhận thanh toán
            </Typography.Text>
          )}
        </Card>
      </Flex>
    </Flex>
  )
}
