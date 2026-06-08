import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  DatePicker,
  Select,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Typography,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  ExportOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { recordApi, childApi, suspiciousApi } from '../services/api';
import type { MilkRecord, Child, RecordStatus, RecordSource, SuspiciousRecord } from '../types';
import { STATUS_TEXT, SOURCE_TEXT, STATUS_COLOR } from '../types';
import ReviewPanel from '../components/ReviewPanel';
import SuspiciousPanel from '../components/SuspiciousPanel';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

const RecordList: React.FC = () => {
  const [records, setRecords] = useState<MilkRecord[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [suspiciousRecords, setSuspiciousRecords] = useState<SuspiciousRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [childFilter, setChildFilter] = useState<number | undefined>();
  const [statusFilter, setStatusFilter] = useState<RecordStatus | undefined>();
  const [sourceFilter, setSourceFilter] = useState<RecordSource | undefined>();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [suspiciousModalVisible, setSuspiciousModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MilkRecord | null>(null);
  const [form] = Form.useForm();
  const [operator, setOperator] = useState('前台小张');

  useEffect(() => {
    loadChildren();
    loadRecords();
    loadSuspicious();
  }, [page, pageSize]);

  const loadChildren = async () => {
    try {
      const res = await childApi.list();
      setChildren((await res).data);
    } catch (error) {
      message.error('加载孩子列表失败');
    }
  };

  const loadRecords = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        pageSize,
      };
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      if (childFilter) {
        params.childId = childFilter;
      }
      if (statusFilter) {
        params.status = statusFilter;
      }
      if (sourceFilter) {
        params.source = sourceFilter;
      }
      const res = await recordApi.list(params);
      setRecords((await res).data.data);
      setTotal((await res).data.total);
    } catch (error) {
      message.error('加载记录失败');
    } finally {
      setLoading(false);
    }
  };

  const loadSuspicious = async () => {
    try {
      const res = await suspiciousApi.list();
      setSuspiciousRecords((await res).data.filter((r) => !r.handled));
    } catch (error) {
      console.error('加载可疑记录失败', error);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadRecords();
  };

  const handleReset = () => {
    setDateRange(null);
    setChildFilter(undefined);
    setStatusFilter(undefined);
    setSourceFilter(undefined);
    setPage(1);
    setTimeout(loadRecords, 0);
  };

  const handleCreate = async (values: any) => {
    try {
      await recordApi.create({
        ...values,
        recordDate: values.recordDate.format('YYYY-MM-DD'),
        operator,
      });
      message.success('创建成功');
      setCreateModalVisible(false);
      form.resetFields();
      loadRecords();
      loadSuspicious();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const handleExport = async () => {
    try {
      const params: any = {};
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      if (childFilter) {
        params.childId = childFilter;
      }
      if (statusFilter) {
        params.status = statusFilter;
      }
      if (sourceFilter) {
        params.source = sourceFilter;
      }
      const res = await recordApi.export(params);
      const blob = new Blob([(await res).data], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `奶量交接记录_${dayjs().format('YYYY-MM-DD')}.csv`;
      link.click();
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  const handleConfirm = async (record: MilkRecord) => {
    try {
      await recordApi.update(record.id, {
        status: 'CONFIRMED',
        reason: '前台核对无误',
        changeNote: '前台确认记录有效',
        operator,
      });
      message.success('确认成功');
      loadRecords();
      loadSuspicious();
    } catch (error) {
      message.error('确认失败');
    }
  };

  const handleReject = async (record: MilkRecord) => {
    try {
      await recordApi.update(record.id, {
        status: 'REJECTED',
        reason: '前台核对有误，予以驳回',
        changeNote: '前台驳回记录',
        operator,
      });
      message.success('已驳回');
      loadRecords();
      loadSuspicious();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleReview = (record: MilkRecord) => {
    setSelectedRecord(record);
    setReviewModalVisible(true);
  };

  const handleViewDetail = (record: MilkRecord) => {
    window.location.href = `/records/${record.id}`;
  };

  const columns: ColumnsType<MilkRecord> = [
    {
      title: '日期',
      dataIndex: 'recordDate',
      key: 'recordDate',
      width: 120,
      render: (val) => dayjs(val).format('YYYY-MM-DD'),
      sorter: (a, b) => dayjs(a.recordDate).unix() - dayjs(b.recordDate).unix(),
      defaultSortOrder: 'descend',
    },
    {
      title: '儿童姓名',
      dataIndex: ['child', 'name'],
      key: 'childName',
      width: 100,
      render: (val, record) => (
        <Space>
          <span>{val}</span>
          <Tag color="blue">{record.child.age}岁</Tag>
        </Space>
      ),
    },
    {
      title: '奶量(ml)',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (val, record) => (
        <Space>
          <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{val}</span>
          {record.status === 'SUSPICIOUS' && <WarningOutlined style={{ color: '#fa8c16' }} />}
        </Space>
      ),
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 120,
      render: (val) => (
        <Tag color={val === 'PARENT_MESSAGE' ? 'geekblue' : 'purple'}>
          {SOURCE_TEXT[val]}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (val: RecordStatus) => <Tag color={STATUS_COLOR[val]}>{STATUS_TEXT[val]}</Tag>,
    },
    {
      title: '家长留言',
      dataIndex: 'parentMessage',
      key: 'parentMessage',
      width: 180,
      ellipsis: true,
      render: (val) => val || '-',
    },
    {
      title: '交接单编号',
      dataIndex: 'paperNote',
      key: 'paperNote',
      width: 150,
      ellipsis: true,
      render: (val) => val || '-',
    },
    {
      title: '处理原因',
      dataIndex: 'reason',
      key: 'reason',
      width: 150,
      ellipsis: true,
      render: (val) => val || '-',
    },
    {
      title: '处理人',
      dataIndex: 'handledBy',
      key: 'handledBy',
      width: 100,
      render: (val) => val || '-',
    },
    {
      title: '治疗师反馈',
      key: 'feedback',
      width: 100,
      render: (_, record) => (
        record.feedback ? (
          <Badge status="success" text="已填写" />
        ) : (
          <Badge status="default" text="未填写" />
        )
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {record.status === 'PENDING' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleConfirm(record)}
              >
                确认
              </Button>
              <Popconfirm
                title="确定要驳回这条记录吗？"
                onConfirm={() => handleReject(record)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" size="small" danger>
                  驳回
                </Button>
              </Popconfirm>
            </>
          )}
          {(record.status === 'CONFIRMED' || record.status === 'SUSPICIOUS') && (
            <Button
              type="link"
              size="small"
              icon={<RollbackOutlined />}
              onClick={() => handleReview(record)}
            >
              复核
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <Title level={4} style={{ margin: 0 }}>
          奶量交接记录列表
        </Title>
        <Space>
          当前操作人：
          <Select
            value={operator}
            onChange={setOperator}
            style={{ width: 120 }}
          >
            <Option value="前台小张">前台小张</Option>
            <Option value="前台小李">前台小李</Option>
            <Option value="园长">园长</Option>
            <Option value="李治疗师">李治疗师</Option>
          </Select>
          {suspiciousRecords.length > 0 && (
            <Button
              type="primary"
              danger
              icon={<WarningOutlined />}
              onClick={() => setSuspiciousModalVisible(true)}
            >
              可疑记录待处理 ({suspiciousRecords.length})
            </Button>
          )}
          <Button icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
            新建记录
          </Button>
          <Button icon={<ExportOutlined />} onClick={handleExport}>
            导出CSV
          </Button>
        </Space>
      </div>

      <div style={{ marginBottom: '16px', padding: '16px', background: '#fafafa', borderRadius: '8px' }}>
        <Space wrap>
          <RangePicker
            value={dateRange}
            onChange={(val) => setDateRange(val as [dayjs.Dayjs, dayjs.Dayjs] | null)}
          />
          <Select
            placeholder="选择儿童"
            value={childFilter}
            onChange={setChildFilter}
            style={{ width: 150 }}
            allowClear
          >
            {children.map((child) => (
              <Option key={child.id} value={child.id}>
                {child.name} ({child.age}岁)
              </Option>
            ))}
          </Select>
          <Select
            placeholder="选择状态"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="PENDING">待确认</Option>
            <Option value="CONFIRMED">已确认</Option>
            <Option value="REVIEWED">已复核</Option>
            <Option value="REJECTED">已驳回</Option>
            <Option value="SUSPICIOUS">可疑</Option>
          </Select>
          <Select
            placeholder="选择来源"
            value={sourceFilter}
            onChange={setSourceFilter}
            style={{ width: 140 }}
            allowClear
          >
            <Option value="PARENT_MESSAGE">家长群留言</Option>
            <Option value="PAPER_RECEIPT">纸质交接单</Option>
          </Select>
          <Button type="primary" onClick={handleSearch}>
            查询
          </Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={records}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t) => `共 ${t} 条记录`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
        scroll={{ x: 1400 }}
      />

      <Modal
        title="新建奶量记录"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="childId"
            label="儿童"
            rules={[{ required: true, message: '请选择儿童' }]}
          >
            <Select placeholder="请选择儿童">
              {children.map((child) => (
                <Option key={child.id} value={child.id}>
                  {child.name} ({child.age}岁)
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="recordDate"
            label="日期"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="amount"
            label="奶量(ml)"
            rules={[{ required: true, message: '请输入奶量' }]}
          >
            <InputNumber min={0} max={1000} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="source"
            label="来源"
            rules={[{ required: true, message: '请选择来源' }]}
          >
            <Select>
              <Option value="PARENT_MESSAGE">家长群留言</Option>
              <Option value="PAPER_RECEIPT">纸质交接单</Option>
            </Select>
          </Form.Item>
          <Form.Item name="parentMessage" label="家长留言内容">
            <TextArea rows={3} placeholder="家长群留言内容（来源为家长群时建议填写）" />
          </Form.Item>
          <Form.Item name="paperNote" label="交接单编号">
            <Input placeholder="纸质交接单编号（来源为交接单时建议填写）" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                创建
              </Button>
              <Button onClick={() => setCreateModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <ReviewPanel
        visible={reviewModalVisible}
        record={selectedRecord}
        operator={operator}
        onClose={() => {
          setReviewModalVisible(false);
          setSelectedRecord(null);
          loadRecords();
          loadSuspicious();
        }}
      />

      <SuspiciousPanel
        visible={suspiciousModalVisible}
        records={suspiciousRecords}
        operator={operator}
        onClose={() => {
          setSuspiciousModalVisible(false);
          loadRecords();
          loadSuspicious();
        }}
      />
    </div>
  );
};

export default RecordList;
