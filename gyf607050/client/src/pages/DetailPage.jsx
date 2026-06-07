import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Tag, Button, Input, Form, InputNumber, Select, Modal, message, Divider } from 'antd';
import { ArrowLeftOutlined, WarningOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { fetchAPI, getStatusText, getStatusColor, formatTime, getNextStatuses } from '../utils.js';
import socket from '../socket.js';

export default function DetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [operator, setOperator] = useState(localStorage.getItem('operator') || '');
  const [statusModal, setStatusModal] = useState({ open: false, status: null, label: '' });
  const [materialModal, setMaterialModal] = useState(false);
  const [statusForm] = Form.useForm();
  const [materialForm] = Form.useForm();

  const loadRecord = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAPI(`/api/records/${id}`);
      setRecord(data);
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadRecord();
  }, [loadRecord]);

  useEffect(() => {
    const handleUpdated = (updated) => {
      if (updated && updated.id === id) {
        loadRecord();
      }
    };
    socket.on('record:updated', handleUpdated);
    return () => socket.off('record:updated', handleUpdated);
  }, [id, loadRecord]);

  const handleStatusClick = (statusItem) => {
    if (!operator.trim()) {
      message.warning('请先在下方填写您的姓名/岗位');
      return;
    }
    if (statusItem.type === 'danger') {
      setStatusModal({ open: true, status: statusItem.status, label: statusItem.label });
      statusForm.resetFields();
    } else {
      setStatusModal({ open: true, status: statusItem.status, label: statusItem.label });
      statusForm.resetFields();
    }
  };

  const handleStatusConfirm = async (values) => {
    try {
      localStorage.setItem('operator', operator);
      await fetchAPI(`/api/records/${id}/status`, {
        method: 'POST',
        body: JSON.stringify({
          status: statusModal.status,
          operator,
          reason: values.reason
        })
      });
      message.success(`已${statusModal.label}`);
      setStatusModal({ open: false, status: null, label: '' });
      loadRecord();
    } catch (e) {
      message.error(e.message);
    }
  };

  const handleAddMaterial = async (values) => {
    if (!operator.trim()) {
      message.warning('请先填写您的姓名/岗位');
      return;
    }
    try {
      localStorage.setItem('operator', operator);
      await fetchAPI(`/api/records/${id}/materials`, {
        method: 'POST',
        body: JSON.stringify({
          content: values.content,
          operator
        })
      });
      message.success('材料已追加');
      setMaterialModal(false);
      materialForm.resetFields();
      loadRecord();
    } catch (e) {
      message.error(e.message);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>加载中...</div>
    );
  }

  if (!record) {
    return (
      <div>
        <div className="app-header">
          <Link to="/" className="back-btn"><ArrowLeftOutlined /> 返回列表</Link>
        </div>
        <div style={{ padding: 40, textAlign: 'center', color: '#ff4d4f' }}>记录不存在</div>
      </div>
    );
  }

  const nextStatuses = getNextStatuses(record.status);

  return (
    <div>
      <div className="app-header">
        <Link to="/" className="back-btn"><ArrowLeftOutlined /> 返回列表</Link>
        <h1>{record.childName} 的奶量记录</h1>
        <div className="subtitle">
          <Tag color={getStatusColor(record.status)} style={{ marginTop: 6 }}>
            {getStatusText(record.status)}
          </Tag>
        </div>
      </div>

      <div className="page-container">
        {record.issues && record.issues.length > 0 && record.issues.map((issue, idx) => (
          <div key={idx} className="issue-banner">
            <WarningOutlined style={{ marginTop: 2 }} />
            <div>{issue}</div>
          </div>
        ))}

        <div className="detail-section">
          <h3>基本信息</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">婴幼儿姓名</span>
              <span className="value">{record.childName}</span>
            </div>
            <div className="info-item">
              <span className="label">桌号</span>
              <span className="value">{record.tableNumber || '-'}</span>
            </div>
            <div className="info-item">
              <span className="label">奶量</span>
              <span className="value" style={{ color: '#1677ff' }}>{record.amount}ml</span>
            </div>
            <div className="info-item">
              <span className="label">奶类型</span>
              <span className="value">{record.milkType}</span>
            </div>
            <div className="info-item">
              <span className="label">温度</span>
              <span className="value">{record.temperature}</span>
            </div>
            <div className="info-item">
              <span className="label">信息来源</span>
              <span className="value">{record.source}</span>
            </div>
            <div className="info-item">
              <span className="label">家长联系方式</span>
              <span className="value">{record.parentContact || '-'}</span>
            </div>
            <div className="info-item">
              <span className="label">录入人</span>
              <span className="value">{record.createdBy}</span>
            </div>
            <div className="info-item">
              <span className="label">处理人</span>
              <span className="value">{record.handler || '未指定'}</span>
            </div>
            <div className="info-item">
              <span className="label"><ClockCircleOutlined /> 创建时间</span>
              <span className="value">{formatTime(record.createdAt)}</span>
            </div>
          </div>
          {record.specialInstructions && (
            <>
              <Divider style={{ margin: '12px 0' }} />
              <div className="info-item">
                <span className="label">特殊说明</span>
                <span className="value">{record.specialInstructions}</span>
              </div>
            </>
          )}
          {record.rejectReason && (
            <div style={{ marginTop: 12, padding: 12, background: '#fff1f0', border: '1px solid #ffccc7', borderRadius: 8 }}>
              <div style={{ color: '#ff4d4f', fontWeight: 600, marginBottom: 4 }}>驳回原因</div>
              <div>{record.rejectReason}</div>
            </div>
          )}
          {record.closeReason && (
            <div style={{ marginTop: 12, padding: 12, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8 }}>
              <div style={{ color: '#389e0d', fontWeight: 600, marginBottom: 4 }}>完成说明</div>
              <div>{record.closeReason}</div>
            </div>
          )}
        </div>

        <div className="review-panel">
          <h3><UserOutlined /> 操作人信息</h3>
          <Input
            placeholder="请输入您的姓名/岗位（如：厨房-刘师傅）"
            value={operator}
            onChange={e => setOperator(e.target.value)}
            style={{ marginBottom: 12 }}
          />
          {nextStatuses.length > 0 && (
            <>
              <h3 style={{ marginTop: 16 }}>复核操作</h3>
              <div className="status-buttons">
                {nextStatuses.map(item => (
                  <Button
                    key={item.status}
                    type={item.type === 'primary' ? 'primary' : item.type === 'danger' ? 'primary' : 'default'}
                    danger={item.type === 'danger'}
                    onClick={() => handleStatusClick(item)}
                    size="large"
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </>
          )}
          <Button
            block
            style={{ marginTop: 12 }}
            onClick={() => {
              if (!operator.trim()) {
                message.warning('请先填写您的姓名/岗位');
                return;
              }
              setMaterialModal(true);
            }}
          >
            追加材料说明
          </Button>
        </div>

        <div className="detail-section">
          <h3>材料记录 ({record.materials?.length || 0})</h3>
          {(!record.materials || record.materials.length === 0) ? (
            <div style={{ color: '#8c8c8c', fontSize: 13, textAlign: 'center', padding: 16 }}>暂无材料</div>
          ) : (
            record.materials.map(m => (
              <div key={m.id} className={`material-item ${m.isAfterClose ? 'after-close' : ''}`}>
                <div className="material-content">{m.content}</div>
                <div className="material-meta">
                  <span>{m.addedBy}</span>
                  <span>
                    {formatTime(m.addedAt)}
                    {m.isAfterClose && <Tag color="orange" style={{ marginLeft: 8 }}>关闭后追加</Tag>}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="detail-section">
          <h3>审计追踪 ({record.audits?.length || 0})</h3>
          {(!record.audits || record.audits.length === 0) ? (
            <div style={{ color: '#8c8c8c', fontSize: 13, textAlign: 'center', padding: 16 }}>暂无审计记录</div>
          ) : (
            record.audits.map(a => (
              <div key={a.id} className="audit-item">
                <div className="audit-header">
                  <span className="audit-action">{a.action}</span>
                  <span className="audit-time">{formatTime(a.timestamp)}</span>
                </div>
                <div className="audit-detail">{a.detail}</div>
                <div className="audit-operator">
                  <UserOutlined /> {a.operator === '系统' ? `${a.operator}（系统自动记录）` : a.operator}
                  {a.operator === '系统' && <Tag color="red" style={{ marginLeft: 8 }}>处理人缺失</Tag>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Modal
        title={`确认${statusModal.label}`}
        open={statusModal.open}
        onCancel={() => setStatusModal({ open: false, status: null, label: '' })}
        onOk={() => statusForm.submit()}
        okText="确认"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={statusForm} layout="vertical" onFinish={handleStatusConfirm}>
          {(statusModal.status === 'REJECTED' || statusModal.status === 'CANCELLED' || statusModal.status === 'CLOSED') ? (
            <Form.Item
              name="reason"
              label={statusModal.status === 'CLOSED' ? '完成说明（选填）' : '原因'}
              rules={statusModal.status !== 'CLOSED' ? [{ required: true, message: '请输入原因' }] : []}
            >
              <Input.TextArea rows={3} placeholder={statusModal.status === 'CLOSED' ? '可填写完成情况说明' : '请输入原因'} />
            </Form.Item>
          ) : null}
        </Form>
      </Modal>

      <Modal
        title="追加材料说明"
        open={materialModal}
        onCancel={() => setMaterialModal(false)}
        onOk={() => materialForm.submit()}
        okText="提交"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={materialForm} layout="vertical" onFinish={handleAddMaterial}>
          <Form.Item name="content" label="材料内容" rules={[{ required: true, message: '请输入材料内容' }]}>
            <Input.TextArea rows={4} placeholder="请输入需要追加的材料说明，如家长补充要求、现场特殊情况等" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
