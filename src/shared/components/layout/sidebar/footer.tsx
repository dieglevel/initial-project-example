import {
  DownOutlined,
  LogoutOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Avatar, Dropdown, Flex, Space, Typography } from 'antd'
import { useState } from 'react'
import useApp from 'antd/es/app/useApp'
import type { MenuProps } from 'antd'
import { colors } from '@/shared/common/design-token'
import { LogoutService } from '@/shared/auth/logout.service'
import { useMutationAuth } from '@/shared/api/auth/mutation'
import { useAuthStore } from '@/shared/store/auth.store'
import { UserRoleMapper } from '@/shared/auth/auth.type'
import { renderMapperEnum } from '@/shared/utils/helper/render-mapper-enum'

export default function Footer() {
  const { message } = useApp()
  const { user } = useAuthStore()
  const [open, setOpen] = useState(false)

  const { mLogout } = useMutationAuth()

  const handleLogout = () => {
    mLogout.mutate(
      {},
      {
        onSuccess: () => {
          LogoutService.logout()
          message.success('Đăng xuất thành công')
        },
      },
    )
  }

  const items: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Thông tin cá nhân',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Đổi mật khẩu',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      danger: true,
      label: 'Đăng xuất',
      onClick: () => {
        handleLogout()
      },
    },
  ]

  return (
    <Flex vertical>
      <Dropdown
        menu={{ items }}
        trigger={['click']}
        placement="topRight"
        open={open}
        onOpenChange={setOpen}
      >
        <div
          style={{
            width: '100%',
            cursor: 'pointer',
            padding: 12,
            borderRadius: 10,
            transition: 'all 0.2s ease',
          }}
        >
          <Space
            style={{
              width: '100%',
              justifyContent: 'space-between',
            }}
          >
            <Space>
              <Avatar icon={<UserOutlined />} />
              <div style={{ lineHeight: 1.2 }}>
                <Typography.Text
                  strong
                  ellipsis
                  style={{
                    display: 'block',
                    fontSize: 12,
                    color: colors.primary.light,
                  }}
                >
                  {user?.fullName || '-'}
                </Typography.Text>

                <Typography.Text
                  ellipsis
                  style={{
                    fontSize: 11,
                    color: colors.primary.light,
                    opacity: 0.7,
                  }}
                >
                  {renderMapperEnum(user?.role, UserRoleMapper, '-')}
                </Typography.Text>
              </div>
            </Space>

            <DownOutlined
              style={{
                fontSize: 12,
                transition: 'transform 0.2s ease',
                transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                color: colors.primary.light,
              }}
            />
          </Space>
        </div>
      </Dropdown>
    </Flex>
  )
}
