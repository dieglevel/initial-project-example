import { useState } from 'react'
import { Card, Flex, Image, Space } from 'antd'
import { CheckCircleFilled } from '@ant-design/icons'
import type React from 'react'

export interface SelectImageOption {
  value: string | number
  image: string
  label?: React.ReactNode
  description?: string
}

export interface SelectImageProps {
  value?: string | number
  onChange?: (value: string | number) => void
  options: Array<SelectImageOption>
  direction?: 'horizontal' | 'vertical'
  imageWidth?: number
  imageHeight?: number
  gap?: number
  showPreview?: boolean
  cardStyle?: React.CSSProperties
}

export default function SelectImage({
  value,
  onChange,
  options,
  direction = 'horizontal',
  imageWidth = 120,
  imageHeight = 120,
  gap = 16,
  showPreview = true,
  cardStyle,
}: SelectImageProps) {
  const [selectedValue, setSelectedValue] = useState<
    string | number | undefined
  >(value)

  const handleSelect = (optionValue: string | number) => {
    setSelectedValue(optionValue)
    onChange?.(optionValue)
  }

  const currentValue = value ?? selectedValue

  return (
    <Space size={gap} style={{ width: '100%' }} wrap>
      {options.map((option) => {
        const isSelected = currentValue === option.value

        return (
          <Card
            key={option.value}
            hoverable
            onClick={() => handleSelect(option.value)}
            style={{
              width: direction === 'vertical' ? '100%' : 'auto',
              border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
              position: 'relative',
              cursor: 'pointer',
              ...cardStyle,
            }}
            bodyStyle={{ padding: 12 }}
          >
            {isSelected && (
              <CheckCircleFilled
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  fontSize: 24,
                  color: '#1890ff',
                  zIndex: 1,
                }}
              />
            )}
            <Flex vertical gap={8} align="center">
              <Image
                src={option.image}
                width={imageWidth}
                height={imageHeight}
                style={{
                  objectFit: 'cover',
                  borderRadius: 4,
                }}
                alt={
                  typeof option.label === 'string'
                    ? option.label
                    : `Image ${option.value}`
                }
                preview={showPreview}
              />
              {option.label && (
                <div style={{ fontWeight: isSelected ? 'bold' : 'normal' }}>
                  {option.label}
                </div>
              )}
              {option.description && (
                <div
                  style={{
                    fontSize: 12,
                    color: '#8c8c8c',
                    textAlign: 'center',
                  }}
                >
                  {option.description}
                </div>
              )}
            </Flex>
          </Card>
        )
      })}
    </Space>
  )
}
