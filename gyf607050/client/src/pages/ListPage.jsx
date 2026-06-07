import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, Input, Select, DatePicker, Button, Modal, Form, InputNumber, message, Popconfirm } from 'antd';
import { PlusOutlined, SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { fetchAPI, getStatusText, getStatusColor, formatTime } from '../utils.js';
import socket from '../socket.js';

const { RangePicker } = DatePicker;

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'PENDING', label: '待接单' },
  { value: 'ACCEPTED', label: '已接单' },
  { value: 'PREPARING', label: '冲奶中' },
  { value: 'READY', label: '奶已备好' },
  { value: 'DELIVERED', label: '已送达' },
  { value: 'CLOSED', label: '已完成' },
  { value: 'REJECTED', label: '已驳回' },
  { value: 'CANCELLED', label: '已取消' }
];

export default function ListPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [stats, setStats] = useState({ pending: 0, preparing: 0, ready: 0, closed: 0 });

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.set('keyword', keyword);
      if (status) params.set('status', status);
      if (dateRange && dateRange.length === 2) {
        params.set('startDate', dateRange[0].format('YYYY-MM-DD'));
        params.set('endDate', dateRange[1].format('YYYY-MM-DD'));
      }
      const data = await fetchAPI(`/api/records?${params.toString()}`);
      setRecords(data.data || []);

      const all = data.data || [];
      setStats({
        pending: all.filter(r => r.status === 'PENDING').length,
        preparing: all.filter(r => ['ACCEPTED', 'PREPARING'].includes(r.status)).length,
        ready: all.filter(r => ['READY', 'DELIVERED'].includes(r.status)).length,
        closed: all.filter(r => r.status === 'CLOSED').length
      });
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [keyword, status, dateRange]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  useEffect(() => {
    const handleCreated = () => loadRecords();
    const handleUpdated = () => loadRecords();
    socket.on('record:created', handleCreated);
    socket.on('record:updated', handleUpdated);
    return () => {
      socket.off('record:created', handleCreated);
      socket.off('record:updated', handleUpdated);
    };
  }, [loadRecords]);

  const handleCreate = async (values) => {
    try {
      await fetchAPI('/api/records', {
        method: 'POST',
        body: JSON.stringify(values)
      });
      message.success('创建成功');
      setModalOpen(false);
      form.resetFields();
      loadRecords();
    } catch (e) {
      message.error(e.message);
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (keyword) params.set('keyword', keyword);
    if (status) params.set('status', status);
    if (dateRange && dateRange.length === 2) {
      params.set('startDate', dateRange[0].format('YYYY-MM-DD'));
      params.set('endDate', dateRange[1].format('YYYY-MM-DD'));
    }
    window.location.href = `/api/export?${params.toString()}`;
  };

  return (
    <div>
      <div className="app-header">
        <h1>🍼 婴幼儿奶量交接追踪台</h1>
        <div className="subtitle">亲子餐厅 · 现场版</div>
      </div>

      <div className="page-container">
        <div className="stats-bar">
          <div className="stat-item">
            <div className="stat-num" style={{ color: '#faad14' }}>{stats.pending}</div>
            <div className="stat-label">待接单</div>
          </div>
          <div className="stat-item">
            <div className="stat-num" style={{ color: '#722ed1' }}>{stats.preparing}</div>
            <div className="stat-label">制作中</div>
          </div>
          <div className="stat-item">
            <div className="stat-num" style={{ color: '#52c41a' }}>{stats.ready}</div>
            <div className="stat-label">待送达</div>
          </div>
          <div className="stat-item">
            <div className="stat-num" style={{ color: '#8c8c8c' }}>{stats.closed}</div>
            <div className="stat-label">已完成</div>
          </div>
        </div>

        <div className="filter-bar">
          <div className="filter-row">
            <Input
              placeholder="搜索姓名/桌号/家长"
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              allowClear
              style={{ flex: 1, minWidth: 150 }}
            />
            <Select
              value={status}
              onChange={setStatus}
              options={STATUS_OPTIONS}
              style={{ flex: 1, minWidth: 120 }}
            />
          </div>
          <div className="filter-row">
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              style={{ flex: 1 }}
            />
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出财务表
            </Button>
          </div>
        </div>

        {records.map(record => (
          <div
            key={record.id}
            className="record-card"
            onClick={() => navigate(`/record/${record.id}`)}
          >
            <div className="card-header">
              <span className="child-name">{record.childName}</span>
              <Tag color={getStatusColor(record.status)} style={{ margin: 0, fontWeight: 600 }}>
                {getStatusText(record.status)}
              </Tag>
            </div>
            <div className="card-body">
              <div className="item">
                <span className="label">桌号:</span>
                <span>{record.tableNumber || '-'}</span>
              </div>
              <div className="item">
                <span className="label">奶量:</span>
                <span style={{ fontWeight: 600, color: '#1677ff' }}>{record.amount}ml</span>
              </div>
              <div className="item">
                <span className="label">奶类:</span>
                <span>{record.milkType}</span>
              </div>
              <div className="item">
                <span className="label">温度:</span>
                <span>{record.temperature}</span>
              </div>
            </div>
            <div className="card-footer">
              <span>来源: {record.source}</span>
              <span>{formatTime(record.createdAt)}</span>
            </div>
            {record.handler && (
              <div className="card-footer" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
                <span>处理人: {record.handler}</span>
              </div>
            )}
          </div>
        ))}

        {!loading && records.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8c8c8c' }}>
            暂无记录
          </div>
        )}
      </div>

      <button className="fab-create" onClick={() => setModalOpen(true)}>
        <PlusOutlined />
      </button>

      <Modal
        title="录入奶量记录"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
          initialValues={{ milkType: '配方奶', temperature: '40℃', source: '现场', createdBy: '服务员' }}
        >
          <Form.Item name="childName" label="婴幼儿姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item name="tableNumber" label="桌号">
            <Input placeholder="如：A3" />
          </Form.Item>
          <Form.Item name="amount" label="奶量(ml)" rules={[{ required: true, message: '请输入奶量' }]}>
            <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入毫升数" />
          </Form.Item>
          <Form.Item name="milkType" label="奶类型">
            <Select options={[
              { value: '配方奶', label: '配方奶' },
              { value: '母乳', label: '母乳' },
              { value: '特殊配方', label: '特殊配方' }
            ]} />
          </Form.Item>
          <Form.Item name="temperature" label="温度">
            <Select options={[
              { value: '37℃', label: '37℃' },
              { value: '40℃', label: '40℃' },
              { value: '42℃', label: '42℃' },
              { value: '常温', label: '常温' }
            ]} />
          </Form.Item>
          <Form.Item name="parentContact" label="家长联系方式">
            <Input placeholder="选填" />
          </Form.Item>
          <Form.Item name="source" label="信息来源">
            <Select options={[
              { value: '现场', label: '现场点单' },
              { value: '家长群', label: '家长群' },
              { value: '纸质交接单', label: '纸质交接单' }
            ]} />
          </Form.Item>
          <Form.Item name="specialInstructions" label="特殊说明">
            <Input.TextArea rows={2} placeholder="如过敏、不要太烫等" />
          </Form.Item>
          <Form.Item name="createdBy" label="录入人" rules={[{ required: true, message: '请输入录入人' }]}>
            <Input placeholder="您的姓名/岗位" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              创建记录
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
