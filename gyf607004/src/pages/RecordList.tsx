import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Upload, Download, Calendar } from 'lucide-react';
import { useAppStore } from '@/store';
import Layout from '@/components/Layout';
import DataTable from '@/components/DataTable';
import Empty from '@/components/Empty';
import Button from '@/components/Button';
import { STATUS_LABELS, RecordStatus, RescheduleRecord, User } from '@/types';
import type { NavKey } from '@/components/Sidebar';

export default function RecordList() {
  const navigate = useNavigate();
  const {
    init,
    loadRecords,
    records,
    loading,
    currentUser,
    switchUser,
    exportRecords,
  } = useAppStore();

  const [activeNav, setActiveNav] = useState<NavKey>('list');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<RecordStatus | ''>('');
  const [includeIsolated, setIncludeIsolated] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const initialize = async () => {
      await init();
      await loadRecords();
    };
    initialize();
  }, [init, loadRecords]);

  useEffect(() => {
    loadRecords({
      search: search || undefined,
      status: status || undefined,
      includeIsolated,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  }, [search, status, includeIsolated, startDate, endDate, loadRecords]);

  const handleNavChange = (key: NavKey) => {
    setActiveNav(key);
    if (key === 'new') {
      navigate('/records/new');
    } else if (key === 'approve') {
      navigate('/approvals');
    } else if (key === 'import') {
      navigate('/import');
    } else if (key === 'export') {
      handleExport();
    }
  };

  const handleUserSwitch = async (user: User) => {
    await switchUser(user.id);
  };

  const handleView = (record: RescheduleRecord) => {
    navigate(`/records/${record.id}`);
  };

  const handleApprove = (record: RescheduleRecord) => {
    navigate('/approvals');
  };

  const handleNewRecord = () => {
    navigate('/records/new');
  };

  const handleImport = () => {
    navigate('/import');
  };

  const handleExport = async () => {
    try {
      await exportRecords('excel', records);
    } catch {
      //
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value as RecordStatus | '');
  };

  const SkeletonTable = () => (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="overflow-auto max-h-[calc(100vh-200px)]">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="sticky top-0 z-10 bg-gray-50">
            <tr>
              {['来源文件', '宝宝姓名', '原班次 → 改期班次', '处理人', '状态', '最近人工说明', '操作'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {Array.from({ length: 8 }).map((_, idx) => (
              <tr key={idx} className="animate-pulse">
                {Array.from({ length: 7 }).map((__, colIdx) => (
                  <td key={colIdx} className="px-4 py-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (!currentUser) {
    return <div className="flex items-center justify-center h-screen">加载中...</div>;
  }

  return (
    <Layout
      user={currentUser}
      activeNav={activeNav}
      onNavChange={handleNavChange}
      onUserSwitch={handleUserSwitch}
    >
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">记录列表</h1>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search
                className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="搜索宝宝姓名、编号..."
                value={search}
                onChange={handleSearchChange}
                className="w-full h-10 pl-9 pr-3 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-ink-blue/30 focus:border-ink-blue"
              />
            </div>

            <select
              value={status}
              onChange={handleStatusChange}
              className="h-10 px-3 rounded-md border border-gray-300 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-ink-blue/30 focus:border-ink-blue bg-white"
            >
              <option value="">全部状态</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeIsolated}
                onChange={(e) => setIncludeIsolated(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-ink-blue focus:ring-ink-blue/30"
              />
              包含隔离数据
            </label>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Calendar
                  className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10 pl-9 pr-3 rounded-md border border-gray-300 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-ink-blue/30 focus:border-ink-blue"
                />
              </div>
              <span className="text-gray-400 text-sm">至</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 px-3 rounded-md border border-gray-300 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-ink-blue/30 focus:border-ink-blue"
              />
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="primary"
                size="md"
                icon={<Plus className="h-4 w-4" />}
                onClick={handleNewRecord}
              >
                新建记录
              </Button>
              <Button
                variant="secondary"
                size="md"
                icon={<Upload className="h-4 w-4" />}
                onClick={handleImport}
              >
                批量导入
              </Button>
              <Button
                variant="secondary"
                size="md"
                icon={<Download className="h-4 w-4" />}
                onClick={handleExport}
              >
                导出数据
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <SkeletonTable />
        ) : records.length === 0 ? (
          <Empty />
        ) : (
          <DataTable data={records} onView={handleView} onApprove={handleApprove} />
        )}
      </div>
    </Layout>
  );
}
