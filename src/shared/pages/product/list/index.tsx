import { Button, Flex, Image, Table, Typography } from 'antd'

import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { EditOutlined } from '@ant-design/icons'
import { filterItems } from './filter.helper'
import Toolbar from './toolbar'
import type { TableColumnType } from 'antd'
import type { TablePaginationConfig } from 'antd/es/table'
import type { Product } from '@/shared/api/product/product.type'
import type { GetListProductParams } from '@/shared/api/product/useGetListProduct'
import { Route } from '@/routes/(protected)/product/list/$subList'
import { useGetListProduct } from '@/shared/api/product/useGetListProduct'
import {
  IsCustomizableProductMapper,
  ProductAvailabilityMapper,
  ProductStatusMapper,
  ProductTagMapper,
} from '@/shared/api/product/product.type'
import {
  DEFAULT_PAGE_SIZE,
  LIST_PAGE_SIZE_OPTIONS,
} from '@/shared/common/paginate'
import SmartText from '@/shared/components/smart-text'
import { renderMapperEnum } from '@/shared/utils/helper/render-mapper-enum'
import { MAIN_CONTAINER_PADDING } from '@/shared/common/layout'
import Filter from '@/shared/components/form/filter'
import Pagination from '@/shared/components/pagination'

export default function ProductListPage() {
  const navigate = useNavigate()
  const { subList } = Route.useParams()

  const [filterOpen, setFilterOpen] = useState(false)
  const [searchParams, setSearchParams] = useState<GetListProductParams>({})

  const [paginate, setPaginate] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
  })

  const { data, isFetching, refetch } = useGetListProduct({
    queryParams: {
      ...searchParams,
      page: (paginate.current ?? 1) - 1,
      size: paginate.pageSize ?? DEFAULT_PAGE_SIZE,
    },
  })

  const handleOnRow = (record: Product) => {
    navigate({
      to: '/product/list/$subList/write/$id',
      params: {
        subList: subList,
        id: String(record.id),
      },
    })
  }

  useEffect(() => {
    setPaginate((prev) => ({ ...prev, current: 1 }))
  }, [searchParams])

  useEffect(() => {
    if (data) {
      setPaginate((prev) => ({
        ...prev,
        total: data.data.page.totalElements || 0,
      }))
    }
  }, [data])

  const handleApplyFilters = (values: GetListProductParams) => {
    setSearchParams(values)
    refetch()
  }

  const handleResetFilters = () => {
    setSearchParams({})
    refetch()
  }

  const columns: Array<TableColumnType<Product>> = [
    {
      title: 'ID',
      key: 'id',
      dataIndex: 'id',
      width: 'fit-content',
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
              src={record.thumbnail}
              alt={value}
              style={{ width: 40, height: 40, objectFit: 'cover' }}
            />
            <SmartText>{value}</SmartText>
          </Flex>
        )
      },
    },
    {
      title: 'Số lượng tồn kho',
      key: 'inventoryQuantity',
      dataIndex: 'inventoryQuantity',
    },
    {
      title: 'Loại sản phẩm',
      key: 'isCustomizable',
      dataIndex: 'isCustomizable',
      render: (value: boolean) => {
        return (
          <Typography>
            {IsCustomizableProductMapper[value.toString()]}
          </Typography>
        )
      },
    },
    {
      title: 'Trạng thái sản phẩm',
      key: 'status',
      dataIndex: 'status',
      render: (value) => {
        return (
          <Typography>
            {renderMapperEnum(value, ProductStatusMapper, '-')}
          </Typography>
        )
      },
    },
    {
      title: 'Trạng thái Tag',
      key: 'tag',
      dataIndex: 'tag',
      render: (value) => {
        return (
          <Typography>
            {renderMapperEnum(value, ProductTagMapper, '-')}
          </Typography>
        )
      },
    },
    {
      title: 'Trạng thái đặt hàng',
      key: 'availability',
      dataIndex: 'availability',
      render: (value) => {
        return (
          <Typography>
            {renderMapperEnum(value, ProductAvailabilityMapper, '-')}
          </Typography>
        )
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (value) => (
        <Flex gap={8}>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              navigate({
                to: '/product/list/$subList/write/$id',
                params: {
                  subList: subList,
                  id: value.id,
                },
              })
            }}
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
      {/* Filter Panel */}
      <Filter
        filterOpen={filterOpen}
        items={filterItems}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      {/* Main Content */}
      <Flex vertical gap={16} style={{ flex: 1 }}>
        <Toolbar filterOpen={filterOpen} setFilterOpen={setFilterOpen} />
        {/* Table */}
        <Table<Product>
          rowKey={'id'}
          columns={columns}
          dataSource={data?.data.content || []}
          loading={isFetching}
          size="small"
          styles={{
            pagination: {
              root: {
                justifyContent: 'space-between',
              },
            },
          }}
          pagination={false}
          footer={() => (
            <Pagination
              total={paginate.total}
              current={paginate.current}
              pageSize={paginate.pageSize}
              optionPageSize={{
                value: LIST_PAGE_SIZE_OPTIONS,
                defaultValue: 1,
              }}
              onChange={(page, pageSize) => {
                setPaginate((prev) => ({
                  ...prev,
                  current: page,
                  pageSize: pageSize || prev.pageSize,
                }))
              }}
            />
          )}
          onRow={(row) => {
            return {
              onClick: () => handleOnRow(row),
              style: { cursor: 'pointer' },
            }
          }}
        />
      </Flex>
    </Flex>
  )
}
