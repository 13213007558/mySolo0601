import React, { useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Modal,
  Typography,
  Descriptions,
} from 'antd';
import {
  SearchOutlined,
  ClearOutlined,
  EyeOutlined,
  DownloadOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useApp } from '../context/AppContext';
import type { CircuitRecord, CircuitStatus } from '../types';
import { ThresholdAlert } from './ThresholdAlert';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const statusLabels: Record<CircuitStatus, { text: string; color: string }> = {
  normal: { text: '运行正常', color: 'green' },
  fault: { text: '故障告警', color: 'red' },
  pending: { text: '待确认', color: 'orange' },
  unknown: { text: '未知', color: 'default' },
};

const sourceLabels: Record<string, { text: string; color: string }> = {
  sticker: { text: '贴纸录入', color: 'blue' },
  handwritten: { text: '补抄单', color: 'purple' },
  manual: { text: '手工补录', color: 'cyan' },
};

export const NormalRecordsTable: React.FC = () => {
  const { state, dispatch, getFilteredRecords, getComparison } = useApp();
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<CircuitRecord | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<CircuitStatus | undefined>();
  const [locationFilter, setLocationFilter] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  const filteredRecords = getFilteredRecords();

  const handleViewDetail = (record: CircuitRecord) => {
    setSelectedRecord(record);
    setDetailModalOpen(true);
  };

  const handleSearch = () => {
    dispatch({
      type: 'SET_FILTERS',
      payload: {
        searchText: searchText || undefined,
        status: statusFilter,
        location: locationFilter || undefined,
        dateRange: dateRange && dateRange[0] && dateRange[1]
          ? [dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD')]
          : undefined,
      },
    });
  };

  const handleClearFilters = () => {
    setSearchText('');
    setStatusFilter(undefined);
    setLocationFilter('');
    setDateRange(null);
    dispatch({ type: 'CLEAR_FILTERS' });
  };

  const columns = [
    {
      title: '回路名称',
      dataIndex: 'circuitName',
      key: 'circuitName',
      width: 200,
      render: (text: string, record: CircuitRecord) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          {record.manualEdited && (
            <Tag icon={<EditOutlined />} color="cyan" style={{ fontSize: 11 }}>
              {record.editedBy || '手工'} 已编辑
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: '回路编号',
      dataIndex: 'circuitCode',
      key: 'circuitCode',
      width: 140,
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: CircuitStatus) => {
        const label = statusLabels[status];
        return <Tag color={label.color}>{label.text}</Tag>;
      },
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 100,
      render: (source: string) => {
        const label = sourceLabels[source] || { text: source, color: 'default' };
        return <Tag color={label.color}>{label.text}</Tag>;
      },
    },
    {
      title: '电压(V)',
      dataIndex: 'voltage',
      key: 'voltage',
      width: 80,
      render: (val: number) => {
        const isAbnormal = val < state.thresholds.voltageMin || val > state.thresholds.voltageMax;
        return <Text type={isAbnormal ? 'danger' : undefined}>{val}</Text>;
      },
    },
    {
      title: '电流(A)',
      dataIndex: 'current',
      key: 'current',
      width: 80,
      render: (val: number) => {
        const isAbnormal = val < state.thresholds.currentMin || val > state.thresholds.currentMax;
        return <Text type={isAbnormal ? 'danger' : undefined}>{val}</Text>;
      },
    },
    {
      title: '功率(W)',
      dataIndex: 'power',
      key: 'power',
      width: 90,
      render: (val: number) => {
        const isAbnormal = val < state.thresholds.powerMin || val > state.thresholds.powerMax;
        return <Text type={isAbnormal ? 'danger' : undefined}>{val}</Text>;
      },
    },
    {
      title: '照度(lux)',
      dataIndex: 'illumination',
      key: 'illumination',
      width: 90,
      render: (val: number) => {
        const isAbnormal = val < state.thresholds.illuminationMin || val > state.thresholds.illuminationMax;
        return <Text type={isAbnormal ? 'danger' : undefined}>{val}</Text>;
      },
    },
    {
      title: '阈值检查',
      key: 'thresholdCheck',
      width: 180,
      render: (_: unknown, record: CircuitRecord) => <ThresholdAlert record={record} />,
    },
    {
      title: '检查日期',
      dataIndex: 'inspectionDate',
      key: 'inspectionDate',
      width: 110,
    },
    {
      title: '检查员',
      dataIndex: 'inspector',
      key: 'inspector',
      width: 80,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: CircuitRecord) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          详情
        </Button>
      ),
    },
  ];

  const comparisons = selectedRecord ? getComparison(selectedRecord.id) : [];

  return (
    <Card
      title={
        <Space>
          <Text strong style={{ fontSize: 16 }}>正常记录统计区</Text>
          <Tag color="blue">{filteredRecords.length} 条</Tag>
        </Space>
      }
      extra={
        <Button icon={<DownloadOutlined />} size="small">
          导出当前数据
        </Button>
      }
    >
      <Card
        type="inner"
        bordered={false}
        style={{ background: '#fafafa', marginBottom: 16 }}
        bodyStyle={{ padding: '12px 16px' }}
      >
        <Row gutter={[12, 8]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="搜索回路名称/编号/位置"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="按状态筛选"
              value={statusFilter}
              onChange={(v) => setStatusFilter(v)}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="normal">运行正常</Option>
              <Option value="fault">故障告警</Option>
              <Option value="pending">待确认</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Input
              placeholder="按位置筛选"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={24} md={4}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                查询
              </Button>
              <Button icon={<ClearOutlined />} onClick={handleClearFilters}>
                清除
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={filteredRecords}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
        scroll={{ x: 1500 }}
        locale={{ emptyText: '暂无符合条件的记录' }}
      />

      <Modal
        title="回路详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={800}
        destroyOnHidden
      >
        {selectedRecord && (
          <div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="回路名称">{selectedRecord.circuitName}</Descriptions.Item>
              <Descriptions.Item label="回路编号">{selectedRecord.circuitCode}</Descriptions.Item>
              <Descriptions.Item label="位置">{selectedRecord.location}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusLabels[selectedRecord.status].color}>
                  {statusLabels[selectedRecord.status].text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="电压">{selectedRecord.voltage} V</Descriptions.Item>
              <Descriptions.Item label="电流">{selectedRecord.current} A</Descriptions.Item>
              <Descriptions.Item label="功率">{selectedRecord.power} W</Descriptions.Item>
              <Descriptions.Item label="照度">{selectedRecord.illumination} lux</Descriptions.Item>
              <Descriptions.Item label="检查日期">{selectedRecord.inspectionDate}</Descriptions.Item>
              <Descriptions.Item label="检查员">{selectedRecord.inspector}</Descriptions.Item>
              <Descriptions.Item label="数据来源" span={2}>
                <Tag color={sourceLabels[selectedRecord.source]?.color || 'default'}>
                  {sourceLabels[selectedRecord.source]?.text || selectedRecord.source}
                </Tag>
                {selectedRecord.manualEdited && (
                  <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                    （{selectedRecord.editedBy} 于 {selectedRecord.editedAt?.slice(0, 10)} 编辑）
                  </Text>
                )}
              </Descriptions.Item>
              {selectedRecord.faultReason && (
                <Descriptions.Item label="故障原因" span={2}>
                  <Text type="danger">{selectedRecord.faultReason}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>

            <div style={{ marginBottom: 16 }}>
              <Title level={5} style={{ marginBottom: 8 }}>阈值检查</Title>
              <ThresholdAlert record={selectedRecord} showTag={false} />
            </div>

            {comparisons.length > 0 && (
              <div>
                <Title level={5} style={{ marginBottom: 8 }}>
                  <EditOutlined /> 补录前后差异对比
                </Title>
                <Table
                  size="small"
                  dataSource={comparisons}
                  rowKey="field"
                  pagination={false}
                  columns={[
                    {
                      title: '字段',
                      dataIndex: 'field',
                      key: 'field',
                      width: 100,
                    },
                    {
                      title: '补录前',
                      dataIndex: 'before',
                      key: 'before',
                      render: (val) => <Text delete type="secondary">{String(val) || '（空）'}</Text>,
                    },
                    {
                      title: '补录后',
                      dataIndex: 'after',
                      key: 'after',
                      render: (val) => <Text strong>{String(val) || '（空）'}</Text>,
                    },
                    {
                      title: '变化',
                      dataIndex: 'changed',
                      key: 'changed',
                      width: 80,
                      render: (changed) => (
                        changed
                          ? <Tag color="orange">已修改</Tag>
                          : <Tag color="green">无变化</Tag>
                      ),
                    },
                  ]}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </Card>
  );
};
