import React, { useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  DatePicker,
  message,
  Typography,
  Row,
  Col,
  Divider,
  Select,
  Alert,
  Descriptions,
  Empty,
} from 'antd';
import {
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DownloadOutlined,
  FileSearchOutlined,
  CheckCircleOutlined,
  TagsOutlined,
  ImportOutlined,
} from '@ant-design/icons';
import { useApp } from '../context/AppContext';
import type { StickerRecord } from '../types';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export const ManualStickerPanel: React.FC = () => {
  const { state, dispatch, getComparison } = useApp();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [currentSticker, setCurrentSticker] = useState<StickerRecord | null>(null);
  const [form] = Form.useForm();
  const [selectedRecordId, setSelectedRecordId] = useState<string>('');

  const handleAddSticker = () => {
    setCurrentSticker(null);
    form.resetFields();
    form.setFieldsValue({
      stickerDate: dayjs(),
      operator: '阿敏',
    });
    setEditModalOpen(true);
  };

  const handleEditSticker = (sticker: StickerRecord) => {
    setCurrentSticker(sticker);
    form.setFieldsValue({
      ...sticker,
      stickerDate: dayjs(sticker.stickerDate),
    });
    setEditModalOpen(true);
  };

  const handleSaveSticker = () => {
    form.validateFields().then((values) => {
      const stickerData: StickerRecord = {
        id: currentSticker?.id || `MANUAL-AMIN-${Date.now()}`,
        circuitName: values.circuitName,
        circuitCode: values.circuitCode,
        location: values.location,
        stickerDate: values.stickerDate.format('YYYY-MM-DD'),
        operator: values.operator,
        remark: values.remark,
      };

      if (currentSticker) {
        dispatch({ type: 'UPDATE_STICKER', payload: stickerData });
        message.success('贴纸信息已更新');
      } else {
        dispatch({ type: 'ADD_MANUAL_STICKER', payload: stickerData });
        message.success('手工补录贴纸已添加');
      }

      setEditModalOpen(false);
      setCurrentSticker(null);
    });
  };

  const handleApplyToRecord = (sticker: StickerRecord) => {
    setCurrentSticker(sticker);
    setSelectedRecordId('');
    setApplyModalOpen(true);
  };

  const handleConfirmApply = () => {
    if (!currentSticker || !selectedRecordId) {
      message.error('请选择要应用的目标记录');
      return;
    }

    dispatch({
      type: 'APPLY_STICKER_TO_RECORD',
      payload: {
        stickerId: currentSticker.id,
        recordId: selectedRecordId,
      },
    });

    message.success('贴纸信息已应用到记录，可在详情中查看差异对比');
    setApplyModalOpen(false);
    setCurrentSticker(null);
    setSelectedRecordId('');
  };

  const handleViewComparison = (sticker: StickerRecord) => {
    setCurrentSticker(sticker);
    setCompareModalOpen(true);
  };

  const handleExportSticker = (_sticker: StickerRecord) => {
    const dataStr = JSON.stringify(_sticker, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sticker-${_sticker.circuitCode}-${dayjs().format('YYYYMMDD')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success('贴纸已导出为 JSON 文件');
  };

  const handleImportReadBack = (_sticker: StickerRecord) => {
    dispatch({
      type: 'EXPORT_DATA',
      payload: {
        type: 'all',
        cardValue: state.circuitRecords.length,
      },
    });
    message.success('已执行导出读回校验，可在复盘页查看结果');
  };

  const columns = [
    {
      title: '回路名称',
      dataIndex: 'circuitName',
      key: 'circuitName',
      render: (text: string) => <Text strong>{text}</Text>,
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
      title: '贴纸日期',
      dataIndex: 'stickerDate',
      key: 'stickerDate',
    },
    {
      title: '录入人',
      dataIndex: 'operator',
      key: 'operator',
      render: (text: string) => (
        <Tag icon={<UserOutlined />} color="cyan">
          {text}
        </Tag>
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      render: (text: string) => text || <Text type="secondary">（无）</Text>,
    },
    {
      title: '操作',
      key: 'action',
      width: 320,
      render: (_: unknown, record: StickerRecord) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditSticker(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleApplyToRecord(record)}
          >
            应用到记录
          </Button>
          <Button
            type="link"
            size="small"
            icon={<FileSearchOutlined />}
            onClick={() => handleViewComparison(record)}
          >
            差异对比
          </Button>
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleExportSticker(record)}
          >
            导出
          </Button>
          <Button
            type="link"
            size="small"
            icon={<ImportOutlined />}
            onClick={() => handleImportReadBack(record)}
          >
            导出读回
          </Button>
        </Space>
      ),
    },
  ];

  const editedRecords = state.circuitRecords.filter(r => r.manualEdited && r.editedBy === '阿敏');
  const selectedRecord = state.circuitRecords.find(r => r.id === selectedRecordId);

  return (
    <Card
      title={
        <Space>
          <TagsOutlined style={{ color: '#13c2c2' }} />
          <span>阿敏手工补录 - 回路命名贴纸</span>
          <Tag color="cyan">{state.manualStickers.length} 条</Tag>
        </Space>
      }
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSticker}>
          新增手工贴纸
        </Button>
      }
    >
      <Alert
        type="info"
        showIcon
        message="关于手工补录"
        description={
          <div>
            <Paragraph style={{ marginBottom: 4 }}>
              当回路命名贴纸和手写补抄单不是同一天来的时候，可以在这里手工补录贴纸信息。
            </Paragraph>
            <Paragraph style={{ margin: 0 }}>
              补录后可以应用到现有记录，系统会自动保留原始值用于差异对比，并支持导出读回校验。
            </Paragraph>
          </div>
        }
        style={{ marginBottom: 16 }}
      />

      {state.manualStickers.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Row gutter={[16, 8]}>
            <Col span={8}>
              <Card size="small" type="inner">
                <Text type="secondary">手工贴纸总数</Text>
                <Title level={3} style={{ margin: '4px 0', color: '#13c2c2' }}>
                  {state.manualStickers.length}
                </Title>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" type="inner">
                <Text type="secondary">已应用到记录</Text>
                <Title level={3} style={{ margin: '4px 0', color: '#52c41a' }}>
                  {editedRecords.length}
                </Title>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" type="inner">
                <Text type="secondary">阿敏补录</Text>
                <Title level={3} style={{ margin: '4px 0', color: '#1890ff' }}>
                  {state.manualStickers.filter(s => s.operator === '阿敏').length}
                </Title>
              </Card>
            </Col>
          </Row>
          <Divider style={{ margin: '16px 0' }} />
        </div>
      )}

      <Table
        columns={columns}
        dataSource={state.manualStickers}
        rowKey="id"
        pagination={{
          pageSize: 5,
          showSizeChanger: false,
        }}
        locale={{ emptyText: '还没有手工补录的贴纸记录' }}
      />

      <Modal
        title={
          <Space>
            {currentSticker ? <EditOutlined /> : <PlusOutlined />}
            <span>{currentSticker ? '编辑手工贴纸' : '新增手工贴纸'}</span>
          </Space>
        }
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        footer={null}
        width={600}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item
              name="circuitName"
              label="回路名称"
              rules={[{ required: true, message: '请输入回路名称' }]}
            >
              <Input placeholder="如：风场中心区应急照明回路" />
            </Form.Item>
            <Form.Item
              name="circuitCode"
              label="回路编号"
              rules={[{ required: true, message: '请输入回路编号' }]}
            >
              <Input placeholder="如：LIGHT-C-EMERGENCY" />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
            <Form.Item
              name="location"
              label="位置"
              rules={[{ required: true, message: '请输入位置' }]}
            >
              <Input placeholder="如：控制中心地下室" />
            </Form.Item>
            <Form.Item
              name="stickerDate"
              label="贴纸日期"
              rules={[{ required: true, message: '请选择日期' }]}
            >
              <DatePicker style={{ width: '100%' }} maxDate={dayjs()} />
            </Form.Item>
            <Form.Item
              name="operator"
              label="录入人"
              rules={[{ required: true, message: '请输入录入人' }]}
            >
              <Input defaultValue="阿敏" />
            </Form.Item>
          </div>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="请输入备注信息，如补录原因等" />
          </Form.Item>
        </Form>
        <Space>
          <Button type="primary" onClick={handleSaveSticker}>保存</Button>
          <Button onClick={() => setEditModalOpen(false)}>取消</Button>
        </Space>
      </Modal>

      <Modal
        title={
          <Space>
            <CheckCircleOutlined />
            <span>应用贴纸到记录</span>
          </Space>
        }
        open={applyModalOpen}
        onCancel={() => setApplyModalOpen(false)}
        footer={null}
        width={700}
        destroyOnHidden
      >
        {currentSticker && (
          <div>
            <Alert
              type="info"
              showIcon
              message="当前贴纸信息"
              description={
                <Descriptions size="small" column={2} bordered>
                  <Descriptions.Item label="回路名称">{currentSticker.circuitName}</Descriptions.Item>
                  <Descriptions.Item label="回路编号">{currentSticker.circuitCode}</Descriptions.Item>
                  <Descriptions.Item label="位置">{currentSticker.location}</Descriptions.Item>
                  <Descriptions.Item label="录入人">{currentSticker.operator}</Descriptions.Item>
                </Descriptions>
              }
              style={{ marginBottom: 16 }}
            />

            <Form layout="vertical">
              <Form.Item
                label="选择目标记录"
                required
                help="选择要应用此贴纸信息的回路记录，系统会自动对比修改前后的差异"
              >
                <Select
                  placeholder="请选择要应用的目标记录"
                  value={selectedRecordId}
                  onChange={setSelectedRecordId}
                  showSearch
                  optionFilterProp="children"
                  style={{ width: '100%' }}
                >
                  {state.circuitRecords.map(record => (
                    <Option key={record.id} value={record.id}>
                      {record.circuitName} ({record.circuitCode}) - {record.location}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Form>

            {selectedRecord && (
              <Alert
                type="warning"
                showIcon
                message="应用后将更新以下字段"
                description={
                  <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
                    <li>回路名称：{selectedRecord.circuitName} → {currentSticker.circuitName}</li>
                    <li>回路编号：{selectedRecord.circuitCode} → {currentSticker.circuitCode}</li>
                    <li>位置：{selectedRecord.location} → {currentSticker.location}</li>
                  </ul>
                }
                style={{ marginBottom: 16 }}
              />
            )}

            <Space>
              <Button type="primary" onClick={handleConfirmApply} disabled={!selectedRecordId}>
                确认应用
              </Button>
              <Button onClick={() => setApplyModalOpen(false)}>取消</Button>
            </Space>
          </div>
        )}
      </Modal>

      <Modal
        title={
          <Space>
            <FileSearchOutlined />
            <span>补录前后差异对比</span>
          </Space>
        }
        open={compareModalOpen}
        onCancel={() => setCompareModalOpen(false)}
        footer={
          <Button onClick={() => setCompareModalOpen(false)}>关闭</Button>
        }
        width={700}
        destroyOnHidden
      >
        {currentSticker && editedRecords.length > 0 ? (
          <div>
            <Alert
              type="info"
              showIcon
              message={`贴纸：${currentSticker.circuitName}`}
              description={`录入人：${currentSticker.operator} | 日期：${currentSticker.stickerDate}`}
              style={{ marginBottom: 16 }}
            />
            {editedRecords.map(record => {
              const recordComparisons = getComparison(record.id);
              if (recordComparisons.length === 0) return null;
              return (
                <div key={record.id} style={{ marginBottom: 16 }}>
                  <Title level={5} style={{ marginBottom: 8 }}>
                    记录：{record.circuitName}
                  </Title>
                  <Table
                    size="small"
                    dataSource={recordComparisons}
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
                        render: (val) => (
                          <Text delete type="secondary">
                            {String(val) || '（空）'}
                          </Text>
                        ),
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
              );
            })}
            {editedRecords.every(r => getComparison(r.id).length === 0) && (
              <Empty description="暂无差异对比数据" />
            )}
          </div>
        ) : (
          <Empty description="还没有应用过的记录，无法对比差异" />
        )}
      </Modal>
    </Card>
  );
};
