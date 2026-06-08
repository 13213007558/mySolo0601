import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Download, Eye, Clock, CheckCircle2, AlertTriangle, FileText, User } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { useRecordStore } from '@/store/useRecordStore';
import { exportToCSV, downloadCSV } from '@/utils/csv';

export default function ListPage() {
  const navigate = useNavigate();
  const { initFromMock, filterRecords, getStats } = useRecordStore();
  const [searchPhone, setSearchPhone] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [onlyAbnormal, setOnlyAbnormal] = useState(false);

  useEffect(() => {
    initFromMock();
  }, [initFromMock]);

  const stats = getStats();
  const filteredRecords = filterRecords(searchPhone, statusFilter, onlyAbnormal);

  const handleExport = () => {
    if (filteredRecords.length === 0) return;
    const { content, filename } = exportToCSV(filteredRecords);
    downloadCSV(content, filename);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-ink">改期巡检屏</h1>
          <p className="text-sm text-slate-muted mt-1">监控门店婴幼儿课程改期记录与数据质量</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5 border-l-4 border-l-slate-400">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <div className="text-xs text-slate-muted">待处理</div>
              <div className="text-2xl font-bold text-slate-ink mt-0.5">{stats.pending}</div>
            </div>
          </div>
        </div>

        <div className="card p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-xs text-slate-muted">已处理</div>
              <div className="text-2xl font-bold text-slate-ink mt-0.5">{stats.processed}</div>
            </div>
          </div>
        </div>

        <div className="card p-5 border-l-4 border-l-warning-orange">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warning-orange" />
            </div>
            <div>
              <div className="text-xs text-slate-muted">异常数据</div>
              <div className="text-2xl font-bold text-slate-ink mt-0.5">{stats.abnormal}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-hint" />
            <input
              type="text"
              className="input-field pl-9"
              placeholder="搜索手机号或宝宝姓名..."
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
            />
          </div>

          <select
            className="input-field w-36"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">全部状态</option>
            <option value="pending">待处理</option>
            <option value="processed">已处理</option>
            <option value="abnormal">异常数据</option>
          </select>

          <label className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-paper transition-colors">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-slate-line text-deep-ocean focus:ring-deep-ocean/20"
              checked={onlyAbnormal}
              onChange={(e) => setOnlyAbnormal(e.target.checked)}
            />
            <span className="text-sm text-slate-ink">只看异常</span>
          </label>

          <div className="flex-1" />

          <button
            className="btn-aqua"
            onClick={handleExport}
            disabled={filteredRecords.length === 0}
          >
            <Download className="w-4 h-4" />
            导出 {filteredRecords.length} 条
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-paper border-b border-slate-line">
            <tr>
              <th className="table-cell text-left font-medium text-slate-muted">来源文件</th>
              <th className="table-cell text-left font-medium text-slate-muted">处理人</th>
              <th className="table-cell text-left font-medium text-slate-muted">当前状态</th>
              <th className="table-cell text-left font-medium text-slate-muted">学员信息</th>
              <th className="table-cell text-left font-medium text-slate-muted">最近人工说明</th>
              <th className="table-cell text-right font-medium text-slate-muted">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((record) => (
              <tr
                key={record.id}
                className={`border-b border-slate-line/60 hover:bg-slate-paper/50 transition-colors border-l-4 ${
                  record.issues.length > 0
                    ? 'border-l-warning-orange'
                    : record.isManual
                    ? 'border-l-aqua-teal'
                    : 'border-l-transparent'
                }`}
              >
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-hint" />
                    <span className="text-sm">{record.sourceFile}</span>
                  </div>
                </td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-hint" />
                    <span className="text-sm">{record.handler}</span>
                  </div>
                </td>
                <td className="table-cell">
                  <StatusBadge status={record.status} />
                </td>
                <td className="table-cell">
                  <div>
                    <div className="text-sm font-medium text-slate-ink">{record.babyName}</div>
                    <div className="text-xs text-slate-muted">{record.phone}</div>
                  </div>
                </td>
                <td className="table-cell">
                  <div className="text-sm text-slate-ink max-w-xs truncate" title={record.latestNote}>
                    {record.latestNote || '-'}
                  </div>
                </td>
                <td className="table-cell text-right">
                  <button
                    className="btn-secondary"
                    onClick={() => navigate(`/detail/${record.id}`)}
                  >
                    <Eye className="w-4 h-4" />
                    查看详情
                  </button>
                </td>
              </tr>
            ))}
            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-slate-muted text-sm">
                  暂无符合条件的记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
