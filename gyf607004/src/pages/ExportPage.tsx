import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, CheckCircle2, Search, Filter } from 'lucide-react';
import { useAppStore } from '@/store';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import { STATUS_LABELS, type RecordStatus, type User } from '@/types';
import type { NavKey } from '@/components/Sidebar';
import { cn } from '@/lib/utils';

const ALL_STATUSES: RecordStatus[] = [
  'pending',
  'approved',
  'rejected',
  'cross_shift',
  'bad_data',
  'archived',
];

const EXPORT_FIELDS = [
  { key: 'babyName', label: '宝宝姓名' },
  { key: 'babyId', label: '宝宝编号' },
  { key: 'originalShift', label: '原班次' },
  { key: 'originalDate', label: '原日期' },
  { key: 'targetShift', label: '改期班次' },
  { key: 'targetDate', label: '改期日期' },
  { key: 'reason', label: '改期原因' },
  { key: 'sourceFileName', label: '来源文件' },
  { key: 'handlerName', label: '处理人' },
  { key: 'status', label: '状态' },
  { key: 'latestNote', label: '最近说明' },
  { key: 'createdAt', label: '创建时间' },
  { key: 'updatedAt', label: '更新时间' },
];

type Format = 'excel' | 'csv';

export default function ExportPage() {
  const navigate = useNavigate();
  const {
    init,
    currentUser,
    switchUser,
    records,
    loadRecords,
    exportRecords,
    loading,
  } = useAppStore();

  const [selectedStatuses, setSelectedStatuses] = useState<RecordStatus[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [includeIsolated, setIncludeIsolated] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>(
    EXPORT_FIELDS.map((f) => f.key)
  );
  const [format, setFormat] = useState<Format>('excel');
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      await init();
    };
    initialize();
  }, [init]);

  useEffect(() => {
    if (currentUser && currentUser.role !== 'supervisor') {
      const state = useAppStore.getState();
      state.accessDeniedInfo = {
        recordId: '',
        babyName: '',
        reason: '仅护理主管可使用数据导出功能',
      };
      useAppStore.setState({ accessDeniedInfo: state.accessDeniedInfo });
      navigate('/access-denied');
    }
  }, [currentUser, navigate]);

  const handleNavChange = (key: NavKey) => {
    switch (key) {
      case 'list':
        navigate('/');
        break;
      case 'new':
        navigate('/records/new');
        break;
      case 'approve':
        navigate('/approvals');
        break;
      case 'import':
        navigate('/records/import');
        break;
      case 'export':
        break;
    }
  };

  const handleUserSwitch = (user: User) => {
    switchUser(user.id);
  };

  const toggleStatus = (status: RecordStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const toggleField = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field)
        ? prev.filter((f) => f !== field)
        : [...prev, field]
    );
  };

  const toggleAllFields = () => {
    if (selectedFields.length === EXPORT_FIELDS.length) {
      setSelectedFields([]);
    } else {
      setSelectedFields(EXPORT_FIELDS.map((f) => f.key));
    }
  };

  const buildFilters = () => ({
    status: selectedStatuses.length === 1 ? selectedStatuses[0] : undefined,
    search: keyword || undefined,
    includeIsolated,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const handlePreview = async () => {
    const filters = buildFilters();
    const filteredRecords = await loadRecords(filters);
    setPreviewCount(filteredRecords.length);
  };

  const handleExport = async () => {
    const filters = buildFilters();
    const filteredRecords = await loadRecords(filters);
    try {
      await exportRecords(format, filteredRecords, selectedFields);
      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
      }, 3000);
    } catch {
      // error handled in store
    }
  };

  if (!currentUser) return null;

  return (
    <Layout
      user={currentUser}
      activeNav="export"
      onNavChange={handleNavChange}
      onUserSwitch={handleUserSwitch}
    >
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">数据导出</h1>
        </div>

        {exportSuccess && (
          <div className="mb-4 rounded-lg border border-status-green/30 bg-status-green/5 p-4 flex items-center gap-2">
            <CheckCircle2 className="h-[18px] w-[18px] text-status-green flex-shrink-0" />
            <span className="text-sm text-gray-700">导出成功，文件已下载</span>
          </div>
        )}

        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-[18px] w-[18px] text-gray-500" />
              <h2 className="text-base font-semibold text-gray-900">筛选条件</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  状态（多选，不选则全部）
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_STATUSES.map((status) => (
                    <button
                      key={status}
                      onClick={() => toggleStatus(status)}
                      className={cn(
                        'inline-flex items-center rounded-md border px-3 py-1.5 text-sm transition-colors',
                        selectedStatuses.includes(status)
                          ? 'border-ink-blue bg-ink-blue text-white'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      )}
                    >
                      {STATUS_LABELS[status]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    开始日期
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-ink-blue focus:ring-ink-blue/20 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    结束日期
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-ink-blue focus:ring-ink-blue/20 bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="includeIsolated"
                  checked={includeIsolated}
                  onChange={(e) => setIncludeIsolated(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-ink-blue focus:ring-ink-blue"
                />
                <label
                  htmlFor="includeIsolated"
                  className="text-sm text-gray-700 cursor-pointer"
                >
                  包含已隔离记录
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  关键词
                </label>
                <div className="relative">
                  <Search
                    className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="搜索宝宝姓名、编号、处理人、原因..."
                    className="w-full rounded-md border border-gray-300 pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-ink-blue focus:ring-ink-blue/20 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">导出字段</h2>
              <button
                onClick={toggleAllFields}
                className="text-sm text-ink-blue hover:underline"
              >
                {selectedFields.length === EXPORT_FIELDS.length ? '取消全选' : '全选'}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {EXPORT_FIELDS.map((field) => (
                <label
                  key={field.key}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedFields.includes(field.key)}
                    onChange={() => toggleField(field.key)}
                    className="h-4 w-4 rounded border-gray-300 text-ink-blue focus:ring-ink-blue"
                  />
                  <span className="text-sm text-gray-700">{field.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">导出格式</h2>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  checked={format === 'excel'}
                  onChange={() => setFormat('excel')}
                  className="h-4 w-4 border-gray-300 text-ink-blue focus:ring-ink-blue"
                />
                <span className="text-sm text-gray-700">Excel (.xlsx)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  checked={format === 'csv'}
                  onChange={() => setFormat('csv')}
                  className="h-4 w-4 border-gray-300 text-ink-blue focus:ring-ink-blue"
                />
                <span className="text-sm text-gray-700">CSV (.csv)</span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={handlePreview}
              loading={loading}
              disabled={loading}
            >
              预览筛选结果
            </Button>
            {previewCount !== null && (
              <span className="text-sm text-gray-600">
                匹配 <span className="font-semibold text-gray-900">{previewCount}</span>{' '}
                条记录
              </span>
            )}
            <div className="flex-1" />
            <Button
              onClick={handleExport}
              loading={loading}
              disabled={loading || selectedFields.length === 0}
              icon={<Download className="h-4 w-4" />}
            >
              导出数据
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
