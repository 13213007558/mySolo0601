import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  Layout, Typography, Table, Tag, Button, Space, Form, Select, DatePicker, Input,
  Modal, Upload, App, Statistic, Row, Col, Card, Tooltip, Popconfirm, FloatButton,
} from 'antd';
import {
  SearchOutlined, DownloadOutlined, PlusOutlined, EyeOutlined, UploadOutlined,
  ExclamationCircleOutlined, DeleteOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import type { UploadFile } from 'antd';
import {
  api, STATUS_MAP, STATUS_OPTIONS, SHIFT_OPTIONS,
  type Baby, type MilkRecord, type QueryParams,
} from '../api';

const { Header, Content } = Layout;
const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface Stats {
  total: number;
  normal_count: number;
  abnormal_count: number;
  pending_count: number;
  photo_missing_count: number;
  dirty_count: number;
}

const ListPage: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [babies, setBabies] = useState<Baby[]>([]);
  const [data, setData] = useState<MilkRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [modalOpen, setModalOpen] = useState(false);
  const [createForm] = Form.useForm();
  const fileListRef = useRef<UploadFile[]>([]);

  const filters = useMemo<QueryParams>(() => {
    const v = form.getFieldsValue(true);
    const params: QueryParams = {
      baby_id: v.baby_id,
      status: v.status,
      shift: v.shift,
      keyword: v.keyword,
      page,
      pageSize,
    };
    if (v.date_range && v.date_range.length === 2) {
      params.record_date_from = v.date_range[0].format('YYYY-MM-DD');
      params.record_date_to = v.date_range[1].format('YYYY-MM-DD');
    }
    return params;
  }, [page, pageSize, form]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getRecords(filters);
      setData(res.list);
      setTotal(res.total);
      const s = await api.getStats();
      setStats(s);
    } catch (e: any) {
      message.error('加载数据失败: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const loadBabies = async () => {
    const list = await api.getBabies();
    setBabies(list);
  };

  useEffect(() => {
    loadBabies();
  }, []);

  useEffect(() => {
    loadData();
  }, [filters]);

  const onSearch = () => {
    setPage(1);
  };

  const onReset = () => {
    form.resetFields();
    setPage(1);
  };

  const handleExport = () => {
    const url = api.getExportUrl({
      baby_id: filters.baby_id,
      record_date_from: filters.record_date_from,
      record_date_to: filters.record_date_to,
      status: filters.status,
      shift: filters.shift,
      keyword: filters.keyword,
    });
    window.open(url, '_blank');
    message.success('已开始导出，与当前筛选结果一致');
  };

  const openCreateModal = () => {
    createForm.resetFields();
    fileListRef.current = [];
    createForm.setFieldsValue({
      record_date: dayjs(),
      shift: '白班',
      milk_type: '母乳',
      status: 'pending',
    });
    setModalOpen(true);
  };

  const handleCreateOk = async () => {
    try {
      const values = await createForm.validateFields();
      let photo_path: string | undefined;
      if (fileListRef.current.length) {
        const file = fileListRef.current[0].originFileObj!;
        const up = await api.uploadPhoto(file);
        photo_path = up.url;
      }
      const payload = {
        ...values,
        record_date: values.record_date.format('YYYY-MM-DD'),
        photo_path,
      };
      await api.createRecord(payload);
      message.success('录入成功');
      setModalOpen(false);
      loadData();
    } catch (e: any) {
      if (e.errorFields) return;
      message.error('录入失败: ' + (e.message || ''));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteRecord(id);
      message.success('已删除');
      loadData();
    } catch (e: any) {
      message.error('删除失败: ' + (e.message || ''));
    }
  };

  const handleMarkDirty = async (id: number) => {
    try {
      await api.markDirty(id, '人工标记为脏数据，不参与正常汇总');
      message.success('已隔离，该记录不会计入正常汇总');
      loadData();
    } catch (e: any) {
      message.error('操作失败: ' + (e.message || ''));
    }
  };

  const columns = [
    {
      title: '日期/时间',
      dataIndex: 'record_date',
      fixed: 'left' as const,
      width: 150,
      render: (_: any, r: MilkRecord) => (
        <div>
          <div style={{ fontWeight: 500 }}>{r.record_date}</div>
          <div style={{ color: '#888', fontSize: 12 }}>{r.record_time} · {r.shift}</div>
        </div>
      ),
    },
    {
      title: '婴儿',
      dataIndex: 'baby_name',
      width: 140,
      render: (_: any, r: MilkRecord) => (
        <div>
          <div style={{ fontWeight: 500 }}>{r.baby_name}</div>
          <div style={{ color: '#888', fontSize: 12 }}>{r.room_no}房 {r.bed_no}床</div>
        </div>
      ),
    },
    {
      title: '奶量(ml)',
      dataIndex: 'milk_amount',
      width: 90,
      sorter: (a: MilkRecord, b: MilkRecord) => a.milk_amount - b.milk_amount,
      render: (v: number) => <strong>{v}</strong>,
    },
    {
      title: '奶型',
      dataIndex: 'milk_type',
      width: 80,
    },
    {
      title: '照片',
      dataIndex: 'photo_path',
      width: 80,
      render: (v?: string) => v
        ? <Tag color="green">已上传</Tag>
        : <Tag color="red" icon={<ExclamationCircleOutlined />}>缺失</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: string, r: MilkRecord) => {
        if (r.is_dirty) {
          return <Tag color="default">已隔离</Tag>;
        }
        const s = STATUS_MAP[v] || { text: v, color: 'default' };
        return <Tag color={s.color as any}>{s.text}</Tag>;
      },
    },
    {
      title: '异常/复核原因',
      dataIndex: 'abnormal_reason',
      width: 200,
      ellipsis: true,
      render: (_: any, r: MilkRecord) => (
        <div>
          {r.abnormal_reason && <div style={{ color: '#d4380d' }}>{r.abnormal_reason}</div>}
          {r.review_note && <div style={{ color: '#1677ff', fontSize: 12 }}>复核: {r.review_note}</div>}
          {r.is_dirty && <div style={{ color: '#999', fontSize: 12 }}>脏数据: {r.dirty_reason}</div>}
        </div>
      ),
    },
    {
      title: '处理人',
      dataIndex: 'handler',
      width: 100,
    },
    {
      title: '复核人',
      dataIndex: 'reviewer',
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 240,
      render: (_: any, r: MilkRecord) => (
        <Space size="small">
          <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => navigate(`/detail/${r.id}`)}>
            详情
          </Button>
          {!r.is_dirty && (
            <Tooltip title="作为脏数据隔离，不参与正常汇总">
              <Button size="small" danger type="link" onClick={() => handleMarkDirty(r.id)}>
                隔离
              </Button>
            </Tooltip>
          )}
          <Popconfirm title="确认删除？该操作不可恢复" onConfirm={() => handleDelete(r.id)}>
            <Button size="small" type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <Header style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '0 24px' }}>
        <Space align="center">
          <Title level={4} style={{ margin: 0 }}>🍼 婴幼儿奶量交接巡检屏</Title>
          <Tag color="blue">月子护理版 · 三楼</Tag>
        </Space>
      </Header>
      <Content style={{ padding: 16 }}>
        {stats && (
          <Row gutter={12} style={{ marginBottom: 12 }}>
            <Col span={4}><Card size="small"><Statistic title="总记录" value={stats.total} /></Card></Col>
            <Col span={4}><Card size="small"><Statistic title="正常" value={stats.normal_count} valueStyle={{ color: '#52c41a' }} /></Card></Col>
            <Col span={4}><Card size="small"><Statistic title="异常" value={stats.abnormal_count} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
            <Col span={4}><Card size="small"><Statistic title="待复核" value={stats.pending_count} valueStyle={{ color: '#faad14' }} /></Card></Col>
            <Col span={4}><Card size="small"><Statistic title="照片缺失" value={stats.photo_missing_count} valueStyle={{ color: '#fa541c' }} /></Card></Col>
            <Col span={4}><Card size="small"><Statistic title="已隔离(脏数据)" value={stats.dirty_count} valueStyle={{ color: '#8c8c8c' }} /></Card></Col>
          </Row>
        )}

        <Card size="small" style={{ marginBottom: 12 }}>
          <Form form={form} layout="inline" onFinish={onSearch} initialValues={{ status: 'all', shift: 'all' }}>
            <Form.Item name="baby_id" label="婴儿">
              <Select allowClear placeholder="全部" style={{ width: 160 }}>
                {babies.map(b => (
                  <Option key={b.id} value={String(b.id)}>{b.name} ({b.room_no}-{b.bed_no})</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="date_range" label="日期">
              <RangePicker />
            </Form.Item>
            <Form.Item name="status" label="状态">
              <Select style={{ width: 120 }} options={STATUS_OPTIONS} />
            </Form.Item>
            <Form.Item name="shift" label="班次">
              <Select style={{ width: 120 }} options={SHIFT_OPTIONS} />
            </Form.Item>
            <Form.Item name="keyword" label="关键字">
              <Input placeholder="姓名/原因/处理人" allowClear style={{ width: 200 }} />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>查询</Button>
                <Button onClick={onReset} icon={<ReloadOutlined />}>重置</Button>
                <Button onClick={handleExport} icon={<DownloadOutlined />} type="primary" ghost>
                  导出Excel
                </Button>
                <Button onClick={openCreateModal} type="primary" icon={<PlusOutlined />}>
                  新增记录
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>

        <Card size="small">
          <Table
            rowKey="id"
            size="small"
            loading={loading}
            dataSource={data}
            columns={columns}
            scroll={{ x: 1400 }}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              pageSizeOptions: ['20', '50', '100'],
              showTotal: (t) => `共 ${t} 条`,
              onChange: (p, ps) => { setPage(p); setPageSize(ps); },
            }}
          />
        </Card>

        <FloatButton.BackTop />
      </Content>

      <Modal
        title="新增喂奶记录"
        open={modalOpen}
        onOk={handleCreateOk}
        onCancel={() => setModalOpen(false)}
        okText="保存记录"
        destroyOnHidden
      >
        <Form form={createForm} layout="vertical">
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="baby_id" label="婴儿" rules={[{ required: true, message: '请选择婴儿' }]}>
                <Select placeholder="选择婴儿">
                  {babies.map(b => (
                    <Option key={b.id} value={b.id}>{b.name} ({b.room_no}-{b.bed_no})</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="record_date" label="日期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="record_time" label="时间" rules={[{ required: true }]}>
                <Input placeholder="如 09:00" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="shift" label="班次" rules={[{ required: true }]}>
                <Select options={[{ label: '白班', value: '白班' }, { label: '小夜', value: '小夜' }, { label: '大夜', value: '大夜' }]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="milk_amount" label="奶量(ml)" rules={[{ required: true }]}>
                <Input type="number" min={0} max={300} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="milk_type" label="奶型" rules={[{ required: true }]}>
                <Select options={[{ label: '母乳', value: '母乳' }, { label: '配方奶', value: '配方奶' }, { label: '混合', value: '混合' }]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="初始状态">
                <Select options={STATUS_OPTIONS.filter(s => s.value !== 'all')} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="handler" label="处理人">
            <Input placeholder="如 护理员王姐" />
          </Form.Item>
          <Form.Item name="abnormal_reason" label="异常原因（如有）">
            <Input.TextArea rows={2} placeholder="例如：婴儿拒奶、吐奶、呛咳、体温异常等" />
          </Form.Item>
          <Form.Item label="喂奶照片">
            <Upload
              beforeUpload={() => false}
              maxCount={1}
              accept="image/*"
              fileList={fileListRef.current}
              onChange={({ fileList }) => { fileListRef.current = fileList; }}
              listType="picture"
            >
              <Button icon={<UploadOutlined />}>上传照片</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default ListPage;
