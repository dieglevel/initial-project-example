import { Button, Flex, Form, Typography } from 'antd'
import { useForm } from 'antd/es/form/Form'
import WriteItem from '../write-item'
import type { WriteItemProps } from '../write-item'
import { baseForm } from '@/shared/common/form'
import { MAIN_CONTAINER_SCREEN_HEIGHT } from '@/shared/common/layout'

interface FilterProps<T extends object> {
  filterOpen: boolean
  items: Array<WriteItemProps<React.ElementType, T>>
  onApply?: (values: T) => void
  onReset?: () => void
}

export default function Filter<T extends object>({
  filterOpen,
  items,
  onApply,
  onReset,
}: FilterProps<T>) {
  const [form] = useForm()

  const handleApply = () => {
    const values = form.getFieldsValue()
    onApply?.(values)
  }
  const handleReset = () => {
    form.resetFields()
    onReset?.()
  }
  return (
    <Flex
      className="hide-scrollbar"
      vertical
      gap={16}
      style={{
        width: filterOpen ? '250px' : '0px',
        minWidth: filterOpen ? '250px' : '0px',
        overflow: 'auto',
        transition: 'all 0.3s ease',
        marginRight: filterOpen ? '16px' : '0px',
        background: '#fff',
        borderRadius: '4px',
        overflowY: 'auto',
        position: 'sticky',
        overflowX: 'hidden',
        top: 0,
        height: `${MAIN_CONTAINER_SCREEN_HEIGHT}`,
        minHeight: `${MAIN_CONTAINER_SCREEN_HEIGHT}`,
      }}
    >
      <div
        style={{
          width: '250px',
          minWidth: '250px',
          padding: '16px',
        }}
      >
        <Typography.Title level={5} style={{ marginTop: 0 }}>
          Bộ lọc
        </Typography.Title>
        <Form
          form={form}
          layout="vertical"
          style={{ width: '100%' }}
          {...baseForm}
        >
          <Flex vertical gap={4}>
            {items.map((item) => (
              <WriteItem
                key={item.form.name}
                form={{
                  style: { marginBottom: 0 },
                  ...item.form,
                }}
                component={item.component}
                componentProps={item.componentProps}
              />
            ))}
            <Flex gap={8} style={{ marginTop: 8 }}>
              <Button type="primary" block onClick={handleApply}>
                Áp dụng
              </Button>
              <Button block onClick={handleReset}>
                Đặt lại
              </Button>
            </Flex>
          </Flex>
        </Form>
      </div>
    </Flex>
  )
}
