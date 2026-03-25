import React from 'react'

import { Layout } from 'antd'

const { Content } = Layout

interface Props {
  children: React.ReactNode
}

const EmptyLayout: React.FC<Props> = ({ children }) => {
  return (
    <Layout
      style={{
        minHeight: '100vh',
        height: '100%',
      }}
    >
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

export default EmptyLayout
