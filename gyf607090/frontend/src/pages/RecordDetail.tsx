import React, { useState, useEffect } from 'react';
import {
  Descriptions,
  Tag,
  Typography,
  Timeline,
  Card,
  Button,
  Space,
  Divider,
  Form,
  Input,
  Select,
  message,
  Row,
  Col,
  Statistic,
  Empty,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  MessageOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons';
import type { RecordDetail, MilkRecordHistory, ReviewRecord, TherapyFeedback } from '../types';
import { STATUS_TEXT, SOURCE_TEXT, STATUS_COLOR } from '../types';
import { recordApi, feedbackApi } from '../services/api';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const RecordDetail: React.FC = () => {
  const [record, setRecord] = useState<RecordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackForm] = Form.useForm();
  const [editingFeedback, setEditingFeedback] = useState(false);
  const [therapist, setTherapist] = useState('李治疗师');
  const id = parseInt(window.location.pathname.split('/')[2]);

  useEffect(() => {
    loadDetail();
  }, [id]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const res = await recordApi.detail(id);
      setRecord((await res).data);
      if ((await res).data.feedback) {
        feedbackForm.setFieldsValue({
          content: (await res).data.feedback.content,
          therapist: (await res).data.feedback.therapist,
        });
        setTherapist((await res).data.feedback.therapist);
      }
    } catch (error) {
      message.error('加载详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFeedback = async (values: any) => {
    if (!record) return;
    try {
      await feedbackApi.save({
        recordId: record.id,
        childId: record.childId,
        content: values.content,
        therapist: values.therapist,
      });
      message.success('反馈保存成功');
      setEditingFeedback(false);
      loadDetail();
    } catch (error) {
      message.error('保存失败');
    }
  };

  const renderHistory = (histories: MilkRecordHistory[]) => {
    if (!histories || histories.length === 0) {
      return <Empty description="暂无变更记录" />;
    }

    return (
      <Timeline
        mode="left"
        items={histories.map((h, index) => ({
          color: index === 0 ? 'green' : 'blue',
          label: dayjs(h.operatedAt).format('YYYY-MM-DD HH:mm:ss'),
          children: (
            <Card size="small" style={{ marginBottom: '8px' }}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Space>
                  <UserOutlined /> <Text strong>{h.operator}</Text>
                  <Text type="secondary">{h.changeNote}</Text>
                </Space>
                {(h.oldStatus !== h.newStatus) && (
                  <Space>
                    <Text>状态变更：</Text>
                    <Tag color={STATUS_COLOR[h.oldStatus]}>{STATUS_TEXT[h.oldStatus]}</Tag>
                    <Text type="secondary">→</Text>
                    <Tag color={STATUS_COLOR[h.newStatus]}>{STATUS_TEXT[h.newStatus]}</Tag>
                  </Space>
                )}
                {(h.oldAmount !== null && h.newAmount !== null && h.oldAmount !== h.newAmount) && (
                  <Space>
                    <Text>奶量变更：</Text>
                    <Text delete type="secondary">{h.oldAmount}ml</Text>
                    <Text type="secondary">→</Text>
                    <Text strong>{h.newAmount}ml</Text>
                  </Space>
                )}
                {h.newReason && (
                  <div>
                    <Text type="secondary">处理原因：</Text>
                    <Text>{h.newReason}</Text>
                    {h.oldReason && h.oldReason !== h.newReason && (
                      <div>
                        <Text delete type="secondary">原原因：{h.oldReason}</Text>
                      </div>
                    )}
                  </div>
                )}
              </Space>
            </Card>
          ),
        }))}
      />
    );
  };

  const renderReviews = (reviews: ReviewRecord[]) => {
    if (!reviews || reviews.length === 0) {
      return <Empty description="暂无复核记录" />;
    }

    return (
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {reviews.map((review) => (
          <Card
            key={review.id}
            size="small"
            title={
              <Space>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                <span>复核记录</span>
              </Space>
            }
            extra={<Text type="secondary">{dayjs(review.reviewedAt).format('YYYY-MM-DD HH:mm:ss')}</Text>}
          >
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Space>
                <UserOutlined /> <Text strong>复核人：{review.reviewer}</Text>
              </Space>
              <Paragraph style={{ margin: 0 }}>{review.reviewNote}</Paragraph>
            </Space>
          </Card>
        ))}
      </Space>
    );
  };

  const renderFeedback = (feedback: TherapyFeedback | null | undefined) => {
    if (!feedback && !editingFeedback) {
      return (
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <MedicineBoxOutlined style={{ fontSize: '32px', color: '#1890ff', marginBottom: '12px' }} />
          <div style={{ marginBottom: '12px' }}>
            <Text type="secondary">治疗师尚未填写课后反馈</Text>
          </div>
          <Button type="primary" icon={<EditOutlined />} onClick={() => setEditingFeedback(true)}>
            填写反馈
          </Button>
        </div>
      );
    }

    if (editingFeedback) {
      return (
        <Form form={feedbackForm} layout="vertical" onFinish={handleSaveFeedback}>
          <Form.Item
            name="content"
            label="课后反馈内容"
            rules={[{ required: true, message: '请填写反馈内容' }]}
          >
            <TextArea
              rows={6}
              placeholder="请填写课后反馈，包括康复训练情况、奶量摄入情况、消化情况、建议等"
            />
          </Form.Item>
          <Form.Item
            name="therapist"
            label="治疗师"
            initialValue={therapist}
            rules={[{ required: true, message: '请选择治疗师' }]}
          >
            <Select>
              <Option value="李治疗师">李治疗师</Option>
              <Option value="王治疗师">王治疗师</Option>
              <Option value="张治疗师">张治疗师</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                保存反馈
              </Button>
              <Button
                onClick={() => {
                  setEditingFeedback(false);
                  feedbackForm.resetFields();
                }}
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      );
    }

    return (
      <Card
        size="small"
        title={
          <Space>
            <MedicineBoxOutlined style={{ color: '#1890ff' }} />
            <span>治疗师课后反馈</span>
          </Space>
        }
        extra={
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => setEditingFeedback(true)}>
            编辑
          </Button>
        }
      >
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Space>
            <UserOutlined /> <Text strong>治疗师：{feedback?.therapist}</Text>
          </Space>
          <Space>
            <ClockCircleOutlined />
            <Text type="secondary">
              填写时间：{feedback?.createdAt && dayjs(feedback.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </Text>
            {feedback?.updatedAt && feedback.updatedAt !== feedback.createdAt && (
              <Text type="secondary">
                （更新于：{dayjs(feedback.updatedAt).format('YYYY-MM-DD HH:mm:ss')}）
              </Text>
            )}
          </Space>
          <div style={{ marginTop: '8px' }}>
            <MessageOutlined /> <Text strong>反馈内容：</Text>
            <Paragraph style={{ marginTop: '8px', whiteSpace: 'pre-wrap' }}>{feedback?.content}</Paragraph>
          </div>
        </Space>
      </Card>
    );
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>加载中...</div>;
  }

  if (!record) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>记录不存在</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => window.location.href = '/'}>
          返回列表
        </Button>
      </div>

      <Title level={3} style={{ marginBottom: '16px' }}>
        奶量记录详情
      </Title>

      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="奶量"
              value={record.amount}
              suffix="ml"
              valueStyle={{ color: '#1890ff', fontSize: '28px' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="状态"
              value={STATUS_TEXT[record.status]}
              valueStyle={{ color: STATUS_COLOR[record.status], fontSize: '24px' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="来源"
              value={SOURCE_TEXT[record.source]}
              valueStyle={{ fontSize: '20px' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="变更次数"
              value={record.histories?.length || 0}
              valueStyle={{ color: '#722ed1', fontSize: '28px' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="基本信息" style={{ marginBottom: '16px' }}>
        <Descriptions column={2} size="small">
          <Descriptions.Item label="儿童姓名">{record.child.name}</Descriptions.Item>
          <Descriptions.Item label="年龄">{record.child.age}岁</Descriptions.Item>
          <Descriptions.Item label="监护人">{record.child.guardianName}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{record.child.phone}</Descriptions.Item>
          <Descriptions.Item label="记录日期">{dayjs(record.recordDate).format('YYYY-MM-DD')}</Descriptions.Item>
          <Descriptions.Item label="奶量">
            <Text strong style={{ fontSize: '18px' }}>{record.amount}ml</Text>
          </Descriptions.Item>
          <Descriptions.Item label="来源">
            <Tag color={record.source === 'PARENT_MESSAGE' ? 'geekblue' : 'purple'}>
              {SOURCE_TEXT[record.source]}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={STATUS_COLOR[record.status]}>{STATUS_TEXT[record.status]}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="家长留言" span={2}>
            {record.parentMessage || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="交接单编号" span={2}>
            {record.paperNote || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="处理原因" span={2}>
            {record.reason || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="处理人">{record.handledBy || '-'}</Descriptions.Item>
          <Descriptions.Item label="处理时间">
            {record.handledAt ? dayjs(record.handledAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(record.createdAt).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {dayjs(record.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Divider orientation="left">治疗师课后反馈</Divider>
      <div style={{ marginBottom: '24px' }}>
        {renderFeedback(record.feedback)}
      </div>

      <Divider orientation="left">状态变更历史（可追溯每次改判原因）</Divider>
      <div style={{ marginBottom: '24px' }}>
        {renderHistory(record.histories)}
      </div>

      <Divider orientation="left">复核记录</Divider>
      {renderReviews(record.reviews)}
    </div>
  );
};

export default RecordDetail;
