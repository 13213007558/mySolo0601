import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Button,
  Space,
  Table,
  Tag,
  message,
  Card,
  Typography,
  Divider,
  Alert,
} from 'antd';
import {
  UploadOutlined,
  FileTextOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type { CircuitRecord, ProblemRecord } from '../types';
import { useApp } from '../context/AppContext';
import { validateRecord } from '../utils/validation';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface HandwrittenImportProps {
  open: boolean;
  onClose: () => void;
}

interface DraftRecord {
  key: string;
  circuitName: string;
  circuitCode: string;
  location: string;
  voltage: number;
  current: number;
  power: number;
  illumination: number;
  inspectionDate: string;
  inspector: string;
  isValid: boolean;
  error: string;
}

export const HandwrittenImport: React.FC<HandwrittenImportProps> = ({ open, onClose }) => {
  const { state, dispatch } = useApp();
  const [form] = Form.useForm();
  const [draftRecords, setDraftRecords] = useState<DraftRecord[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleAddRecord = () => {
    form.validateFields().then((values) => {
      const record: Partial<CircuitRecord> = {
        ...values,
        inspectionDate: values.inspectionDate?.format('YYYY-MM-DD') || '',
        source: 'handwritten',
        status: 'pending',
      };

      const { isValid, problems } = validateRecord(record, state.thresholds);
      const draftRecord: DraftRecord = {
        key: `draft-${Date.now()}`,
        circuitName: record.circuitName || '',
        circuitCode: record.circuitCode || '',
        location: record.location || '',
        voltage: record.voltage || 0,
        current: record.current || 0,
        power: record.power || 0,
        illumination: record.illumination || 0,
        inspectionDate: record.inspectionDate || '',
        inspector: record.inspector || '',
        isValid,
        error: problems[0]?.badReason || '',
      };

      setDraftRecords([...draftRecords, draftRecord]);
      form.resetFields();
      message.success('已添加到待导入列表');
    }).catch(() => {
      message.error('请填写完整必填项');
    });
  };

  const handleRemoveRecord = (key: string) => {
    setDraftRecords(draftRecords.filter(r => r.key !== key));
  };

  const handleImport = () => {
    if (draftRecords.length === 0) {
      message.warning('请先添加至少一条记录');
      return;
    }

    const validRecords: CircuitRecord[] = [];
    const problemRecords: ProblemRecord[] = [];

    draftRecords.forEach(draft => {
      const record: Partial<CircuitRecord> = {
        id: `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        circuitName: draft.circuitName,
        circuitCode: draft.circuitCode,
        location: draft.location,
        voltage: draft.voltage,
        current: draft.current,
        power: draft.power,
        illumination: draft.illumination,
        inspectionDate: draft.inspectionDate,
        inspector: draft.inspector,
        source: 'handwritten',
        status: 'pending',
      };

      const { isValid, problems } = validateRecord(record, state.thresholds);
      if (isValid) {
        validRecords.push(record as CircuitRecord);
      } else {
        problemRecords.push(...problems);
      }
    });

    dispatch({
      type: 'IMPORT_HANDWRITTEN',
      payload: [...validRecords, ...problemRecords] as Partial<CircuitRecord>[],
    });

    message.success(
      `导入完成：${validRecords.length} 条正常记录已进入统计，${problemRecords.length} 条问题记录留在问题区`
    );

    setDraftRecords([]);
    setShowPreview(false);
    onClose();
  };

  const columns = [
    {
      title: '状态',
      dataIndex: 'isValid',
      key: 'isValid',
      width: 80,
      render: (isValid: boolean) => (
        isValid
          ? <Tag icon={<CheckCircleOutlined />} color="green">正常</Tag>
          : <Tag icon={<CloseCircleOutlined />} color="red">有问题</Tag>
      ),
    },
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
      title: '电压(V)',
      dataIndex: 'voltage',
      key: 'voltage',
    },
    {
      title: '电流(A)',
      dataIndex: 'current',
      key: 'current',
    },
    {
      title: '功率(W)',
      dataIndex: 'power',
      key: 'power',
    },
    {
      title: '照度(lux)',
      dataIndex: 'illumination',
      key: 'illumination',
    },
    {
      title: '检查日期',
      dataIndex: 'inspectionDate',
      key: 'inspectionDate',
    },
    {
      title: '问题说明',
      dataIndex: 'error',
      key: 'error',
      render: (error: string, record: DraftRecord) => (
        record.isValid ? <Text type="success">没问题</Text> : <Text type="danger">{error}</Text>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: DraftRecord) => (
        <Button type="link" danger onClick={() => handleRemoveRecord(record.key)}>
          删除
        </Button>
      ),
    },
  ];

  const validCount = draftRecords.filter(r => r.isValid).length;
  const problemCount = draftRecords.filter(r => !r.isValid).length;

  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined />
          <span>导入手写补抄单</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={900}
      footer={null}
      destroyOnHidden
    >
      {!showPreview ? (
        <Card bordered={false} style={{ padding: 0 }}>
          <Title level={5} style={{ marginTop: 0 }}>
            填写补抄单内容
          </Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            请逐行录入手写补抄单的内容。填完一条点击"添加到列表"，全部填完后预览并导入。
          </Text>

          <Form form={form} layout="vertical">
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '0 16px',
            }}>
              <Form.Item
                name="circuitName"
                label="回路名称"
                rules={[{ required: true, message: '请输入回路名称' }]}
              >
                <Input placeholder="如：风场东区照明回路A" />
              </Form.Item>
              <Form.Item
                name="circuitCode"
                label="回路编号"
                rules={[{ required: true, message: '请输入回路编号' }]}
              >
                <Input placeholder="如：LIGHT-E-A01" />
              </Form.Item>
              <Form.Item
                name="location"
                label="位置"
                rules={[{ required: true, message: '请输入位置' }]}
              >
                <Input placeholder="如：东区A塔" />
              </Form.Item>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1fr',
              gap: '0 16px',
            }}>
              <Form.Item
                name="voltage"
                label="电压(V)"
                rules={[{ required: true, message: '请输入电压' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} placeholder="220" />
              </Form.Item>
              <Form.Item
                name="current"
                label="电流(A)"
                rules={[{ required: true, message: '请输入电流' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} step={0.1} placeholder="2.5" />
              </Form.Item>
              <Form.Item
                name="power"
                label="功率(W)"
                rules={[{ required: true, message: '请输入功率' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} placeholder="550" />
              </Form.Item>
              <Form.Item
                name="illumination"
                label="照度(lux)"
                rules={[{ required: true, message: '请输入照度' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} placeholder="450" />
              </Form.Item>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0 16px',
            }}>
              <Form.Item
                name="inspectionDate"
                label="检查日期"
                rules={[{ required: true, message: '请选择检查日期' }]}
              >
                <DatePicker style={{ width: '100%' }} maxDate={dayjs()} />
              </Form.Item>
              <Form.Item
                name="inspector"
                label="检查员"
                rules={[{ required: true, message: '请输入检查员' }]}
              >
                <Input placeholder="如：张工" />
              </Form.Item>
            </div>
          </Form>

          <Space style={{ marginTop: 8 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRecord}>
              添加到列表
            </Button>
            <Button
              icon={<UploadOutlined />}
              disabled={draftRecords.length === 0}
              onClick={() => setShowPreview(true)}
            >
              预览并导入 ({draftRecords.length} 条)
            </Button>
          </Space>

          {draftRecords.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
              <Text strong>已添加 {draftRecords.length} 条记录：</Text>
              <Space style={{ marginLeft: 16 }}>
                <Tag color="green">{validCount} 条正常</Tag>
                <Tag color="red">{problemCount} 条有问题</Tag>
              </Space>
            </div>
          )}
        </Card>
      ) : (
        <Card bordered={false} style={{ padding: 0 }}>
          <Title level={5} style={{ marginTop: 0 }}>
            预览导入结果
          </Title>
          <Alert
            style={{ marginBottom: 16 }}
            message={
              <Space>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                <span>
                  共 {draftRecords.length} 条记录，其中 <Tag color="green">{validCount} 条正常</Tag> 将进入统计，
                  <Tag color="red">{problemCount} 条有问题</Tag> 将留在问题区等待处理
                </span>
              </Space>
            }
            type="info"
            showIcon
          />

          <Table
            columns={columns}
            dataSource={draftRecords}
            pagination={false}
            size="small"
            scroll={{ x: 1200 }}
          />

          <Divider />

          <Space>
            <Button type="primary" onClick={handleImport}>
              确认导入
            </Button>
            <Button onClick={() => setShowPreview(false)}>
              返回继续添加
            </Button>
          </Space>
        </Card>
      )}
    </Modal>
  );
};
