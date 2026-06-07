import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  FileText,
  UserCircle,
  ChevronRight,
  AlertTriangle,
  Filter,
} from 'lucide-react';
import { useAppStore } from '@/store';
import {
  CorruptedBadge,
  SourceBadge,
  StatusBadge,
} from '@/components/Badges';
import type { RecordStatus, SourceType } from '@/types';
import { formatDateTime } from '@/utils/helpers';

type TabKey = 'normal' | 'corrupted';

const STATUS_OPTIONS: { v: RecordStatus | 'all'; l: string }[] = [
  { v: 'all', l: '全部状态' },
  { v: 'pending', l: '待处理' },
  { v: 'processing', l: '处理中' },
  { v: 'completed', l: '已完成' },
  { v: 'rejected', l: '已驳回' },
  { v: 'cancelled', l: '已取消' },
];

const SOURCE_OPTIONS: { v: SourceType | 'all'; l: string }[] = [
  { v: 'all', l: '全部来源' },
  { v: 'parent_submit', l: '家长录入' },
  { v: 'manual_entry', l: '手工补录' },
  { v: 'file_import', l: '文件导入' },
];

export default function HandoverList() {
  const records = useAppStore((s) => s.records);
  const [tab, setTab] = useState<TabKey>('normal');
  const [kw, setKw] = useState('');
  const [status, setStatus] = useState<RecordStatus | 'all'>('all');
  const [source, setSource] = useState<SourceType | 'all'>('all');

  const normalRecords = useMemo(
    () => records.filter((r) => !r.isCorrupted),
    [records]
  );
  const corruptedRecords = useMemo(
    () => records.filter((r) => r.isCorrupted),
    [records]
  );
  const list = tab === 'normal' ? normalRecords : corruptedRecords;

  const filtered = useMemo(() => {
    return list.filter((r) => {
      if (status !== 'all' && r.currentStatus !== status) return false;
      if (source !== 'all' && r.sourceType !== source) return false;
      if (kw.trim()) {
        const k = kw.trim().toLowerCase();
        return (
          r.babyName.toLowerCase().includes(k) ||
          r.courseName.toLowerCase().includes(k) ||
          (r.submitter || '').toLowerCase().includes(k) ||
          (r.handler || '').toLowerCase().includes(k) ||
          (r.latestNote || '').toLowerCase().includes(k)
        );
      }
      return true;
    });
  }, [list, kw, status, source]);

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="inline-flex rounded-xl2 bg-white p-1 shadow-soft">
          <button
            onClick={() => setTab('normal')}
            className={`px-4 py-2 rounded-xl text-sm transition-all ${
              tab === 'normal'
                ? 'bg-secondary text-white shadow-soft'
                : 'text-gray-600 hover:bg-cream'
            }`}
          >
            正常记录
            <span className="ml-2 text-xs opacity-75">({normalRecords.length})</span>
          </button>
          <button
            onClick={() => setTab('corrupted')}
            className={`px-4 py-2 rounded-xl text-sm transition-all ${
              tab === 'corrupted'
                ? 'bg-red-500 text-white shadow-soft'
                : 'text-gray-600 hover:bg-cream'
            }`}
          >
            <span className="inline-flex items-center gap-1">
              <AlertTriangle size={14} />
              异常记录
              <span className="ml-1 text-xs opacity-75">
                ({corruptedRecords.length})
              </span>
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-[320px] max-w-md">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              className="input-base pl-9"
              placeholder="搜索宝宝姓名 / 课程 / 处理人..."
              value={kw}
              onChange={(e) => setKw(e.target.value)}
            />
          </div>
          <Filter size={16} className="text-gray-400" />
          <select
            className="input-base !w-32"
            value={status}
            onChange={(e) => setStatus(e.target.value as RecordStatus | 'all')}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.v} value={o.v}>
                {o.l}
              </option>
            ))}
          </select>
          <select
            className="input-base !w-32"
            value={source}
            onChange={(e) => setSource(e.target.value as SourceType | 'all')}
          >
            {SOURCE_OPTIONS.map((o) => (
              <option key={o.v} value={o.v}>
                {o.l}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((r, i) => (
          <Link
            key={r.id}
            to={`/handover/${r.id}`}
            className="card group hover:border-primary/50 animate-fade-in-up"
            style={{
              animationDelay: `${i * 40}ms`,
              opacity: r.isCorrupted ? 0.85 : 1,
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display text-lg text-secondary">
                  {r.babyName}
                </h3>
                <StatusBadge status={r.currentStatus} />
                {r.isCorrupted && <CorruptedBadge />}
              </div>
              <ChevronRight
                size={18}
                className="text-gray-300 group-hover:text-primary transition-colors"
              />
            </div>
            <div className="mt-2 text-sm text-gray-600">{r.courseName}</div>
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <FileText size={12} /> {r.sourceFile || '无来源文件'}
              </span>
              <SourceBadge type={r.sourceType} />
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1 text-gray-500">
                <UserCircle size={13} />
                处理人：<span className="text-secondary">{r.handler || '未分配'}</span>
              </div>
              <div className="text-gray-400 ml-auto">
                {formatDateTime(r.createdAt)}
              </div>
            </div>
            {r.latestNote && (
              <div className="mt-3 rounded-xl bg-cream px-3 py-2 text-xs text-gray-600 border border-muted/60">
                <span className="text-secondary font-medium">最近说明：</span>
                {r.latestNote}
              </div>
            )}
            {r.isCorrupted && r.corruptionReason && (
              <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600 border border-red-200">
                <AlertTriangle size={12} className="inline mr-1" />
                {r.corruptionReason}
              </div>
            )}
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full card text-center text-gray-400 py-12">
            暂无{tab === 'corrupted' ? '异常' : ''}记录
          </div>
        )}
      </div>
    </div>
  );
}
