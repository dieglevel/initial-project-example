import React, { useState } from "react";

import { useAuth } from "@/shared/auth/use-auth";
import { Button, Layout, Menu, theme } from "antd";
import { menuItems } from "./menu.constant";

const { Header, Content, Footer, Sider } = Layout;

const SidebarLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const { logout } = useAuth();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        trigger={null}
      >
        <div className="demo-logo-vertical" />
        <Menu
          theme="dark"
          defaultSelectedKeys={["1"]}
          mode="inline"
          items={menuItems}
        />
        <Button onClick={logout}>Logout</Button>
      </Sider>
      <Layout>{children}</Layout>
    </Layout>
  );
};

export default SidebarLayout;
