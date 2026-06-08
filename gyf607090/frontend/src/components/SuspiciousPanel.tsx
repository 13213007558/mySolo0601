import React, { useState } from 'react';
import { Modal, List, Tag, Button, Space, Form, Input, InputNumber, Select, message, Typography, Divider, Alert } from 'antd';
import { WarningOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { SuspiciousRecord } from '../types';
import { SOURCE_TEXT, STATUS_TEXT } from '../types';
import { suspiciousApi } from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface SuspiciousPanelProps {
  visible: boolean;
  records: SuspiciousRecord[];
  operator: string;
  onClose: () => void;
}

const SuspiciousPanel: React.FC<SuspiciousPanelProps> = ({ visible, records, operator, onClose }) => {
  const [selectedRecord, setSelectedRecord] = useState<SuspiciousRecord | null>(null);
  const [form] = Form.useForm();
  const [action, setAction] = useState<'confirm' | 'reject'>('confirm');

  const handleProcess = async (values: any) => {
    if (!selectedRecord) return;
    try {
      await suspiciousApi.handle(selectedRecord.id, {
        ...values,
        action,
        handledBy: values.handledBy || operator,
      });
      message.success('处理成功');
      setSelectedRecord(null);
      form.resetFields();
      onClose();
    } catch (error) {
      message.error('处理失败');
    }
  };

  const renderRecordDetail = () => {
    if (!selectedRecord) return null;

    return (
      <div style={{ marginTop: '16px', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
        <Title level={5} style={{ marginTop: 0 }}>
          处理记录：{selectedRecord.childName}
        </Title>
        <Alert
          message="可疑原因"
          description={selectedRecord.suspiciousReason}
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        <Form form={form} layout="vertical" onFinish={handleProcess}>
          <Form.Item label="处理方式">
            <Space>
              <Button
                type={action === 'confirm' ? 'primary' : 'default'}
                icon={<CheckCircleOutlined />}
                onClick={() => setAction('confirm')}
              >
                确认有效
              </Button>
              <Button
                type={action === 'reject' ? 'primary' : 'default'}
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => setAction('reject')}
              >
                判定无效
              </Button>
            </Space>
          </Form.Item>
          {action === 'confirm' && (
            <Form.Item name="newAmount" label="修改奶量(ml)">
              <InputNumber
                min={0}
                max={1000}
                style={{ width: '100%' }}
                placeholder={`原数据：${selectedRecord.amount}ml，如无需修改请留空`}
              />
            </Form.Item>
          )}
          <Form.Item
            name="newReason"
            label="处理原因"
            rules={[{ required: true, message: '请填写处理原因' }]}
          >
            <TextArea
              rows={3}
              placeholder={action === 'confirm' ? '说明确认有效的原因' : '说明判定无效的原因'}
            />
          </Form.Item>
          <Form.Item
            name="handledNote"
            label="处理备注"
            rules={[{ required: true, message: '请填写处理备注' }]}
          >
            <TextArea rows={2} placeholder="详细说明处理情况" />
          </Form.Item>
          <Form.Item
            name="handledBy"
            label="处理人"
            initialValue={operator}
            rules={[{ required: true, message: '请选择处理人' }]}
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
                确认处理
              </Button>
              <Button onClick={() => setSelectedRecord(null)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>
    );
  };

  return (
    <Modal
      title={
        <Space>
          <WarningOutlined style={{ color: '#fa8c16', fontSize: '20px' }} />
          <Title level={4} style={{ margin: 0 }}>
            可疑记录待处理
          </Title>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      destroyOnClose
    >
      {records.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
          <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
          <div>暂无可疑记录待处理</div>
        </div>
      ) : (
        <>
          <Text type="secondary">
            共 {records.length} 条可疑记录需要人工处理，坏数据已隔离，不会污染正常记录
          </Text>
          <List
            style={{ marginTop: '16px' }}
            dataSource={records}
            renderItem={(item) => (
              <List.Item
                style={{
                  border: '1px solid #ffd666',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  padding: '12px',
                  background: selectedRecord?.id === item.id ? '#fffbe6' : '#fff',
                }}
                actions={[
                  <Button
                    type="link"
                    onClick={() => {
                      setSelectedRecord(item);
                      form.setFieldsValue({ handledBy: operator });
                    }}
                  >
                    处理
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>{item.childName}</Text>
                      <Tag color="orange">{STATUS_TEXT.SUSPICIOUS}</Tag>
                      <Tag color={item.source === 'PARENT_MESSAGE' ? 'geekblue' : 'purple'}>
                        {SOURCE_TEXT[item.source]}
                      </Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <div>
                        日期：{dayjs(item.recordDate).format('YYYY-MM-DD')} · 奶量：
                        <Text strong style={{ color: '#f5222d' }}>{item.amount}ml</Text>
                      </div>
                      <div style={{ color: '#fa8c16' }}>
                        <WarningOutlined /> 可疑原因：{item.suspiciousReason}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
          <Divider />
          {renderRecordDetail()}
        </>
      )}
    </Modal>
  );
};

export default SuspiciousPanel;
