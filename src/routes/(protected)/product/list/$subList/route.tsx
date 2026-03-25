import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

export enum ProductSubListEnum {
  ALL = 'all',
}

const SubListMapper = {
  [ProductSubListEnum.ALL]: 'Tất cả',
}

export const Route = createFileRoute('/(protected)/product/list/$subList')({
  component: RouteComponent,
  context: ({ params }) => ({
    breadcrumb:
      SubListMapper[params.subList as ProductSubListEnum] ||
      'Danh sách sản phẩm',
  }),
  beforeLoad: ({ params }) => {
    const VALID = Object.values(ProductSubListEnum)

    if (!VALID.includes(params.subList as ProductSubListEnum)) {
      throw redirect({
        to: '/product/list/$subList',
        params: { subList: 'all' },
      })
    }
  },
})

function RouteComponent() {
  return <Outlet />
}
