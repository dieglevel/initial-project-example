import { Form } from 'antd'
import type { FormItemProps } from 'antd'
import type React from 'react'

type FieldName<T> = Extract<keyof T, string>

export interface WriteItemProps<
  TComponent extends React.ElementType,
  TDto extends object,
> {
  key?: FieldName<TDto>
  form: Omit<FormItemProps, 'name'> & {
    name: FieldName<TDto>
  }
  component: TComponent
  componentProps?: React.ComponentProps<TComponent>
}
export default function WriteItem<
  T extends React.ElementType,
  TDto extends object,
>({ form, component: Component, componentProps }: WriteItemProps<T, TDto>) {
  return (
    <Form.Item
      colon={false}
      style={{
        ...form.style,
      }}
      {...(form as FormItemProps<FieldName<TDto>>)}
    >
      <Component {...(componentProps as React.ComponentProps<T>)} />
    </Form.Item>
  )
}
