import { useState, useEffect } from 'react';
import {
  Table, Button, Space, Tag, Input, Select, DatePicker, Form,
  Modal, Drawer, Descriptions, message, Popconfirm, Row, Col,
  Card, Statistic, Upload, Tooltip, Divider, Timeline
} from 'antd';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined,
  CheckCircleOutlined, CloseCircleOutlined, HistoryOutlined,
  DownloadOutlined, ExclamationCircleOutlined, WarningOutlined,
  EyeOutlined, DeleteOutlined, UploadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  recordsApi, babiesApi, usersApi, exportApi, uploadApi
} from './api';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

const RECORD_TYPE_COLOR = {
  normal: 'green',
  temp_supplement: 'orange',
  bad_row: 'red'
};
const RECORD_TYPE_TEXT = {
  normal: '正常',
  temp_supplement: '临时补充',
  bad_row: '坏行'
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

export default function RecordList({ onViewDetail }) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ valid: 0, temp_supplement: 0, bad_row: 0, pending_review: 0 });
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20 });
  const [filters, setFilters] = useState({});
  const [babies, setBabies] = useState([]);
  const [users, setUsers] = useState([]);

  const [addVisible, setAddVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyRecord, setHistoryRecord] = useState(null);
  const [reviewVisible, setReviewVisible] = useState(false);
  const [reviewRecord, setReviewRecord] = useState(null);
  const [reviewAction, setReviewAction] = useState(null);

  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [reviewForm] = Form.useForm();

  useEffect(() => {
    babiesApi.list().then(setBabies);
    usersApi.list().then(setUsers);
  }, []);

  function loadData() {
    setLoading(true);
    const params = { ...filters, page: pagination.page, pageSize: pagination.pageSize };
    recordsApi.list(params).then(res => {
      setData(res.data);
      setTotal(res.total);
      setStats(res.stats);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
      message.error('加载失败');
    });
  }

  useEffect(() => {
    loadData();
  }, [pagination, filters]);

  function handleSearch(values) {
    const newFilters = {};
    if (values.keyword) newFilters.keyword = values.keyword;
    if (values.baby_id) newFilters.baby_id = values.baby_id;
    if (values.status) newFilters.status = values.status;
    if (values.record_type) newFilters.record_type = values.record_type;
    if (values.shift) newFilters.shift = values.shift;
    if (values.date_range && values.date_range.length === 2) {
      newFilters.date_from = values.date_range[0].format('YYYY-MM-DD');
      newFilters.date_to = values.date_range[1].format('YYYY-MM-DD');
    }
    if (values.include_temp) newFilters.include_temp = values.include_temp;
    if (values.only_bad) newFilters.only_bad = values.only_bad;
    setFilters(newFilters);
    setPagination(p => ({ ...p, page: 1 }));
  }

  function handleReset() {
    setFilters({});
    setPagination({ page: 1, pageSize: 20 });
  }

  function handleAdd() {
    addForm.resetFields();
    addForm.setFieldsValue({
      record_date: dayjs(),
      record_type: 'normal',
      shift: 'morning'
    });
    setAddVisible(true);
  }

  function handleAddOk() {
    addForm.validateFields().then(values => {
      const payload = {
        ...values,
        record_date: values.record_date.format('YYYY-MM-DD')
      };
      recordsApi.create(payload).then(() => {
        message.success('创建成功');
        setAddVisible(false);
        loadData();
      }).catch(() => message.error('创建失败'));
    });
  }

  function handleEdit(record) {
    setEditingRecord(record);
    editForm.setFieldsValue({
      ...record,
      record_date: dayjs(record.record_date)
    });
    setEditVisible(true);
  }

  function handleEditOk() {
    editForm.validateFields().then(values => {
      const payload = {
        ...values,
        record_date: values.record_date.format('YYYY-MM-DD')
      };
      recordsApi.update(editingRecord.id, payload).then(() => {
        message.success('修改成功');
        setEditVisible(false);
        loadData();
      }).catch(() => message.error('修改失败'));
    });
  }

  function handleReview(record, action) {
    setReviewRecord(record);
    setReviewAction(action);
    reviewForm.resetFields();
    setReviewVisible(true);
  }

  function handleReviewOk() {
    reviewForm.validateFields().then(values => {
      recordsApi.review(reviewRecord.id, { action: reviewAction, reason: values.reason }).then(() => {
        message.success(reviewAction === 'approve' ? '复核通过' : reviewAction === 'reject' ? '已驳回' : '已标记为坏行');
        setReviewVisible(false);
        loadData();
      }).catch(() => message.error('操作失败'));
    });
  }

  function handleHistory(record) {
    setHistoryRecord(record);
    recordsApi.history(record.id).then(logs => {
      setHistoryData(logs);
      setHistoryVisible(true);
    }).catch(() => message.error('加载历史失败'));
  }

  function handleInvalidate(record) {
    recordsApi.invalidate(record.id, { reason: '删除' }).then(() => {
      message.success('已删除');
      loadData();
    }).catch(() => message.error('删除失败'));
  }

  function handleExport() {
    exportApi.download(filters);
  }

  function handleUpload(file) {
    uploadApi.file(file).then(res => {
      editForm.setFieldsValue({ photo_url: res.url });
      message.success('上传成功');
    }).catch(() => message.error('上传失败'));
    return false;
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
      fixed: 'left'
    },
    {
      title: '宝宝',
      dataIndex: 'baby_name',
      width: 80,
      render: (t, r) => (
        <Space>
          <span>{t}</span>
          <Tag>{r.room_no}</Tag>
        </Space>
      )
    },
    {
      title: '批次号',
      dataIndex: 'batch_no',
      width: 130
    },
    {
      title: '类型',
      dataIndex: 'record_type',
      width: 90,
      render: (t) => <Tag color={RECORD_TYPE_COLOR[t]}>{RECORD_TYPE_TEXT[t]}</Tag>
    },
    {
      title: '日期',
      dataIndex: 'record_date',
      width: 110,
      sorter: (a, b) => a.record_date.localeCompare(b.record_date)
    },
    {
      title: '班次',
      dataIndex: 'shift_text',
      width: 70
    },
    {
      title: '护理员',
      dataIndex: 'nurse_name',
      width: 100
    },
    {
      title: '体温',
      dataIndex: 'temperature',
      width: 70,
      render: (v) => v ? `${v}℃` : '-'
    },
    {
      title: '体重',
      dataIndex: 'weight',
      width: 80,
      render: (v) => v ? `${v}kg` : '-'
    },
    {
      title: '喂奶量',
      dataIndex: 'feeding_amount',
      width: 80,
      render: (v) => v ? `${v}ml` : '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (t) => <Tag color={STATUS_COLOR[t]}>{STATUS_TEXT[t]}</Tag>
    },
    {
      title: '整改',
      dataIndex: 'rectification_status',
      width: 80,
      render: (t) => <Tag color={RECT_COLOR[t]}>{RECT_TEXT[t]}</Tag>
    },
    {
      title: '家长可见备注',
      dataIndex: 'notes_public',
      width: 180,
      ellipsis: true
    },
    {
      title: '操作',
      key: 'action',
      width: 340,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => onViewDetail(record.id)}>详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>修改</Button>
          <Button type="link" size="small" icon={<HistoryOutlined />} onClick={() => handleHistory(record)}>历史</Button>
          {record.status === 'pending_review' && (
            <>
              <Button type="link" size="small" icon={<CheckCircleOutlined />} style={{ color: '#52c41a' }} onClick={() => handleReview(record, 'approve')}>通过</Button>
              <Button type="link" size="small" icon={<CloseCircleOutlined />} style={{ color: '#ff4d4f' }} onClick={() => handleReview(record, 'reject')}>驳回</Button>
            </>
          )}
          {record.record_type !== 'bad_row' && (
            <Button type="link" size="small" icon={<WarningOutlined />} style={{ color: '#faad14' }} onClick={() => handleReview(record, 'mark_bad')}>标记坏行</Button>
          )}
          <Popconfirm title="确认删除？" onConfirm={() => handleInvalidate(record)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="正常记录" value={stats.valid} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="临时补充" value={stats.temp_supplement} valueStyle={{ color: '#faad14' }} prefix={<ExclamationCircleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="坏行（已隔离）" value={stats.bad_row} valueStyle={{ color: '#ff4d4f' }} prefix={<WarningOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="待复核" value={stats.pending_review} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Form layout="inline" onFinish={handleSearch} initialValues={{ include_temp: true }}>
          <Form.Item name="keyword">
            <Input placeholder="搜索姓名/批次号/护理员" prefix={<SearchOutlined />} style={{ width: 200 }} allowClear />
          </Form.Item>
          <Form.Item name="baby_id">
            <Select placeholder="选择宝宝" style={{ width: 140 }} allowClear>
              {babies.map(b => <Option key={b.id} value={b.id}>{b.name} ({b.room_no})</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="状态" style={{ width: 110 }} allowClear>
              <Option value="pending_review">待复核</Option>
              <Option value="reviewed">已复核</Option>
              <Option value="rejected">已驳回</Option>
            </Select>
          </Form.Item>
          <Form.Item name="record_type">
            <Select placeholder="记录类型" style={{ width: 110 }} allowClear>
              <Option value="normal">正常</Option>
              <Option value="temp_supplement">临时补充</Option>
              <Option value="bad_row">坏行</Option>
            </Select>
          </Form.Item>
          <Form.Item name="shift">
            <Select placeholder="班次" style={{ width: 90 }} allowClear>
              <Option value="morning">早班</Option>
              <Option value="afternoon">午班</Option>
              <Option value="night">夜班</Option>
            </Select>
          </Form.Item>
          <Form.Item name="date_range">
            <RangePicker />
          </Form.Item>
          <Form.Item name="only_bad" valuePropName="checked">
            <span style={{ color: '#ff4d4f' }}>仅看坏行</span>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>筛选</Button>
              <Button onClick={handleReset} icon={<ReloadOutlined />}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增记录</Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>导出 Excel</Button>
            <span style={{ color: '#999', marginLeft: 12 }}>共 {total} 条记录</span>
          </Space>
        </div>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          scroll={{ x: 1600 }}
          rowClassName={(r) => r.record_type === 'bad_row' ? 'row-bad' : r.record_type === 'temp_supplement' ? 'row-temp' : ''}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total,
            showSizeChanger: true,
            onChange: (page, pageSize) => setPagination({ page, pageSize })
          }}
        />
      </Card>

      <Modal
        title="新增护理记录"
        open={addVisible}
        onOk={handleAddOk}
        onCancel={() => setAddVisible(false)}
        width={700}
        okText="创建"
        cancelText="取消"
      >
        <Form form={addForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="宝宝" name="baby_id" rules={[{ required: true, message: '请选择宝宝' }]}>
                <Select>
                  {babies.map(b => <Option key={b.id} value={b.id}>{b.name} ({b.room_no})</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="批次号" name="batch_no" rules={[{ required: true, message: '请输入批次号' }]}>
                <Input placeholder="如 B2026060801" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="记录类型" name="record_type" rules={[{ required: true }]}>
                <Select>
                  <Option value="normal">正常记录</Option>
                  <Option value="temp_supplement">临时补充</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="记录日期" name="record_date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="班次" name="shift" rules={[{ required: true }]}>
                <Select>
                  <Option value="morning">早班</Option>
                  <Option value="afternoon">午班</Option>
                  <Option value="night">夜班</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="体温(℃)" name="temperature">
                <Input type="number" step="0.1" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="体重(kg)" name="weight">
                <Input type="number" step="0.01" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="喂奶量(ml)" name="feeding_amount">
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="换尿布次数" name="diaper_count">
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="睡眠时长(小时)" name="sleep_hours">
                <Input type="number" step="0.5" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="护理员" name="nurse_name">
                <Input />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="家长可见备注" name="notes_public" extra="该备注内容将对家长可见">
                <TextArea rows={2} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="内部备注" name="notes_internal" extra="仅内部人员可见，家长不可见">
                <TextArea rows={2} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="照片说明" name="photo_description">
                <Input />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="跨班交接说明" name="cross_shift_reason" extra="填写后将在详情页显著提示">
                <TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="修改护理记录"
        open={editVisible}
        onOk={handleEditOk}
        onCancel={() => setEditVisible(false)}
        width={700}
        okText="保存"
        cancelText="取消"
      >
        <Form form={editForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="宝宝" name="baby_id">
                <Select>
                  {babies.map(b => <Option key={b.id} value={b.id}>{b.name} ({b.room_no})</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="批次号" name="batch_no">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="记录类型" name="record_type">
                <Select>
                  <Option value="normal">正常记录</Option>
                  <Option value="temp_supplement">临时补充</Option>
                  <Option value="bad_row">坏行</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="记录日期" name="record_date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="班次" name="shift">
                <Select>
                  <Option value="morning">早班</Option>
                  <Option value="afternoon">午班</Option>
                  <Option value="night">夜班</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="体温(℃)" name="temperature">
                <Input type="number" step="0.1" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="体重(kg)" name="weight">
                <Input type="number" step="0.01" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="喂奶量(ml)" name="feeding_amount">
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="换尿布次数" name="diaper_count">
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="睡眠时长(小时)" name="sleep_hours">
                <Input type="number" step="0.5" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="护理员" name="nurse_name">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="整改状态" name="rectification_status">
                <Select>
                  <Option value="none">无</Option>
                  <Option value="pending">待整改</Option>
                  <Option value="done">已整改</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="照片" name="photo_url">
                <Space>
                  <Upload beforeUpload={handleUpload} showUploadList={false}>
                    <Button icon={<UploadOutlined />}>上传</Button>
                  </Upload>
                  <span style={{ color: '#999' }}>{editForm.getFieldValue('photo_url') || '未上传'}</span>
                </Space>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="家长可见备注" name="notes_public">
                <TextArea rows={2} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="内部备注" name="notes_internal">
                <TextArea rows={2} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="照片说明" name="photo_description">
                <Input />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="整改记录" name="rectification_note">
                <TextArea rows={2} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="跨班交接说明" name="cross_shift_reason">
                <TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title={
          reviewAction === 'approve' ? '复核通过' :
          reviewAction === 'reject' ? '复核驳回' : '标记为坏行'
        }
        open={reviewVisible}
        onOk={handleReviewOk}
        onCancel={() => setReviewVisible(false)}
        okText="确认"
        cancelText="取消"
      >
        <Form form={reviewForm} layout="vertical">
          <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="记录ID">{reviewRecord?.id}</Descriptions.Item>
            <Descriptions.Item label="宝宝">{reviewRecord?.baby_name}</Descriptions.Item>
            <Descriptions.Item label="批次">{reviewRecord?.batch_no}</Descriptions.Item>
          </Descriptions>
          <Form.Item label="原因说明" name="reason" rules={[{ required: reviewAction !== 'approve', message: '请填写原因' }]}>
            <TextArea rows={3} placeholder={reviewAction === 'approve' ? '（可选）填写复核意见' : '请填写操作原因'} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={
          <Space>
            <HistoryOutlined />
            <span>操作历史 - {historyRecord?.batch_no}</span>
          </Space>
        }
        width={560}
        open={historyVisible}
        onClose={() => setHistoryVisible(false)}
      >
        <Timeline
          items={historyData.map(log => ({
            color: log.action === 'create' ? 'blue' :
                   log.action === 'update' ? 'cyan' :
                   log.action === 'review' ? 'green' :
                   log.action === 'reject' ? 'red' :
                   log.action === 'view_unauthorized' ? 'orange' : 'gray',
            children: (
              <div>
                <Space style={{ marginBottom: 4 }}>
                  <Tag>{log.action_text}</Tag>
                  <span style={{ color: '#666' }}>{log.operator_name}</span>
                  <span style={{ color: '#999' }}>({log.operator_role})</span>
                </Space>
                {log.field_name && (
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                    字段：<b>{log.field_name}</b>
                    {log.old_value !== null && log.old_value !== undefined && (
                      <span> → 从 <span style={{ color: '#ff4d4f' }}>{String(log.old_value).slice(0, 40)}</span></span>
                    )}
                    {log.new_value !== null && log.new_value !== undefined && (
                      <span> 改为 <span style={{ color: '#52c41a' }}>{String(log.new_value).slice(0, 40)}</span></span>
                    )}
                  </div>
                )}
                {log.reason && <div style={{ fontSize: 12, color: '#1890ff' }}>原因：{log.reason}</div>}
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{log.created_at}</div>
              </div>
            )
          }))}
        />
      </Drawer>
    </div>
  );
}
