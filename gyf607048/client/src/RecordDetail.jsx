import { useState, useEffect } from 'react';
import {
  Card, Descriptions, Tag, Button, Space, Alert, Row, Col,
  Timeline, Result, Avatar, Empty, Typography, Tooltip,
  List
} from 'antd';
import {
  ArrowLeftOutlined, WarningOutlined, SafetyCertificateOutlined,
  EyeOutlined, UserOutlined, TeamOutlined, FileTextOutlined,
  CameraOutlined, ExclamationCircleOutlined, AuditOutlined,
  CheckCircleOutlined, CloseCircleOutlined, EditOutlined
} from '@ant-design/icons';
import { recordsApi } from './api';

const { Paragraph, Text } = Typography;

const RECORD_TYPE_COLOR = {
  normal: 'green',
  temp_supplement: 'orange',
  bad_row: 'red'
};
const RECORD_TYPE_TEXT = {
  normal: '正常记录',
  temp_supplement: '临时补充',
  bad_row: '坏行（已隔离）'
};
const STATUS_COLOR = {
  pending_review: 'gold',
  reviewed: 'green',
  rejected: 'red'
};
const STATUS_TEXT = {
  pending_review: '待复核',
  reviewed: '已复核',
  rejected: '已驳回'
};
const SHIFT_TEXT = {
  morning: '早班',
  afternoon: '午班',
  night: '夜班'
};
const RECT_TEXT = {
  none: '无',
  pending: '待整改',
  done: '已整改'
};
const RECT_COLOR = {
  none: 'default',
  pending: 'gold',
  done: 'green'
};

export default function RecordDetail({ recordId, onBack }) {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetail();
  }, [recordId]);

  function loadDetail() {
    setLoading(true);
    recordsApi.get(recordId).then(data => {
      setRecord(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }

  if (loading && !record) {
    return <Card loading />;
  }
  if (!record) {
    return <Result status="404" title="记录不存在" subTitle="该记录可能已被删除" extra={<Button onClick={onBack}>返回列表</Button>} />;
  }

  const isParent = !record.notes_internal && record.unauthorized_view_reason !== undefined;

  return (
    <div style={{ padding: 16 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>返回列表</Button>
        <Button onClick={loadDetail}>刷新</Button>
        <Tag color={RECORD_TYPE_COLOR[record.record_type]}>
          {RECORD_TYPE_TEXT[record.record_type]}
        </Tag>
        <Tag color={STATUS_COLOR[record.status]}>
          {STATUS_TEXT[record.status]}
        </Tag>
        {record.rectification_status !== 'none' && (
          <Tag color={RECT_COLOR[record.rectification_status]}>
            整改：{RECT_TEXT[record.rectification_status]}
          </Tag>
        )}
      </Space>

      {record.unauthorized_view_reason && (
        <Alert
          style={{ marginBottom: 16 }}
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          message="权限提示"
          description={
            <div>
              <Paragraph style={{ marginBottom: 4 }}>
                <WarningOutlined style={{ color: '#faad14', marginRight: 6 }} />
                {record.unauthorized_view_reason}
              </Paragraph>
              <Text type="secondary" style={{ fontSize: 12 }}>
                本次查看已记录审计日志，护理主管可在历史记录中查阅。
              </Text>
            </div>
          }
        />
      )}

      {record.record_type === 'bad_row' && (
        <Alert
          style={{ marginBottom: 16 }}
          type="error"
          showIcon
          icon={<WarningOutlined />}
          message="此记录为坏行，已隔离"
          description="该记录不参与正常统计，仅供追溯查阅。统计报表、数据分析均已排除此条数据。"
        />
      )}

      {record.record_type === 'temp_supplement' && (
        <Alert
          style={{ marginBottom: 16 }}
          type="warning"
          showIcon
          message="此为临时补充记录"
          description='默认筛选条件下不纳入正常统计，如需查看请在筛选中勾选包含临时补充。'
      )}

      {record.cross_shift_reason && (
        <Alert
          style={{ marginBottom: 16 }}
          type="info"
          showIcon
          icon={<TeamOutlined />}
          message="跨班交接提示"
          description={record.cross_shift_reason}
        />
      )}

      <Row gutter={16}>
        <Col span={16}>
          <Card title={<Space><FileTextOutlined />护理记录详情</Space>} style={{ marginBottom: 16 }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="记录ID">{record.id}</Descriptions.Item>
              <Descriptions.Item label="批次号">{record.batch_no || '-'}</Descriptions.Item>
              <Descriptions.Item label="宝宝姓名">{record.baby_name}</Descriptions.Item>
              <Descriptions.Item label="房间号">{record.room_no}</Descriptions.Item>
              <Descriptions.Item label="记录日期">{record.record_date}</Descriptions.Item>
              <Descriptions.Item label="班次">{SHIFT_TEXT[record.shift] || '-'}</Descriptions.Item>
              <Descriptions.Item label="护理员">{record.nurse_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={STATUS_COLOR[record.status]}>{STATUS_TEXT[record.status]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="体温">{record.temperature ? `${record.temperature}℃` : '-'}</Descriptions.Item>
              <Descriptions.Item label="体重">{record.weight ? `${record.weight}kg` : '-'}</Descriptions.Item>
              <Descriptions.Item label="喂奶量">{record.feeding_amount ? `${record.feeding_amount}ml` : '-'}</Descriptions.Item>
              <Descriptions.Item label="换尿布">{record.diaper_count != null ? `${record.diaper_count}次` : '-'}</Descriptions.Item>
              <Descriptions.Item label="睡眠时长">{record.sleep_hours ? `${record.sleep_hours}h` : '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{record.created_at}</Descriptions.Item>
              <Descriptions.Item label="最后更新" span={2}>{record.updated_at}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card
            title={
              <Space>
                <EyeOutlined style={{ color: '#52c41a' }} />
                家长可见内容
                <Tag color="green">家长可见</Tag>
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {record.notes_public || '（无）'}
            </Paragraph>
          </Card>

          {record.notes_internal !== undefined && (
            <Card
              title={
                <Space>
                  <SafetyCertificateOutlined style={{ color: '#1890ff' }} />
                  内部备注
                  <Tag color="blue">仅内部可见</Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>家长不可见此内容</Text>
                </Space>
              }
              style={{ marginBottom: 16 }}
            >
              <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap', background: '#f0f7ff', padding: 12, borderRadius: 4 }}>
                {record.notes_internal || '（无）'}
              </Paragraph>
            </Card>
          )}

          {(record.photo_description || record.photo_url) && (
            <Card
              title={
                <Space>
                  <CameraOutlined />
                  照片说明
                </Space>
              }
              style={{ marginBottom: 16 }}
            >
              {record.photo_url && (
                <div style={{ marginBottom: 12 }}>
                  <img
                    src={record.photo_url.startsWith('http') ? record.photo_url : record.photo_url}
                    alt="照片"
                    style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8 }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}
              <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {record.photo_description || '（无照片说明）'}
              </Paragraph>
            </Card>
          )}

          {record.rectification_status !== 'none' && (
            <Card
              title={
                <Space>
                  <ExclamationCircleOutlined />
                  整改记录
                  <Tag color={RECT_COLOR[record.rectification_status]}>{RECT_TEXT[record.rectification_status]}</Tag>
                </Space>
              }
              style={{ marginBottom: 16 }}
            >
              <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap', background: record.rectification_status === 'pending' ? '#fffbe6' : '#f6ffed', padding: 12, borderRadius: 4 }}>
                {record.rectification_note || '（无具体整改内容）'}
              </Paragraph>
            </Card>
          )}
        </Col>

        <Col span={8}>
          {record.cross_shift_records && record.cross_shift_records.length > 0 && (
            <Card
              title={
                <Space>
                  <TeamOutlined />
                  同日跨班记录
                  <Tooltip title="同一宝宝当天的其他班次记录">
                    <Tag color="blue">{record.cross_shift_records.length}条</Tag>
                  </Tooltip>
                </Space>
              }
              style={{ marginBottom: 16 }}
            >
              <List
                size="small"
                dataSource={record.cross_shift_records}
                renderItem={item => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} />}
                      title={
                        <Space>
                          <Tag>{SHIFT_TEXT[item.shift]}</Tag>
                          <Tag color={RECORD_TYPE_COLOR[item.record_type]}>{RECORD_TYPE_TEXT[item.record_type]}</Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <div>护理员：{item.nurse_name || '-'}</div>
                          {item.notes_public && <div style={{ color: '#666' }}>备注：{item.notes_public}</div>}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}

          <Card
            title={
              <Space>
                <AuditOutlined />
                宝宝基础信息
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="姓名">{record.baby_name}</Descriptions.Item>
              <Descriptions.Item label="出生日期">{record.birth_date || '-'}</Descriptions.Item>
              <Descriptions.Item label="入住日期">{record.admission_date || '-'}</Descriptions.Item>
              <Descriptions.Item label="房间号">{record.room_no}</Descriptions.Item>
              <Descriptions.Item label="监护人">{record.guardian_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{record.guardian_phone || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <AuditOutlined />
            审计历史
            <Text type="secondary" style={{ fontSize: 12 }}>
              早班老师和护理主管可查阅完整修改记录：谁在什么时候改过什么
            </Text>
          </Space>
        }
      >
        {record.audit_logs && record.audit_logs.length > 0 ? (
          <Timeline
            items={record.audit_logs.map(log => {
              const actionTextMap = {
                create: '创建',
                update: '修改',
                review: '复核通过',
                reject: '复核驳回',
                delete: '删除/作废',
                view_unauthorized: '越权查看',
                cross_shift: '跨班交接'
              };
              const actionColorMap = {
                create: 'blue',
                update: 'cyan',
                review: 'green',
                reject: 'red',
                delete: 'red',
                view_unauthorized: 'orange',
                cross_shift: 'purple'
              };
              const actionIconMap = {
                create: <FileTextOutlined />,
                update: <EditOutlined />,
                review: <CheckCircleOutlined />,
                reject: <CloseCircleOutlined />,
                delete: <CloseCircleOutlined />,
                view_unauthorized: <ExclamationCircleOutlined />,
                cross_shift: <TeamOutlined />
              };
              return {
                color: actionColorMap[log.action] || 'gray',
                dot: actionIconMap[log.action],
                children: (
                  <div style={{ paddingBottom: 8 }}>
                    <Space style={{ marginBottom: 4 }}>
                      <Tag color={actionColorMap[log.action]}>
                        {actionTextMap[log.action] || log.action}
                      </Tag>
                      <Text strong>{log.operator_name}</Text>
                      <Text type="secondary">({log.operator_role})</Text>
                      <Text type="secondary" style={{ marginLeft: 8 }}>{log.created_at}</Text>
                    </Space>
                    {log.field_name && (
                      <div style={{ fontSize: 13, marginBottom: 4 }}>
                        <Text>字段：<Text strong>{log.field_name}</Text></Text>
                        {log.old_value !== null && log.old_value !== undefined && log.old_value !== '' && (
                          <Text type="danger" style={{ marginLeft: 12 }}>
                            原值：{String(log.old_value).slice(0, 80)}
                          </Text>
                        )}
                        {log.new_value !== null && log.new_value !== undefined && log.new_value !== '' && (
                          <Text type="success" style={{ marginLeft: 12 }}>
                            → 新值：{String(log.new_value).slice(0, 80)}
                          </Text>
                        )}
                      </div>
                    )}
                    {log.reason && (
                      <div style={{ fontSize: 13, background: '#fffbe6', padding: '6px 10px', borderRadius: 4, display: 'inline-block' }}>
                        <Text type="warning">原因：{log.reason}</Text>
                      </div>
                    )}
                  </div>
                )
              };
            })}
          />
        ) : (
          <Empty description="暂无审计记录" />
        )}
      </Card>
    </div>
  );
}


