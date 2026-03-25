import { Button, Card, Flex, Image, Table } from 'antd'

import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { useState } from 'react'
import useApp from 'antd/es/app/useApp'
import PhotoboothForm from './form'
import type { TableColumnType } from 'antd'
import type { Photobooth } from '@/shared/api/photobooth/photobooth.type'

import SmartText from '@/shared/components/smart-text'
import { MAIN_CONTAINER_PADDING } from '@/shared/common/layout'
import { useMutationPhotobooth } from '@/shared/api/photobooth/mutation'
import { useGetListPhotobooth } from '@/shared/api/photobooth/useGetListPhotobooth'

export default function PhotoboothListPage() {
  const { data, isFetching } = useGetListPhotobooth()
  const { message, modal } = useApp()
  const { mDeletePhotobooth } = useMutationPhotobooth()

  const [editPhotobooth, setEditPhotobooth] = useState<Photobooth | null>(null)
  const [deletingPhotoboothId, setDeletingPhotoboothId] = useState<
    number | null
  >(null)

  const handleDeletePhotobooth = async (photobooth: Photobooth) => {
    setDeletingPhotoboothId(photobooth.id)

    try {
      await mDeletePhotobooth.mutateAsync(
        {
          pathParams: {
            id: photobooth.id,
          },
        },
        {
          onSuccess: () => {
            if (editPhotobooth?.id === photobooth.id) {
              setEditPhotobooth(null)
            }

            message.success('Xóa photobooth thành công')
          },
        },
      )
    } finally {
      setDeletingPhotoboothId(null)
    }
  }

  const handleConfirmDeletePhotobooth = (photobooth: Photobooth) => {
    modal.confirm({
      title: 'Xóa photobooth',
      content: 'Bạn có chắc muốn xóa photobooth này không?',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: {
        danger: true,
      },
      centered: true,
      onOk: async () => handleDeletePhotobooth(photobooth),
    })
  }

  const columns: Array<TableColumnType<Photobooth>> = [
    {
      title: 'ID',
      key: 'id',
      dataIndex: 'id',
      width: 'fit-content',
      minWidth: 80,
    },
    {
      title: 'Sản phẩm',
      key: 'name',
      dataIndex: 'name',
      ellipsis: true,
      width: 300,
      render: (value, record) => {
        return (
          <Flex gap={8} align="center">
            <Image
              src={record.previewImage}
              alt={value}
              style={{ width: 40, height: 40, objectFit: 'cover' }}
            />
            <SmartText>{value}</SmartText>
          </Flex>
        )
      },
    },
    {
      title: 'slotsCount',
      key: 'slotsCount',
      dataIndex: 'slotsCount',
      width: 'fit-content',
      minWidth: 80,
    },
    {
      title: 'Action',
      key: 'action',
      render: (value) => (
        <Flex gap={8}>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => setEditPhotobooth(value)}
          />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            loading={
              mDeletePhotobooth.isPending && deletingPhotoboothId === value.id
            }
            onClick={() => handleConfirmDeletePhotobooth(value)}
          />
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
        {/* Table */}
        <Flex gap={8} style={{ flex: 1 }}>
          <Table<Photobooth>
            rowKey={'id'}
            columns={columns}
            dataSource={data?.data || []}
            loading={isFetching}
            size="small"
            onRow={(rowData) => {
              return {
                onClick: () => setEditPhotobooth(rowData),
                style: { cursor: 'pointer' },
              }
            }}
            pagination={false}
          />
          <Card
            style={{ width: 800, minWidth: 800 }}
            title={
              editPhotobooth ? 'Chỉnh sửa photobooth' : 'Tạo mới photobooth'
            }
          >
            <Flex vertical gap={8} align="center" style={{ width: '100%' }}>
              <PhotoboothForm
                data={editPhotobooth}
                onCancel={() => setEditPhotobooth(null)}
              />
            </Flex>
          </Card>
        </Flex>
      </Flex>
    </Flex>
  )
}
