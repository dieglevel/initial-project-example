import React, { useEffect, useMemo, useState } from 'react'
import { Card, Col, Empty, Input, Row, Typography, message } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import * as AllIcons from '@/shared/assets/icons/index'

const { Title, Text } = Typography
const ICONS_PER_BATCH = 48

const normalizeText = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, '')

const splitNameTokens = (value: string) =>
  value
    .replace(/^Icon/, '')
    .split(/(?=[A-Z])|_|-|\s+/)
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean)

const scoreIconMatch = (iconName: string, query: string) => {
  const normalizedQuery = normalizeText(query)
  const normalizedName = normalizeText(iconName)

  if (!normalizedQuery) {
    return 1
  }

  if (normalizedName === normalizedQuery) {
    return 1000
  }

  if (normalizedName.startsWith(normalizedQuery)) {
    return 800
  }

  const nameTokens = splitNameTokens(iconName)
  const queryTokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.replace(/[^a-z0-9]/g, ''))
    .filter(Boolean)

  const initials = nameTokens.map((token) => token[0]).join('')
  if (initials.startsWith(normalizedQuery)) {
    return 700
  }

  if (normalizedName.includes(normalizedQuery)) {
    return 600
  }

  if (
    queryTokens.length > 0 &&
    queryTokens.every((queryToken) =>
      nameTokens.some((nameToken) => nameToken.includes(queryToken)),
    )
  ) {
    return 400 + queryTokens.length
  }

  return 0
}

const IconCard: React.FC<{
  name: string
  onCopy: (name: string) => void
}> = ({ name, onCopy }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = document.getElementById(`icon-card-${name}`)
    if (!element || isVisible) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '160px' },
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [name, isVisible])

  const iconMap = AllIcons as Record<string, React.ComponentType<any>>
  const IconComponent = iconMap[name]

  return (
    <Col xs={12} sm={8} md={6} lg={4} xl={3} key={name}>
      <Card
        id={`icon-card-${name}`}
        hoverable
        style={{
          textAlign: 'center',
          cursor: 'pointer',
          borderRadius: '8px',
        }}
        onClick={() => onCopy(name)}
        bodyStyle={{ padding: '20px 10px' }}
      >
        <div
          style={{
            fontSize: '32px',
            marginBottom: '12px',
            color: '#555',
            minHeight: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isVisible ? <IconComponent /> : null}
        </div>
        <Text code style={{ fontSize: '11px', display: 'block' }}>
          {name}
        </Text>
      </Card>
    </Col>
  )
}

const IconGallery: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [visibleCount, setVisibleCount] = useState(ICONS_PER_BATCH)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [searchTerm])

  // 1. Lấy danh sách tất cả các icon từ file index
  const allIconNames = useMemo(() => {
    return Object.keys(AllIcons).filter((key) => key.startsWith('Icon'))
  }, [])

  // 2. Lọc icon theo thanh search
  const filteredIcons = useMemo(() => {
    return allIconNames
      .map((name) => ({
        name,
        score: scoreIconMatch(name, debouncedSearchTerm),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
      .map((item) => item.name)
  }, [debouncedSearchTerm, allIconNames])

  useEffect(() => {
    setVisibleCount(ICONS_PER_BATCH)
  }, [debouncedSearchTerm])

  const visibleIcons = useMemo(
    () => filteredIcons.slice(0, visibleCount),
    [filteredIcons, visibleCount],
  )

  const hasMore = visibleCount < filteredIcons.length

  useEffect(() => {
    if (!hasMore) {
      return
    }

    const sentinel = document.getElementById('icon-load-more-sentinel')
    if (!sentinel) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((prev) =>
            Math.min(prev + ICONS_PER_BATCH, filteredIcons.length),
          )
        }
      },
      { rootMargin: '320px' },
    )

    observer.observe(sentinel)

    return () => {
      observer.disconnect()
    }
  }, [hasMore, filteredIcons.length])

  // 3. Hàm copy tên icon khi click
  const handleCopy = (name: string) => {
    navigator.clipboard.writeText(`<${name} />`)
    message.success(`Đã copy: <${name} />`)
  }

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <Card style={{ marginBottom: '24px', borderRadius: '8px' }}>
        <Title level={2}>Icon Library ({allIconNames.length} icons)</Title>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Tìm kiếm icon (ví dụ: User, Home...)"
          allowClear
          size="large"
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: '500px' }}
        />
      </Card>

      {filteredIcons.length > 0 ? (
        <>
          <Row gutter={[16, 16]}>
            {visibleIcons.map((name) => (
              <IconCard key={name} name={name} onCopy={handleCopy} />
            ))}
          </Row>
          {hasMore ? (
            <div
              id="icon-load-more-sentinel"
              style={{ height: '1px', marginTop: '8px' }}
            />
          ) : null}
        </>
      ) : (
        <Empty description="Không tìm thấy icon nào phù hợp" />
      )}
    </div>
  )
}

export default IconGallery
