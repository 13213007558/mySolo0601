import { useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Collapse,
  Descriptions,
  Badge,
  Alert,
  Row,
  Col,
  Statistic,
  Breadcrumb,
} from 'antd';
import {
  ArrowLeft,
  History,
  AlertTriangle,
  Clock,
  User,
  FileText,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLedgerStore } from '@/store/useLedgerStore';
import { OPERATION_TYPE_TEXT_MAP, STATUS_TEXT_MAP } from '@/types';
import type { OperationHistory, CarbonLedger } from '@/types';

const { Panel } = Collapse;

export default function ReviewPage() {
  const navigate = useNavigate();
  const { operationHistories, ledgers } = useLedgerStore();
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);

  const getOperationTypeColor = (type: string) => {
    switch (type) {
      case 'batch_withdraw':
        return 'red';
      case 'batch_modify':
        return 'orange';
      case 'single_edit':
        return 'blue';
      default:
        return 'default';
    }
  };

  const formatValue = (key: string, value: any) => {
    if (key === 'status') {
      const status = value as CarbonLedger['status'];
      return STATUS_TEXT_MAP[status] || value;
    }
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    return value || '(空)';
  };

  const getFieldLabel = (key: string) => {
    const labelMap: Record<string, string> = {
      status: '状态',
      withdrawReason: '撤回原因',
      plainTip: '白话提示',
      carbonEmission: '碳排放量(tCO₂)',
      emissionFactor: '排放因子',
      originalCarbonEmission: '原始排放量',
      originalEmissionFactor: '原始因子',
      isManualEntry: '是否韩工补录',
      manualEntryNote: '补录说明',
      updatedAt: '更新时间',
    };
    return labelMap[key] || key;
  };

  const renderDiff = (
    record: OperationHistory,
    originalValues: Record<string, Partial<CarbonLedger>>,
    newValues: Record<string, Partial<CarbonLedger>>
  ) => {
    const affectedIds = record.affectedIds;

    return (
      <div className="space-y-4 mt-2">
        {affectedIds.map((id) => {
          const ledger = ledgers.find((l) => l.id === id);
          const orig = originalValues[id] || {};
          const newVal = newValues[id] || {};
          const allKeys = [...new Set([...Object.keys(orig), ...Object.keys(newVal)])];

          return (
            <Card
              key={id}
              size="small"
              title={
                <Space>
                  <span className="font-mono text-xs text-gray-500">{id}</span>
                  <span className="font-medium">{ledger?.date}</span>
                  <span>{ledger?.building}</span>
                </Space>
              }
              className="bg-gray-50"
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-gray-500 font-medium">字段</th>
                    <th className="text-right py-2 text-gray-500 font-medium">原始值</th>
                    <th className="text-center py-2 text-gray-400"></th>
                    <th className="text-right py-2 text-gray-500 font-medium">新值</th>
                  </tr>
                </thead>
                <tbody>
                  {allKeys.map((key) => {
                    const origVal = orig[key as keyof CarbonLedger];
                    const newValItem = newVal[key as keyof CarbonLedger];
                    const hasDiff = origVal !== newValItem;

                    return (
                      <tr
                        key={key}
                        className={`border-b border-gray-100 ${hasDiff ? 'bg-yellow-50' : ''}`}
                      >
                        <td className="py-2 text-gray-700">{getFieldLabel(key)}</td>
                        <td className="py-2 text-right text-gray-500 line-through">
                          {formatValue(key, origVal)}
                        </td>
                        <td className="py-2 text-center text-gray-400">→</td>
                        <td
                          className={`py-2 text-right font-medium ${hasDiff ? 'text-teal-600' : 'text-gray-600'}`}
                        >
                          {formatValue(key, newValItem)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          );
        })}
      </div>
    );
  };

  const columns = [
    {
      title: '操作时间',
      dataIndex: 'operationTime',
      key: 'operationTime',
      width: 180,
      sorter: (a: OperationHistory, b: OperationHistory) =>
        new Date(a.operationTime).getTime() - new Date(b.operationTime).getTime(),
      render: (text: string) => (
        <Space>
          <Clock size={14} className="text-gray-400" />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: '操作类型',
      dataIndex: 'operationType',
      key: 'operationType',
      width: 120,
      render: (type: string) => (
        <Tag color={getOperationTypeColor(type)}>
          {OPERATION_TYPE_TEXT_MAP[type as keyof typeof OPERATION_TYPE_TEXT_MAP]}
        </Tag>
      ),
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
      width: 120,
      render: (text: string) => (
        <Space>
          <User size={14} className="text-gray-400" />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: '影响记录数',
      dataIndex: 'affectedIds',
      key: 'affectedIds',
      width: 120,
      align: 'center' as const,
      render: (ids: string[]) => <Badge count={ids.length} color="#1890ff" />,
    },
    {
      title: '操作原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: '回滚状态',
      dataIndex: 'canRollback',
      key: 'canRollback',
      width: 120,
      align: 'center' as const,
      render: () => (
        <Space className="text-red-600">
          <XCircle size={14} />
          <span className="font-medium">不可回滚</span>
        </Space>
      ),
    },
  ];

  const totalOperations = operationHistories.length;
  const totalAffectedRecords = operationHistories.reduce(
    (sum, h) => sum + h.affectedIds.length,
    0
  );
  const batchWithdrawCount = operationHistories.filter(
    (h) => h.operationType === 'batch_withdraw'
  ).length;
  const batchModifyCount = operationHistories.filter(
    (h) => h.operationType === 'batch_modify'
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Breadcrumb className="mb-2">
            <Breadcrumb.Item onClick={() => navigate('/')}>台账追踪面板</Breadcrumb.Item>
            <Breadcrumb.Item>批量操作复盘</Breadcrumb.Item>
          </Breadcrumb>
          <div className="flex items-center justify-between">
            <Space>
              <Button icon={<ArrowLeft size={16} />} onClick={() => navigate('/')}>
                返回
              </Button>
              <h1 className="text-2xl font-bold text-gray-800 m-0">
                <Space>
                  <History size={24} className="text-teal-600" />
                  批量操作复盘
                </Space>
              </h1>
            </Space>
          </div>
        </div>

        <Alert
          message={
            <Space>
              <AlertTriangle size={18} className="text-orange-500" />
              <span className="font-medium">
                本页面保留所有批量操作的原始值快照，操作已生效不可回滚
              </span>
            </Space>
          }
          description="所有操作记录永久保存，用于审计和追溯。如需恢复数据，请联系系统管理员。"
          type="warning"
          showIcon
          className="mb-6"
        />

        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card className="text-center">
              <Statistic
                title="操作总次数"
                value={totalOperations}
                prefix={<History size={18} className="text-gray-400" />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="text-center">
              <Statistic
                title="影响记录总数"
                value={totalAffectedRecords}
                prefix={<FileText size={18} className="text-gray-400" />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="text-center">
              <Statistic
                title="批量撤回"
                value={batchWithdrawCount}
                prefix={<XCircle size={18} className="text-red-500" />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="text-center">
              <Statistic
                title="批量修改"
                value={batchModifyCount}
                prefix={<AlertTriangle size={18} className="text-orange-500" />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>

        <Card>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={operationHistories}
            expandable={{
              expandedRowRender: (record) =>
                renderDiff(record, record.originalValues, record.newValues),
              expandedRowKeys,
              onExpandedRowsChange: (keys) => setExpandedRowKeys(keys as string[]),
              expandIcon: ({ expanded, onExpand, record }) =>
                expanded ? (
                  <span onClick={(e) => onExpand(record, e)}>
                    <ChevronUp size={16} />
                  </span>
                ) : (
                  <span onClick={(e) => onExpand(record, e)}>
                    <ChevronDown size={16} />
                  </span>
                ),
            }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条操作记录`,
            }}
          />
        </Card>
      </div>
    </div>
  );
}
