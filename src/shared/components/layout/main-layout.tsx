import React, { useState } from "react";

import { Button, Layout, Menu } from "antd";
import { menuItems } from "./menu.constant";
import { useAuth } from "@/shared/auth/use-auth";

const { Sider } = Layout;

const SidebarLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [collapsed, setCollapsed] = useState(false);

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
