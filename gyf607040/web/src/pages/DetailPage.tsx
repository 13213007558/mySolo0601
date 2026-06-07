import React, { useEffect, useState, useRef } from 'react';
import {
  Layout, Typography, Descriptions, Tag, Button, Space, Card, Row, Col, Alert,
  Form, Input, Select, Upload, App, Divider, Empty, Image, Modal,
} from 'antd';
import {
  ArrowLeftOutlined, SaveOutlined, UploadOutlined, CheckCircleOutlined,
  ExclamationCircleOutlined, WarningOutlined, EditOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import type { UploadFile } from 'antd';
import { api, STATUS_MAP, STATUS_OPTIONS, type MilkRecord } from '../api';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const DetailPage: React.FC = () => {
  const { message, modal } = App.useApp();
  const navigate = useNavigate();
  const { id } = useParams();
  const [record, setRecord] = useState<MilkRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm] = Form.useForm();
  const [reviewForm] = Form.useForm();
  const fileListRef = useRef<UploadFile[]>([]);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const r = await api.getRecord(id);
      setRecord(r);
      editForm.setFieldsValue({
        milk_amount: r.milk_amount,
        milk_type: r.milk_type,
        handler: r.handler,
      });
      reviewForm.setFieldsValue({
        status: r.status,
        abnormal_reason: r.abnormal_reason,
        review_note: r.review_note,
        reviewer: r.reviewer,
      });
    } catch (e: any) {
      message.error('加载详情失败: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleSaveEdit = async () => {
    try {
      const values = await editForm.validateFields();
      let photo_path = record?.photo_path;
      if (fileListRef.current.length) {
        const f = fileListRef.current[0].originFileObj!;
        const up = await api.uploadPhoto(f);
        photo_path = up.url;
      }
      const r = await api.updateRecord(id!, { ...values, photo_path });
      setRecord(r);
      setEditing(false);
      fileListRef.current = [];
      message.success('保存成功');
    } catch (e: any) {
      if (e.errorFields) return;
      message.error('保存失败: ' + (e.message || ''));
    }
  };

  const handleReview = async () => {
    try {
      const values = await reviewForm.validateFields();
      const r = await api.reviewRecord(id!, values);
      setRecord(r);
      message.success('复核已保存，记录已更新');
    } catch (e: any) {
      if (e.errorFields) return;
      message.error('复核失败: ' + (e.message || ''));
    }
  };

  const handleMarkDirty = () => {
    modal.confirm({
      title: '确认将该记录标记为脏数据？',
      content: '标记后该记录将被隔离，不计入正常汇总，此操作可重新复核恢复。',
      okText: '确认隔离',
      okButtonProps: { danger: true },
      onOk: async () => {
        const input = await new Promise<string>((resolve) => {
          Modal.confirm({
            title: '请输入脏数据原因',
            content: (
              <Input.TextArea
                id="dirty-reason-input"
                rows={3}
                placeholder="例如：补录串号、数据录入错误、重复录入等"
              />
            ),
            onOk: () => {
              const el = document.getElementById('dirty-reason-input') as HTMLTextAreaElement;
              resolve(el?.value || '脏数据');
            },
          });
        });
        await api.markDirty(id!, input);
        message.success('已隔离');
        load();
      },
    });
  };

  const StatusTag = ({ r }: { r: MilkRecord }) => {
    if (r.is_dirty) {
      return <Tag color="default" icon={<WarningOutlined />}>已隔离（脏数据）</Tag>;
    }
    const s = STATUS_MAP[r.status] || { text: r.status, color: 'default' };
    const Icon = r.status === 'normal' ? CheckCircleOutlined : ExclamationCircleOutlined;
    return <Tag color={s.color as any} icon={<Icon />}>{s.text}</Tag>;
  };

  if (loading && !record) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Empty description="加载中..." />
        </Content>
      </Layout>
    );
  }

  if (!record) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ padding: 24 }}>
          <Empty description="记录不存在或已删除" />
          <Button onClick={() => navigate('/')} style={{ marginTop: 16 }}>返回列表</Button>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <Header style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>返回列表</Button>
          <Title level={4} style={{ margin: 0 }}>喂奶记录详情</Title>
          <StatusTag r={record} />
        </Space>
        <Space>
          {!record.is_dirty && (
            <Button danger onClick={handleMarkDirty} icon={<WarningOutlined />}>
              标记为脏数据
            </Button>
          )}
          <Button icon={<EditOutlined />} onClick={() => setEditing(!editing)} type={editing ? 'primary' : 'default'}>
            {editing ? '取消编辑' : '编辑基础信息'}
          </Button>
        </Space>
      </Header>

      <Content style={{ padding: 16 }}>
        {record.issues && record.issues.length > 0 && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 12 }}
            message="数据异常提示（该条记录存在以下问题）"
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {record.issues.map((it, i) => <li key={i}>{it}</li>)}
              </ul>
            }
          />
        )}

        <Row gutter={16}>
          <Col span={14}>
            <Card title="基础信息" size="small" style={{ marginBottom: 12 }}>
              {editing ? (
                <Form form={editForm} layout="vertical">
                  <Row gutter={12}>
                    <Col span={8}>
                      <Form.Item name="milk_amount" label="奶量(ml)" rules={[{ required: true }]}>
                        <Input type="number" min={0} max={300} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="milk_type" label="奶型" rules={[{ required: true }]}>
                        <Select>
                          <Option value="母乳">母乳</Option>
                          <Option value="配方奶">配方奶</Option>
                          <Option value="混合">混合</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="handler" label="处理人">
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item label="喂奶照片">
                    <Upload
                      beforeUpload={() => false}
                      maxCount={1}
                      accept="image/*"
                      listType="picture"
                      onChange={({ fileList }) => { fileListRef.current = fileList; }}
                    >
                      <Button icon={<UploadOutlined />}>上传/更换照片</Button>
                    </Upload>
                  </Form.Item>
                  <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveEdit}>保存修改</Button>
                </Form>
              ) : (
                <Descriptions column={2} size="small" bordered>
                  <Descriptions.Item label="日期">{record.record_date}</Descriptions.Item>
                  <Descriptions.Item label="时间/班次">{record.record_time} · {record.shift}</Descriptions.Item>
                  <Descriptions.Item label="婴儿">
                    <Text strong>{record.baby_name}</Text>
                    <Text type="secondary">（{record.room_no}房 {record.bed_no}床）</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="母亲">{record.mother_name || '-'}</Descriptions.Item>
                  <Descriptions.Item label="奶量"><Text strong style={{ color: '#1677ff', fontSize: 16 }}>{record.milk_amount} ml</Text></Descriptions.Item>
                  <Descriptions.Item label="奶型">{record.milk_type}</Descriptions.Item>
                  <Descriptions.Item label="处理人">{record.handler || '-'}</Descriptions.Item>
                  <Descriptions.Item label="状态"><StatusTag r={record} /></Descriptions.Item>
                </Descriptions>
              )}
            </Card>

            <Card title="喂奶照片" size="small" style={{ marginBottom: 12 }}>
              {record.photo_path ? (
                <div>
                  <Image
                    width={360}
                    src={record.photo_path}
                    alt="喂奶照片"
                    style={{ border: '1px solid #eee', borderRadius: 4 }}
                  />
                  <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>照片路径已保存到数据库，服务重启后仍然保留</div>
                </div>
              ) : (
                <Alert
                  type="error"
                  showIcon
                  icon={<ExclamationCircleOutlined />}
                  message="照片缺失"
                  description="该条记录未上传喂奶照片。补录数据请务必上传照片作为凭证，否则会被判定为不完整记录，影响汇总统计。可点击右上角「编辑基础信息」上传照片。"
                />
              )}
            </Card>

            <Card title="异常原因与复核记录" size="small">
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="异常原因">
                  {record.abnormal_reason
                    ? <Text type="danger">{record.abnormal_reason}</Text>
                    : <Text type="secondary">无</Text>}
                </Descriptions.Item>
                <Descriptions.Item label="复核人">{record.reviewer || '-'}</Descriptions.Item>
                <Descriptions.Item label="复核意见">
                  {record.review_note || <Text type="secondary">尚未填写复核意见</Text>}
                </Descriptions.Item>
                <Descriptions.Item label="复核时间">{record.review_time || '-'}</Descriptions.Item>
                <Descriptions.Item label="脏数据状态">
                  {record.is_dirty
                    ? (
                      <Space>
                        <Tag color="default">已隔离，不参与正常汇总</Tag>
                        <Text type="secondary">原因：{record.dirty_reason || '-'}</Text>
                      </Space>
                    )
                    : <Tag color="green">正常参与汇总</Tag>}
                </Descriptions.Item>
                <Descriptions.Item label="数据更新时间">{record.updated_at || '-'}</Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          <Col span={10}>
            <Card
              title={
                <Space>
                  <span>复核面板</span>
                  <Tag color="blue">护理主管操作</Tag>
                </Space>
              }
              size="small"
              extra={<Text type="secondary">任何修改都会立刻写入数据库</Text>}
            >
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 12 }}
                message="复核操作说明"
                description={
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12 }}>
                    <li>选择状态后会立即更新该记录的最终状态</li>
                    <li>复核意见将作为整改记录永久保存，随导出一并交给店长</li>
                    <li>复核人必须填写，用于追溯责任</li>
                    <li>异常数据可以补充/修改异常原因</li>
                  </ul>
                }
              />
              <Form form={reviewForm} layout="vertical">
                <Form.Item name="status" label="复核状态" rules={[{ required: true, message: '请选择复核状态' }]}>
                  <Select>
                    {STATUS_OPTIONS.filter(s => s.value !== 'all').map(s => (
                      <Option key={s.value} value={s.value}>{s.label}</Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item name="abnormal_reason" label="异常原因">
                  <Input.TextArea
                    rows={2}
                    placeholder="如：婴儿体温37.8℃、拒奶、吐奶量多、呛咳、腹胀、大便异常等"
                  />
                </Form.Item>
                <Form.Item name="reviewer" label="复核人（处理人）" rules={[{ required: true, message: '请填写复核人' }]}>
                  <Input placeholder="如：护理主管李姐 / 护士长张女士" />
                </Form.Item>
                <Form.Item
                  name="review_note"
                  label="复核意见 / 整改记录"
                  rules={[{ required: true, message: '请填写复核意见' }]}
                >
                  <Input.TextArea
                    rows={4}
                    placeholder="例如：已观察婴儿生命体征平稳，建议下次喂奶减量至60ml并记录排便情况；已与当班护理员沟通补录流程，杜绝串号..."
                  />
                </Form.Item>
                <Button type="primary" block icon={<SaveOutlined />} size="large" onClick={handleReview}>
                  保存复核（立即写入数据库）
                </Button>
              </Form>
              <Divider style={{ margin: '16px 0' }} />
              <div style={{ fontSize: 12, color: '#999' }}>
                <div>💡 数据持久化说明：</div>
                <div>• 所有复核信息、照片路径、整改记录都写入 SQLite 数据库（server/milk-checkin.db）</div>
                <div>• 服务重启后重新打开本页，所有信息仍然保留</div>
                <div>• 脏数据（is_dirty=1）不会被计入正常汇总，避免污染统计</div>
              </div>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default DetailPage;
