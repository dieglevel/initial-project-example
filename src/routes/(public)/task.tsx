import { createFileRoute } from '@tanstack/react-router'
import { Badge, Card, Checkbox, Empty, Input, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'

const { TextArea } = Input
const { Text, Title } = Typography

const getStatusColor = (status: string): string => {
  const statusLower = (status || '').toLowerCase()
  if (statusLower.includes('new') || statusLower.includes('closed'))
    return 'red'
  if (statusLower.includes('progress') || statusLower.includes('in progress'))
    return '#1890ff'
  if (statusLower.includes('feedback') || statusLower.includes('waiting'))
    return '#faad14'
  if (statusLower.includes('urgent') || statusLower.includes('critical'))
    return '#f5222d'
  return '#8c8c8c'
}

export const Route = createFileRoute('/(public)/task')({
  component: RouteComponent,
})

export interface RowsItem {
  psubject: string
  pstatus: string
  fcn: string
  pup: string
  pend_date: string
  preg_user: string
  taseq: string
  cn: string
  type: string
  subject: string
  ticket_refer: string
  status: string
  priority: string
  parent_task: string
  start_date: string
  due_date: string
  assignee: null
  acn: string
  percent: string
  estimated_time: string
  time_zone: string
  userno: string
  ucn: string
  files: string
  options: null
  mime: string
  mcn: string
  mchecksum: string
  reg_date: string
  pcn: string
  pseq: string
  sub_task: null
  hashtags: null
  relate_task: null
  reference_doc: null
  updated_date: string
  country_zone: string
  dept: string
  name: string
  rank: string
  sdept: string
  sname: string
  srank: string
  fdept: string
  fname: string
  frank: string
  odept: null
  oname: null
  orank: null
  osdept: null
  osname: null
  osrank: null
  ofdept: null
  ofname: null
  ofrank: null
  ndept: null
  nname: null
  nrank: null
  nsdept: null
  nsname: null
  nsrank: null
  nfdept: null
  nfname: null
  nfrank: null
  country: string
  dcountry: string
  ocountry: string
  odcountry: string
  ncountry: string
  ndcountry: string
  is_read: string
  notify_type: string
  sseq: null
  scn: null
  releases: null
  story_point: string
  epic_label_cn: null
  epic_label_id: null
  value_point: string
  constraint_condition: null
  done_date: null
  release: string
  taseq_no: string
  seq_no: string
  tab_id: string
  un_read: boolean
  no: number
  type_msg: string
  status_msg: string
  priority_msg: string
}

export interface Page {
  total_num: string
  total_page: number
}

export interface Root {
  success: boolean
  rows: Array<RowsItem>
  page: Page
  benchmark: Array<string>
}

function RouteComponent() {
  const [data, setData] = useState<string>('')
  const [keyword, setKeyword] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<Array<string>>([])

  const dataResult = useMemo(() => {
    if (!data.trim()) return []

    try {
      const jsonData = JSON.parse(data) as Root
      return jsonData.rows
    } catch (error) {
      console.error('Invalid JSON:', error)
      return []
    }
  }, [data])

  const statusOptions = useMemo(() => {
    const options = new Set<string>()
    dataResult.forEach((item) => {
      if (item.status_msg) options.add(item.status_msg)
    })

    return Array.from(options).map((value) => ({ label: value, value }))
  }, [dataResult])

  const filteredResult = useMemo(() => {
    const lowerKeyword = keyword.trim().toLowerCase()

    return dataResult.filter((item) => {
      const passStatus =
        statusFilter.length === 0 || statusFilter.includes(item.status_msg)
      const passKeyword =
        !lowerKeyword ||
        item.psubject.toLowerCase().includes(lowerKeyword) ||
        item.parent_task.toLowerCase().includes(lowerKeyword) ||
        item.subject.toLowerCase().includes(lowerKeyword)

      return passStatus && passKeyword
    })
  }, [dataResult, keyword, statusFilter])

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <Card style={{ marginBottom: 24 }}>
        <Title level={4}>📋 Parse JSON Task Data</Title>
        <TextArea
          value={data}
          onChange={(e) => setData(e.target.value)}
          rows={8}
          placeholder="Paste JSON data here"
          style={{
            borderRadius: '8px',
            fontSize: '14px',
            fontFamily: 'monospace',
          }}
        />
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <div
          style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: '300px' }}>
            <Text
              type="secondary"
              style={{
                fontSize: '12px',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              🔍 Search Tasks
            </Text>
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              allowClear
              placeholder="Filter by subject, parent task, or topic..."
              style={{ borderRadius: '6px' }}
            />
          </div>
          <div style={{ minWidth: '200px' }}>
            <Text
              type="secondary"
              style={{
                fontSize: '12px',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              🏷️ Filter by Status
            </Text>
            <Checkbox.Group
              value={statusFilter}
              onChange={(values) => setStatusFilter(values)}
              options={statusOptions}
              style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
            />
          </div>
        </div>
        <Text
          type="secondary"
          style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}
        >
          Found:{' '}
          <Badge
            count={filteredResult.length}
            style={{ backgroundColor: '#1890ff' }}
          />{' '}
          tasks
        </Text>
      </Card>

      <div style={{ display: 'grid', gap: '16px' }}>
        {filteredResult.length === 0 ? (
          <Card>
            <Empty description="No tasks matched your filters" />
          </Card>
        ) : (
          filteredResult.map((item) => <TaskCard key={item.pcn} item={item} />)
        )}
      </div>
    </div>
  )
}

function TaskCard({ item }: { item: RowsItem }) {
  const handleCardClick = () => {
    window.open(
      `https://hanbirosoft.hanbiro.net/ngw/app/#/project/viewTask/1_0_0/pseqno/${item.seq_no}/taseq/${item.taseq_no}`,
      '_blank',
    )
  }

  return (
    <a
      href={`https://hanbirosoft.hanbiro.net/ngw/app/#/project/viewTask/1_0_0/pseqno/${item.seq_no}/taseq/${item.taseq_no}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Card
        hoverable
        onClick={handleCardClick}
        style={{
          borderRadius: '8px',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          borderLeft: `4px solid ${getStatusColor(item.status_msg)}`,
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.12)'
          e.currentTarget.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = ''
          e.currentTarget.style.transform = ''
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          {item.status_msg && (
            <Tag
              color={getStatusColor(item.status_msg)}
              style={{ cursor: 'default' }}
            >
              {item.status_msg}
            </Tag>
          )}
          <Title level={5} style={{ margin: 0, color: '#1f1f1f', flex: 1 }}>
            {item.subject || 'Untitled Task'}
          </Title>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginLeft: '12px',
              flexShrink: 0,
            }}
          ></div>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '20px',
            fontSize: '13px',
          }}
        >
          <Text>
            <Text type="secondary">Parent Subject:</Text>{' '}
            <Text strong>{item.psubject || '-'}</Text>
          </Text>
          <Text>
            <Text type="secondary">Parent Task:</Text>{' '}
            <Text strong>{item.parent_task || '-'}</Text>
          </Text>
        </div>
      </Card>
    </a>
  )
}
