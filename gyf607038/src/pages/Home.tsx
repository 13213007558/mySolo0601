import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Download, Search, RotateCcw, AlertTriangle, UserX } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { StatusBadge } from '@/components/Badges';
import CreateRecordModal from '@/components/CreateRecordModal';
import type { RecordFilters, RecordStatus } from '@/utils/types';
import { formatDateTime, getGenderLabel } from '@/utils/helpers';

export default function Home() {
  const { createRecord, exportRecords, getRecords } = useAppStore();
  const recordsState = useAppStore((s) => s.records);
  const [filters, setFilters] = useState<RecordFilters>({});
  const [showCreate, setShowCreate] = useState(false);

  const records = useMemo(() => getRecords(filters), [getRecords, filters, recordsState]);

  const totalBad = useAppStore((s) => s.records.filter((r) => r.isBadData).length);
  const totalNoHandler = useAppStore((s) =>
    s.records.filter((r) => !r.isBadData && r.noHandlerReason).length,
  );

  const reset = () => setFilters({});
  const setField = <K extends keyof RecordFilters>(k: K, v: RecordFilters[K]) =>
    setFilters({ ...filters, [k]: v });

  return (
    <div className="space-y-5">
      {(totalBad > 0 || totalNoHandler > 0) && (
        <div className="flex gap-3">
          {totalBad > 0 && (
            <div className="card px-4 py-3 flex items-center gap-3 border-red-200 bg-red-50/60">
              <AlertTriangle size={18} className="text-red-600" />
              <div className="text-sm">
                <span className="text-red-700 font-medium">{totalBad} 条</span>
                <span className="text-slate-600 ml-1">坏数据已隔离，不影响正常记录</span>
              </div>
            </div>
          )}
          {totalNoHandler > 0 && (
            <div className="card px-4 py-3 flex items-center gap-3 border-warn-200 bg-warn-50/60">
              <UserX size={18} className="text-warn-600" />
              <div className="text-sm">
                <span className="text-warn-700 font-medium">{totalNoHandler} 条</span>
                <span className="text-slate-600 ml-1">记录暂未分配处理人，详情可查原因</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Search size={15} className="text-slate-400" />
            <input
              className="input w-56"
              placeholder="搜姓名/批次号/家长/电话"
              value={filters.keyword || ''}
              onChange={(e) => setField('keyword', e.target.value)}
            />
          </div>
          <select
            className="input w-36"
            value={filters.status || ''}
            onChange={(e) => setField('status', (e.target.value as RecordStatus) || '')}
          >
            <option value="">全部状态</option>
            <option value="pending">待复核</option>
            <option value="reviewed">已复核</option>
            <option value="closed">已关闭</option>
            <option value="invalid">无效数据</option>
          </select>
          <input
            className="input w-40"
            placeholder="批次号"
            value={filters.batchNo || ''}
            onChange={(e) => setField('batchNo', e.target.value)}
          />
          <input
            className="input w-40"
            placeholder="联系电话"
            value={filters.phone || ''}
            onChange={(e) => setField('phone', e.target.value)}
          />
          <button onClick={reset} className="btn-ghost">
            <RotateCcw size={14} /> 重置
          </button>
          <div className="flex-1" />
          <button onClick={() => exportRecords(filters)} className="btn-secondary">
            <Download size={14} /> 导出 CSV
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={14} /> 新增记录
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-th">批次号</th>
              <th className="table-th">婴幼儿</th>
              <th className="table-th">家长</th>
              <th className="table-th">联系电话</th>
              <th className="table-th">状态</th>
              <th className="table-th">创建时间</th>
              <th className="table-th">创建人</th>
              <th className="table-th w-28">操作</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 && (
              <tr>
                <td colSpan={8} className="table-td text-center text-slate-400 py-10">
                  暂无符合条件的记录
                </td>
              </tr>
            )}
            {records.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="table-td font-mono text-xs">{r.batchNo}</td>
                <td className="table-td">
                  <div className="font-medium text-slate-800">{r.infantName}</div>
                  <div className="text-xs text-slate-500">
                    {getGenderLabel(r.gender)} · {r.birthDate}
                  </div>
                </td>
                <td className="table-td">{r.parentName}</td>
                <td className="table-td">{r.phone}</td>
                <td className="table-td"><StatusBadge status={r.status} /></td>
                <td className="table-td text-slate-500 text-xs">{formatDateTime(r.createdAt)}</td>
                <td className="table-td text-slate-500 text-xs">{r.createdBy}</td>
                <td className="table-td">
                  <Link to={`/record/${r.id}`} className="text-brand-700 hover:text-brand-800 text-sm font-medium">
                    查看/修改
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CreateRecordModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={(input) => createRecord(input)}
      />
    </div>
  );
}
