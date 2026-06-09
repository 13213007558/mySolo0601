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
  InputNumber,
  DatePicker,
  Select,
  message,
  Typography,
  Alert,
} from 'antd';
import {
  WarningOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import { useApp } from '../context/AppContext';
import { validateRecord } from '../utils/validation';
import type { ProblemRecord, CircuitRecord } from '../types';
import dayjs from 'dayjs';

const { Text } = Typography;
const { Option } = Select;

const problemTypeLabels: Record<string, { text: string; color: string }> = {
  format: { text: '格式错误', color: 'orange' },
  logic: { text: '逻辑错误', color: 'red' },
  missing: { text: '字段缺失', color: 'gold' },
  range: { text: '范围异常', color: 'magenta' },
};

export const ProblemArea: React.FC = () => {
  const { state, dispatch } = useApp();
  const [fixModalOpen, setFixModalOpen] = useState(false);
  const [currentProblem, setCurrentProblem] = useState<ProblemRecord | null>(null);
  const [form] = Form.useForm();

  const handleFix = (record: ProblemRecord) => {
    setCurrentProblem(record);
    form.setFieldsValue({
      ...record,
      inspectionDate: record.inspectionDate ? dayjs(record.inspectionDate) : null,
    });
    setFixModalOpen(true);
  };

  const handleSaveFix = () => {
    form.validateFields().then((values) => {
      if (!currentProblem) return;

      const fixedRecord: CircuitRecord = {
        ...currentProblem,
        ...values,
        inspectionDate: values.inspectionDate?.format('YYYY-MM-DD') || '',
        status: values.status || 'pending',
        originalValues: {
          circuitName: currentProblem.circuitName,
          circuitCode: currentProblem.circuitCode,
          location: currentProblem.location,
        },
      };

      const { isValid } = validateRecord(fixedRecord, state.thresholds);
      if (!isValid) {
        message.error('修正后的记录仍然有问题，请检查');
        return;
      }

      dispatch({
        type: 'FIX_PROBLEM',
        payload: {
          recordId: currentProblem.id,
          fixedRecord,
        },
      });

      message.success('问题已修正，记录已进入统计区');
      setFixModalOpen(false);
      setCurrentProblem(null);
    });
  };

  const columns = [
    {
      title: '问题类型',
      dataIndex: 'problemType',
      key: 'problemType',
      width: 100,
      render: (type: string) => {
        const label = problemTypeLabels[type] || { text: type, color: 'default' };
        return <Tag color={label.color}>{label.text}</Tag>;
      },
    },
    {
      title: '回路名称',
      dataIndex: 'circuitName',
      key: 'circuitName',
      render: (text: string) => text || <Text type="danger">（空）</Text>,
    },
    {
      title: '回路编号',
      dataIndex: 'circuitCode',
      key: 'circuitCode',
      render: (text: string) => text || <Text type="danger">（空）</Text>,
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      render: (text: string) => text || <Text type="danger">（空）</Text>,
    },
    {
      title: '电压',
      dataIndex: 'voltage',
      key: 'voltage',
      render: (val: number) => `${val}V`,
    },
    {
      title: '电流',
      dataIndex: 'current',
      key: 'current',
      render: (val: number) => `${val}A`,
    },
    {
      title: '功率',
      dataIndex: 'power',
      key: 'power',
      render: (val: number) => `${val}W`,
    },
    {
      title: '照度',
      dataIndex: 'illumination',
      key: 'illumination',
      render: (val: number) => `${val}lux`,
    },
    {
      title: '问题说明',
      dataIndex: 'badReason',
      key: 'badReason',
      render: (text: string) => (
        <Text type="danger" style={{ fontSize: 12 }}>{text}</Text>
      ),
    },
    {
      title: '建议修正',
      dataIndex: 'suggestedFix',
      key: 'suggestedFix',
      render: (text: string) => (
        <Tag icon={<BulbOutlined />} color="blue" style={{ fontSize: 12 }}>
          {text}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: ProblemRecord) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<ToolOutlined />}
            onClick={() => handleFix(record)}
          >
            修正
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={
        <Space>
          <WarningOutlined style={{ color: '#ff4d4f' }} />
          <span>问题区 - 手写补抄单坏行</span>
          <Tag color="red">{state.problemRecords.length} 条待处理</Tag>
        </Space>
      }
      extra={
        <Text type="secondary" style={{ fontSize: 12 }}>
          这些记录有问题，需要人工修正后才能进入统计
        </Text>
      }
      style={{ borderColor: '#ffccc7' }}
      bodyStyle={{ background: '#fff2f0' }}
    >
      {state.problemRecords.length > 0 && (
        <Alert
          type="warning"
          showIcon
          message="坏行不会进入统计"
          description="请及时检查并修正这些问题记录。修正后的记录会自动转移到正常统计区。"
          style={{ marginBottom: 16 }}
        />
      )}

      <Table
        columns={columns}
        dataSource={state.problemRecords}
        rowKey="id"
        pagination={{
          pageSize: 5,
          showSizeChanger: false,
        }}
        scroll={{ x: 1400 }}
        locale={{ emptyText: '问题区暂时空空如也，干得漂亮！' }}
      />

      <Modal
        title={
          <Space>
            <ToolOutlined />
            <span>修正问题记录</span>
          </Space>
        }
        open={fixModalOpen}
        onCancel={() => setFixModalOpen(false)}
        footer={null}
        width={700}
        destroyOnHidden
      >
        {currentProblem && (
          <div>
            <Alert
              type="error"
              showIcon
              message="原始问题"
              description={currentProblem.badReason}
              style={{ marginBottom: 16 }}
            />
            {currentProblem.suggestedFix && (
              <Alert
                type="info"
                showIcon
                message="修正建议"
                description={currentProblem.suggestedFix}
                style={{ marginBottom: 16 }}
              />
            )}

            <Form form={form} layout="vertical">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
                <Form.Item
                  name="circuitName"
                  label="回路名称"
                  rules={[{ required: true, message: '请输入回路名称' }]}
                >
                  <Input placeholder="请输入回路名称" />
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 16px' }}>
                <Form.Item
                  name="voltage"
                  label="电压(V)"
                  rules={[{ required: true, message: '请输入电压' }]}
                >
                  <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>
                <Form.Item
                  name="current"
                  label="电流(A)"
                  rules={[{ required: true, message: '请输入电流' }]}
                >
                  <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
                </Form.Item>
                <Form.Item
                  name="power"
                  label="功率(W)"
                  rules={[{ required: true, message: '请输入功率' }]}
                >
                  <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>
                <Form.Item
                  name="illumination"
                  label="照度(lux)"
                  rules={[{ required: true, message: '请输入照度' }]}
                >
                  <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
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
                  <Input />
                </Form.Item>
                <Form.Item
                  name="status"
                  label="状态"
                  rules={[{ required: true, message: '请选择状态' }]}
                >
                  <Select>
                    <Option value="normal">运行正常</Option>
                    <Option value="fault">故障告警</Option>
                    <Option value="pending">待确认</Option>
                  </Select>
                </Form.Item>
              </div>
            </Form>

            <Space style={{ marginTop: 16 }}>
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleSaveFix}>
                保存并加入统计
              </Button>
              <Button onClick={() => setFixModalOpen(false)}>取消</Button>
            </Space>
          </div>
        )}
      </Modal>
    </Card>
  );
};
