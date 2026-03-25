import {
  AppstoreOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  FileImageOutlined,
  SettingOutlined,
  TruckOutlined,
} from '@ant-design/icons'

import type { AppPath } from '../utils/url-path'
import type { MenuItemType } from 'antd/es/menu/interface'

export interface MenuItem extends MenuItemType {
  path?: AppPath
  children?: Array<MenuItem>
}

export const menuItems: Array<MenuItem> = [
  {
    key: 'dashboardDad',
    icon: <AppstoreOutlined />,
    label: 'Tổng quan',
    children: [
      {
        key: 'dashboard',
        icon: <AppstoreOutlined />,
        label: 'Tổng quan',
        path: '/dashboard',
      },
      {
        key: 'temp',
        icon: <AppstoreOutlined />,
        label: 'Temp',
        path: '/dashboard',
      },
    ],
    path: '/dashboard',
  },
  {
    key: 'product',
    icon: <AppstoreOutlined />,
    label: 'Quản lý sản phẩm',
    path: '/product/list/$subList',
  },
  {
    key: 'photobooth',
    icon: <FileImageOutlined />,
    label: 'Quản lý theme',
    path: '/photobooth',
  },
  {
    key: 'order',
    icon: <TruckOutlined />,
    label: 'Xử lý đơn hàng',
    path: '/order/list',
  },
  {
    key: 'uploads',
    icon: <TruckOutlined />,
    label: 'Quản lý hình ảnh',
    path: '/order',
  },
  {
    key: 'inventory',
    icon: <DatabaseOutlined />,
    label: 'Kho',
    path: '/user',
  },
  {
    key: 'reports',
    icon: <BarChartOutlined />,
    label: 'Báo cáo doanh thu',
    path: '/user',
  },
  {
    key: 'settings',
    icon: <SettingOutlined />,
    label: 'Cấu hình hệ thống',
    path: '/user',
  },
]
