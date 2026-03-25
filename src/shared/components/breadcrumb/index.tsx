import { Flex } from 'antd'
import { Link, useMatches } from '@tanstack/react-router'
import { HomeOutlined, RightOutlined } from '@ant-design/icons'

import './index.css'

export function AppBreadcrumb() {
  const matches = useMatches()

  const breadcrumbItems = matches.filter((m) => {
    return m.context.breadcrumb
  })

  const items = breadcrumbItems.map((m, index) => {
    const isLast = index === breadcrumbItems.length - 1

    return {
      key: m.id,
      title: isLast ? (
        m.context.breadcrumb
      ) : (
        <Link to={m.pathname}>{m.context.breadcrumb}</Link>
      ),
    }
  })

  const showBreadcrumb = items.length > 0

  if (!showBreadcrumb) {
    return null
  }

  return (
    <Flex align="center" className="app-breadcrumb" style={{ width: '100%' }}>
      <Link to="/dashboard" className="app-breadcrumb-home">
        <HomeOutlined />
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <Flex
            key={item.key}
            align="center"
            className="app-breadcrumb-item-wrap"
          >
            <RightOutlined className="app-breadcrumb-separator" />
            {isLast ? (
              <span className="app-breadcrumb-item app-breadcrumb-item-active">
                {item.title}
              </span>
            ) : (
              <span className="app-breadcrumb-item">{item.title}</span>
            )}
          </Flex>
        )
      })}
    </Flex>
  )
}
