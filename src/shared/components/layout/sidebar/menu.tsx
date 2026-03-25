import { useLocation, useNavigate } from '@tanstack/react-router'
import { ConfigProvider, Menu } from 'antd'
import { useCallback, useMemo } from 'react'
import type { MenuItem } from '@/shared/common/menu'
import { menuItems } from '@/shared/common/menu'
import { background, colors } from '@/shared/common/design-token'
import { ProductSubListEnum } from '@/routes/(protected)/product/list/$subList/route'
import './menu.css'

export default function Body() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const currentPath = pathname.split('/')[1] || 'home'

  const handleNavigate = useCallback(
    (path?: string) => {
      if (!path) return

      if (path === '/product/list/$subList') {
        navigate({
          to: '/product/list/$subList',
          params: { subList: ProductSubListEnum.ALL },
        })
        return
      }

      navigate({ to: path })
    },
    [navigate],
  )

  const menuMap = useMemo(() => {
    const map = new Map<React.Key, MenuItem>()

    const build = (items: Array<MenuItem>) => {
      for (const item of items) {
        map.set(item.key, item)
        if (item.children) build(item.children)
      }
    }

    build(menuItems)
    return map
  }, [])

  return (
    <ConfigProvider
      theme={{
        components: {
          Menu: {
            itemColor: 'white',
            groupTitleColor: 'rgba(255, 255, 255, 0.45)',
            itemSelectedBg: colors.primary.base,
            itemSelectedColor: '#fff',
            itemHoverBg: `rgba(${colors.primary.rgb}, 0.4)`,
            itemHoverColor: '#fff',
            subMenuItemSelectedColor: colors.primary.hover,
          },
        },
      }}
    >
      <Menu
        className="ant-menu-custom"
        mode="inline"
        selectedKeys={[currentPath]}
        items={menuItems}
        onClick={(info) => {
          const item = menuMap.get(info.key)
          if (item?.path) {
            handleNavigate(item.path)
          }
        }}
        style={{
          flex: 1,
          background: background.spotlight,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          overflowY: 'auto', // nếu menu dài thì scroll ở đây
          minHeight: 0, // QUAN TRỌNG khi dùng flex + overflow
        }}
      />
    </ConfigProvider>
  )
}
