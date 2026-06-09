import React, { useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  InputNumber,
  Select,
  message,
  Typography,
  Row,
  Col,
  Divider,
  Alert,
  Descriptions,
  Statistic,
} from 'antd';
import {
  BarChartOutlined,
  PlusOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  DownloadOutlined,
  FileTextOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useApp } from '../context/AppContext';
import type { ExportRecord } from '../types';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const exportTypeLabels: Record<string, string> = {
  sticker: '贴纸数据',
  handwritten: '补抄单数据',
  all: '全部数据',
};

export const ReviewPage: React.FC = () => {
  const { state, dispatch } = useApp();
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [currentExport, setCurrentExport] = useState<ExportRecord | null>(null);
  const [form] = Form.useForm();

  const handleNewExport = () => {
    form.resetFields();
    setExportModalOpen(true);
  };

  const handleCreateExport = () => {
    form.validateFields().then((values) => {
      dispatch({
        type: 'EXPORT_DATA',
        payload: {
          type: values.exportType,
          cardValue: values.cardValue,
        },
      });
      message.success('导出记录已创建，请查看对比结果');
      setExportModalOpen(false);
    });
  };

  const handleViewDetail = (record: ExportRecord) => {
    setCurrentExport(record);
    setDetailModalOpen(true);
  };

  const matchedCount = state.exportRecords.filter(r => r.matched).length;
  const mismatchedCount = state.exportRecords.filter(r => !r.matched).length;

  const columns = [
    {
      title: '导出时间',
      dataIndex: 'exportTime',
      key: 'exportTime',
      width: 180,
    },
    {
      title: '导出类型',
      dataIndex: 'exportType',
      key: 'exportType',
      width: 120,
      render: (type: string) => (
        <Tag color="blue">{exportTypeLabels[type] || type}</Tag>
      ),
    },
    {
      title: '卡片记录数',
      dataIndex: 'cardValue',
      key: 'cardValue',
      width: 120,
      render: (val: number) => (
        <Text strong style={{ color: '#1890ff' }}>{val}</Text>
      ),
    },
    {
      title: '系统导出数',
      dataIndex: 'exportedValue',
      key: 'exportedValue',
      width: 120,
      render: (val: number) => (
        <Text strong style={{ color: '#722ed1' }}>{val}</Text>
      ),
    },
    {
      title: '差异数',
      key: 'diff',
      width: 100,
      render: (_: unknown, record: ExportRecord) => {
        const diff = record.exportedValue - record.cardValue;
        if (diff === 0) {
          return <Text type="success">0</Text>;
        }
        return (
          <Text type="danger" strong>
            {diff > 0 ? '+' : ''}{diff}
          </Text>
        );
      },
    },
    {
      title: '核对结果',
      dataIndex: 'matched',
      key: 'matched',
      width: 120,
      render: (matched: boolean) => (
        matched
          ? <Tag icon={<CheckCircleOutlined />} color="green">一致 ✓</Tag>
          : <Tag icon={<CloseCircleOutlined />} color="red">不一致 ✗</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: ExportRecord) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          查看详情
        </Button>
      ),
    },
  ];

  const originalColumns = [
    {
      title: '回路名称',
      dataIndex: 'circuitName',
      key: 'circuitName',
    },
    {
      title: '回路编号',
      dataIndex: 'circuitCode',
      key: 'circuitCode',
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          normal: 'green',
          fault: 'red',
          pending: 'orange',
        };
        const texts: Record<string, string> = {
          normal: '正常',
          fault: '故障',
          pending: '待确认',
        };
        return <Tag color={colors[status] || 'default'}>{texts[status] || status}</Tag>;
      },
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      render: (source: string) => {
        const texts: Record<string, string> = {
          sticker: '贴纸',
          handwritten: '补抄单',
          manual: '手工',
        };
        return texts[source] || source;
      },
    },
    {
      title: '原始电压',
      dataIndex: 'voltage',
      key: 'voltage',
      render: (val: number, record: ExportRecord['originalRecords'][0]) => {
        const original = record.originalValues?.voltage;
        return (
          <Space direction="vertical" size={0}>
            <Text strong>{val}V</Text>
            {original !== undefined && original !== val && (
              <Text delete type="secondary" style={{ fontSize: 11 }}>
                原：{original}V
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: '原始电流',
      dataIndex: 'current',
      key: 'current',
      render: (val: number, record: ExportRecord['originalRecords'][0]) => {
        const original = record.originalValues?.current;
        return (
          <Space direction="vertical" size={0}>
            <Text strong>{val}A</Text>
            {original !== undefined && original !== val && (
              <Text delete type="secondary" style={{ fontSize: 11 }}>
                原：{original}A
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: '原始功率',
      dataIndex: 'power',
      key: 'power',
      render: (val: number, record: ExportRecord['originalRecords'][0]) => {
        const original = record.originalValues?.power;
        return (
          <Space direction="vertical" size={0}>
            <Text strong>{val}W</Text>
            {original !== undefined && original !== val && (
              <Text delete type="secondary" style={{ fontSize: 11 }}>
                原：{original}W
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: '原始照度',
      dataIndex: 'illumination',
      key: 'illumination',
      render: (val: number, record: ExportRecord['originalRecords'][0]) => {
        const original = record.originalValues?.illumination;
        return (
          <Space direction="vertical" size={0}>
            <Text strong>{val}lux</Text>
            {original !== undefined && original !== val && (
              <Text delete type="secondary" style={{ fontSize: 11 }}>
                原：{original}lux
              </Text>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <Card
      title={
        <Space>
          <BarChartOutlined style={{ color: '#722ed1' }} />
          <span>数据复盘 - 导出核对</span>
          <Tag color="purple">{state.exportRecords.length} 条记录</Tag>
        </Space>
      }
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleNewExport}>
          新建导出核对
        </Button>
      }
    >
      <Alert
        type="info"
        showIcon
        message="关于导出核对"
        description={
          <div>
            <Paragraph style={{ marginBottom: 4 }}>
              当手工卡片记录数和系统导出数对不上时，复盘页会保留所有原始值供后续核对。
            </Paragraph>
            <Paragraph style={{ margin: 0 }}>
              每次导出都会记录当时的数据快照，即使后续数据有修改，也能追溯到导出时的原始数值。
            </Paragraph>
          </div>
        }
        style={{ marginBottom: 16 }}
      />

      {state.exportRecords.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Row gutter={[16, 8]}>
            <Col span={8}>
              <Card size="small" type="inner">
                <Statistic
                  title="总核对次数"
                  value={state.exportRecords.length}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" type="inner">
                <Statistic
                  title="核对一致"
                  value={matchedCount}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" type="inner">
                <Statistic
                  title="核对不一致"
                  value={mismatchedCount}
                  prefix={<WarningOutlined />}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
          </Row>
          <Divider style={{ margin: '16px 0' }} />
        </div>
      )}

      {mismatchedCount > 0 && (
        <Alert
          type="warning"
          showIcon
          message={`有 ${mismatchedCount} 次导出核对不一致`}
          description="请点击右侧'查看详情'按钮，对比卡片记录数和系统导出数的差异，并检查原始数据是否有手工修改痕迹。"
          style={{ marginBottom: 16 }}
        />
      )}

      <Table
        columns={columns}
        dataSource={state.exportRecords}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
        }}
        locale={{ emptyText: '还没有导出核对记录' }}
        rowClassName={(record) => (!record.matched ? 'mismatched-row' : '')}
        scroll={{ x: 900 }}
      />

      <Modal
        title={
          <Space>
            <DownloadOutlined />
            <span>新建导出核对</span>
          </Space>
        }
        open={exportModalOpen}
        onCancel={() => setExportModalOpen(false)}
        footer={null}
        width={500}
        destroyOnHidden
      >
        <Alert
          type="info"
          showIcon
          message="请填写手工卡片上的记录数"
          description="系统会自动对比卡片数和实际导出数是否一致。如不一致，将标记为差异并保留原始值。"
          style={{ marginBottom: 16 }}
        />
        <Form form={form} layout="vertical">
          <Form.Item
            name="exportType"
            label="导出数据类型"
            rules={[{ required: true, message: '请选择导出类型' }]}
          >
            <Select placeholder="请选择要导出的数据类型">
              <Option value="sticker">贴纸录入数据</Option>
              <Option value="handwritten">手写补抄单数据</Option>
              <Option value="all">全部数据</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="cardValue"
            label={
              <span>
                手工卡片记录数 <Text type="danger">*</Text>
              </span>
            }
            help="请输入你手工在卡片上数出来的记录条数"
            rules={[{ required: true, message: '请输入卡片上的记录数' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              placeholder="请输入卡片上的记录数"
            />
          </Form.Item>
        </Form>
        <Space>
          <Button type="primary" onClick={handleCreateExport}>
            开始核对
          </Button>
          <Button onClick={() => setExportModalOpen(false)}>取消</Button>
        </Space>
      </Modal>

      <Modal
        title={
          <Space>
            <HistoryOutlined />
            <span>导出记录详情 - 原始值保留</span>
          </Space>
        }
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={
          <Button onClick={() => setDetailModalOpen(false)}>关闭</Button>
        }
        width={1100}
        destroyOnHidden
      >
        {currentExport && (
          <div>
            {!currentExport.matched && (
              <Alert
                type="error"
                showIcon
                message="导出核对不一致"
                description={
                  <Space>
                    <Text>卡片记录数：</Text>
                    <Text strong style={{ color: '#1890ff', fontSize: 16 }}>
                      {currentExport.cardValue}
                    </Text>
                    <Text>，系统导出数：</Text>
                    <Text strong style={{ color: '#722ed1', fontSize: 16 }}>
                      {currentExport.exportedValue}
                    </Text>
                    <Text type="danger" strong>
                      差异：{currentExport.exportedValue - currentExport.cardValue > 0 ? '+' : ''}
                      {currentExport.exportedValue - currentExport.cardValue} 条
                    </Text>
                  </Space>
                }
                style={{ marginBottom: 16 }}
              />
            )}

            {currentExport.matched && (
              <Alert
                type="success"
                showIcon
                message="导出核对一致"
                description={`卡片记录数 ${currentExport.cardValue} 条，系统导出数 ${currentExport.exportedValue} 条，完全一致。`}
                style={{ marginBottom: 16 }}
              />
            )}

            <Descriptions bordered size="small" column={3} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="导出时间">{currentExport.exportTime}</Descriptions.Item>
              <Descriptions.Item label="导出类型">
                {exportTypeLabels[currentExport.exportType]}
              </Descriptions.Item>
              <Descriptions.Item label="原始记录数">
                {currentExport.originalRecords.length} 条
              </Descriptions.Item>
            </Descriptions>

            <Title level={5} style={{ marginBottom: 8 }}>
              导出时的原始数据快照
            </Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
              以下是导出时保留的原始值，划线部分表示该记录曾被手工修改过，这里保留的是导出时的数值。
            </Text>
            <Table
              size="small"
              columns={originalColumns}
              dataSource={currentExport.originalRecords}
              rowKey="id"
              pagination={false}
              scroll={{ x: 1200 }}
            />
          </div>
        )}
      </Modal>

      <style>{`
        .mismatched-row {
          background: #fff2f0 !important;
        }
        .mismatched-row:hover > td {
          background: #fff1f0 !important;
        }
      `}</style>
    </Card>
  );
};
