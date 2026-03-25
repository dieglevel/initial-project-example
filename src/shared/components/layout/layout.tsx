import React from 'react'

import { Layout } from 'antd'
import Sidebar from './sidebar'

const { Content } = Layout

interface Props {
  children: React.ReactNode
}

const MainLayout: React.FC<Props> = ({ children }) => {
  return (
    <Layout
      style={{
        minHeight: '100vh',
        height: '100%',
      }}
    >
      <Sidebar />
      <Layout
        className="hide-scrollbar
      "
        style={{
          overflowY: 'auto',
          height: '100vh',
        }}
      >
        <Content
          style={{
            overflow: 'initial',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
