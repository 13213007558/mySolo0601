import { useState } from 'react';
import {
  Layout,
  Space,
  Button,
  Row,
  Col,
  Card,
  Tag,
  Badge,
  message,
  Tooltip,
  DatePicker,
} from 'antd';
import {
  Leaf,
  FileText,
  Download,
  History,
  UserMinus,
  Edit3,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';


import LedgerTable from '@/components/LedgerTable';
import EmissionChart from '@/components/EmissionChart';
import EmissionFactorCard from '@/components/EmissionFactorCard';
import BatchOperationModal from '@/components/BatchOperationModal';
import ExportSummaryModal from '@/components/ExportSummaryModal';
import { useLedgerStore } from '@/store/useLedgerStore';

const { Header, Content } = Layout;
const { RangePicker } = DatePicker;

export default function HomePage() {
  const navigate = useNavigate();
  const { ledgers, currentUser, selectAll } = useLedgerStore();

  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchOperationType, setBatchOperationType] = useState<'withdraw' | 'modify'>('withdraw');
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const selectedCount = ledgers.filter((l) => l.selected).length;
  const normalCount = ledgers.filter((l) => l.status === 'normal').length;
  const withdrawnCount = ledgers.filter((l) => l.status === 'withdrawn').length;
  const pendingCount = ledgers.filter((l) => l.status === 'pending').length;
  const manualEntryCount = ledgers.filter((l) => l.isManualEntry).length;

  const handleBatchWithdraw = () => {
    if (selectedCount === 0) {
      message.warning('请先选择要操作的记录');
      return;
    }
    setBatchOperationType('withdraw');
    setBatchModalOpen(true);
  };

  const handleBatchModify = () => {
    if (selectedCount === 0) {
      message.warning('请先选择要操作的记录');
      return;
    }
    setBatchOperationType('modify');
    setBatchModalOpen(true);
  };

  const handleDateChange = (_dates: any) => {
    // TODO: 实现日期筛选
  };

  const handleClearSelection = () => {
    selectAll(false);
    message.info('已取消所有选择');
  };

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Header className="bg-gradient-to-r from-teal-800 to-teal-700 px-6 h-16 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
            <Leaf size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-white text-lg font-bold m-0 leading-tight">
              能源碳排台账追踪面板
            </h1>
            <p className="text-teal-100 text-xs m-0">
              楼宇节能顾问专用 · 数据可追溯 · 操作可复盘
            </p>
          </div>
        </div>
        <Space>
          <RangePicker onChange={handleDateChange} size="small" />
          <Button
            icon={<History size={16} />}
            onClick={() => navigate('/review')}
            className="bg-white/10 text-white border-white/30 hover:bg-white/20"
          >
            批量操作复盘
          </Button>
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-teal-400 flex items-center justify-center text-white text-xs font-bold">
              {currentUser.charAt(0)}
            </div>
            <span className="text-white text-sm">{currentUser}</span>
          </div>
        </Space>
      </Header>

      <Content className="p-6">
        <div className="max-w-7xl mx-auto">
          <Row gutter={16} className="mb-6">
            <Col span={4}>
              <Card className="text-center h-full border-l-4 border-l-teal-500">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <FileText size={18} className="text-gray-400" />
                  <span className="text-gray-500 text-sm">总记录数</span>
                </div>
                <div className="text-3xl font-bold text-teal-700">{ledgers.length}</div>
              </Card>
            </Col>
            <Col span={4}>
              <Card className="text-center h-full border-l-4 border-l-green-500">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle size={18} className="text-gray-400" />
                  <span className="text-gray-500 text-sm">正常</span>
                </div>
                <div className="text-3xl font-bold text-green-600">{normalCount}</div>
              </Card>
            </Col>
            <Col span={4}>
              <Card className="text-center h-full border-l-4 border-l-red-500">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <XCircle size={18} className="text-gray-400" />
                  <span className="text-gray-500 text-sm">已撤回</span>
                </div>
                <div className="text-3xl font-bold text-red-600">{withdrawnCount}</div>
              </Card>
            </Col>
            <Col span={4}>
              <Card className="text-center h-full border-l-4 border-l-orange-500">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock size={18} className="text-gray-400" />
                  <span className="text-gray-500 text-sm">待拍板</span>
                </div>
                <div className="text-3xl font-bold text-orange-600">{pendingCount}</div>
              </Card>
            </Col>
            <Col span={4}>
              <Card className="text-center h-full border-l-4 border-l-amber-500">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <AlertTriangle size={18} className="text-gray-400" />
                  <span className="text-gray-500 text-sm">韩工补录</span>
                </div>
                <div className="text-3xl font-bold text-amber-600">{manualEntryCount}</div>
              </Card>
            </Col>
            <Col span={4}>
              <Card className="text-center h-full border-l-4 border-l-blue-500">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <BarChart3 size={18} className="text-gray-400" />
                  <span className="text-gray-500 text-sm">已选择</span>
                </div>
                <Badge count={selectedCount} size="default" color="#1890ff">
                  <div className="text-3xl font-bold text-blue-600">{selectedCount}</div>
                </Badge>
              </Card>
            </Col>
          </Row>

          <Card
            className="mb-6"
            title={
              <Space>
                <BarChart3 size={18} className="text-teal-600" />
                <span className="font-semibold">操作工具栏</span>
                {selectedCount > 0 && (
                  <Tag color="blue">已选择 {selectedCount} 条记录</Tag>
                )}
              </Space>
            }
            extra={
              <Space wrap>
                <Tooltip title="撤回选中的记录（不可回滚）">
                  <Button
                    danger
                    icon={<UserMinus size={16} />}
                    onClick={handleBatchWithdraw}
                    disabled={selectedCount === 0}
                  >
                    批量撤回
                  </Button>
                </Tooltip>
                <Tooltip title="修改选中记录的排放因子（韩工补录）">
                  <Button
                    icon={<Edit3 size={16} />}
                    onClick={handleBatchModify}
                    disabled={selectedCount === 0}
                    className="bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
                  >
                    批量修改排放因子
                  </Button>
                </Tooltip>
                <Button icon={<Download size={16} />} onClick={() => setExportModalOpen(true)}>
                  导出摘要
                </Button>
                {selectedCount > 0 && (
                  <Button onClick={handleClearSelection}>取消选择</Button>
                )}
              </Space>
            }
          />

          <Row gutter={16} className="mb-6">
            <Col span={14}>
              <Card
                title={
                  <Space>
                    <FileText size={18} className="text-teal-600" />
                    <span className="font-semibold">碳排台账列表</span>
                  </Space>
                }
                className="h-full"
                styles={{ body: { padding: 0 } }}
              >
                <LedgerTable />
              </Card>
            </Col>
            <Col span={10}>
              <div className="space-y-6">
                <div className="h-[420px]">
                  <EmissionChart />
                </div>
              </div>
            </Col>
          </Row>

          <EmissionFactorCard />
        </div>
      </Content>

      <BatchOperationModal
        open={batchModalOpen}
        onClose={() => setBatchModalOpen(false)}
        operationType={batchOperationType}
      />

      <ExportSummaryModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
      />
    </Layout>
  );
}
