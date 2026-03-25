import React from 'react'

import { Divider, Layout } from 'antd'
import SidebarHeader from './header'
import Body from './menu'
import Footer from './footer'
import { colors } from '@/shared/common/design-token'
import { SIDEBAR_WIDTH } from '@/shared/common/layout'

const { Sider } = Layout

const Sidebar: React.FC = () => {
  return (
    <Sider
      width={SIDEBAR_WIDTH}
      style={{
        background: 'var(--background-navbar, #101010)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
      }}
      breakpoint="lg"
      collapsible
      trigger={null}
    >
      <SidebarHeader />

      <Divider
        style={{ borderColor: colors.primary.base, margin: 0 }}
        size="small"
      />

      <Body />
      <Divider
        style={{ borderColor: colors.primary.base, margin: 0 }}
        size="small"
      />
      <Footer />
    </Sider>
  )
}

export default Sidebar
