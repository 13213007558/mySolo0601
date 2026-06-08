import React from 'react';
import { Modal, Form, Input, InputNumber, Select, message, Typography, Descriptions, Tag, Space, Button } from 'antd';
import type { MilkRecord } from '../types';
import { STATUS_TEXT, SOURCE_TEXT, STATUS_COLOR } from '../types';
import { recordApi } from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface ReviewPanelProps {
  visible: boolean;
  record: MilkRecord | null;
  operator: string;
  onClose: () => void;
}

const ReviewPanel: React.FC<ReviewPanelProps> = ({ visible, record, operator, onClose }) => {
  const [form] = Form.useForm();

  if (!record) return null;

  const handleReview = async (values: any) => {
    try {
      await recordApi.review(record.id, {
        ...values,
        reviewer: values.reviewer || operator,
      });
      message.success('复核成功');
      form.resetFields();
      onClose();
    } catch (error) {
      message.error('复核失败');
    }
  };

  return (
    <Modal
      title={
        <Title level={4} style={{ margin: 0 }}>
          人工复核改判
        </Title>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      destroyOnClose
    >
      <Descriptions column={2} size="small" style={{ marginBottom: '16px' }}>
        <Descriptions.Item label="儿童">{record.child.name} ({record.child.age}岁)</Descriptions.Item>
        <Descriptions.Item label="日期">{dayjs(record.recordDate).format('YYYY-MM-DD')}</Descriptions.Item>
        <Descriptions.Item label="当前奶量">
          <Text strong style={{ fontSize: '18px' }}>{record.amount}ml</Text>
        </Descriptions.Item>
        <Descriptions.Item label="来源">
          <Tag color={record.source === 'PARENT_MESSAGE' ? 'geekblue' : 'purple'}>
            {SOURCE_TEXT[record.source]}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="当前状态">
          <Tag color={STATUS_COLOR[record.status]}>{STATUS_TEXT[record.status]}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="当前原因">{record.reason || '-'}</Descriptions.Item>
        <Descriptions.Item label="家长留言" span={2}>
          {record.parentMessage || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="交接单编号" span={2}>
          {record.paperNote || '-'}
        </Descriptions.Item>
      </Descriptions>

      <div style={{ background: '#fffbe6', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
        <Text type="warning">
          复核将覆盖原有状态和原因。人工改判优先级最高，所有历史操作都会被记录。
        </Text>
      </div>

      <Form form={form} layout="vertical" onFinish={handleReview}>
        <Form.Item
          name="newStatus"
          label="复核后状态"
          rules={[{ required: true, message: '请选择状态' }]}
        >
          <Select>
            <Option value="CONFIRMED">已确认</Option>
            <Option value="REVIEWED">已复核（最终）</Option>
            <Option value="REJECTED">已驳回（无效）</Option>
          </Select>
        </Form.Item>
        <Form.Item name="newAmount" label="修改奶量(ml)">
          <InputNumber min={0} max={1000} style={{ width: '100%' }} placeholder="如无需修改请留空" />
        </Form.Item>
        <Form.Item
          name="newReason"
          label="处理原因"
          rules={[{ required: true, message: '请填写处理原因' }]}
        >
          <TextArea rows={3} placeholder="请详细说明处理原因，此内容将覆盖原有原因" />
        </Form.Item>
        <Form.Item
          name="reviewNote"
          label="复核备注"
          rules={[{ required: true, message: '请填写复核备注' }]}
        >
          <TextArea rows={3} placeholder="请填写复核说明，用于历史记录追踪" />
        </Form.Item>
        <Form.Item
          name="reviewer"
          label="复核人"
          initialValue={operator}
          rules={[{ required: true, message: '请选择复核人' }]}
        >
          <Select>
            <Option value="前台小张">前台小张</Option>
            <Option value="前台小李">前台小李</Option>
            <Option value="园长">园长</Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              确认复核
            </Button>
            <Button onClick={onClose}>取消</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ReviewPanel;
