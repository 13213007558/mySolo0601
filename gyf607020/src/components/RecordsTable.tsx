import { Eye, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusTag from './StatusTag';
import { useStore } from '@/store/useStore';
import { formatDate, formatMilk, maskPhone } from '@/utils/format';
import type { MilkRecord } from '@shared/types';

export default function RecordsTable() {
  const { records, loading, error } = useStore();

  if (loading) {
    return (
      <div className="bg-white rounded-card p-10 text-center text-gray-500 shadow-card border border-cream-200">
        加载中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-card p-6 text-center text-red-600 shadow-card border border-red-200">
        {error}
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <div className="bg-white rounded-card p-10 text-center text-gray-400 shadow-card border border-cream-200">
        暂无符合条件的记录
      </div>
    );
  }

  return (
    <div className="bg-white rounded-card shadow-card border border-cream-200 overflow-hidden animate-fade-in">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream-100 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">序号</th>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">婴儿姓名</th>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">家长手机号</th>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">奶量</th>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">状态</th>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">原因</th>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">处理人</th>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">操作时间</th>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">操作</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r: MilkRecord, idx: number) => (
              <tr
                key={r.id}
                className={`border-t border-cream-100 hover:bg-cream-50/60 transition-colors ${
                  r.isBadData ? 'bg-red-50/80 text-gray-500' : ''
                }`}
              >
                <td className={`px-4 py-3 ${r.isBadData ? 'line-through opacity-70' : ''}`}>
                  {idx + 1}
                </td>
                <td className={`px-4 py-3 font-medium text-gray-800 ${r.isBadData ? 'line-through' : ''}`}>
                  <div className="flex items-center gap-2">
                    {r.babyName}
                    {r.dataIssues && r.dataIssues.length > 0 && (
                      <span
                        title={`${r.dataIssues.length} 项数据问题`}
                        className="inline-flex"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                      </span>
                    )}
                  </div>
                </td>
                <td className={`px-4 py-3 ${r.isBadData ? 'line-through' : ''}`}>
                  <span className="font-mono text-xs">{maskPhone(r.parentPhone)}</span>
                </td>
                <td className={`px-4 py-3 ${r.isBadData ? 'line-through' : ''}`}>{formatMilk(r)}</td>
                <td className="px-4 py-3">
                  <StatusTag status={r.status} />
                </td>
                <td className={`px-4 py-3 max-w-[200px] ${r.isBadData ? 'line-through' : ''}`}>
                  <span className="text-gray-600 text-xs truncate block" title={r.reviewReason}>
                    {r.reviewReason || '—'}
                  </span>
                </td>
                <td className={`px-4 py-3 ${r.isBadData ? 'line-through' : ''}`}>
                  {r.handlerName || '—'}
                </td>
                <td className={`px-4 py-3 text-gray-500 text-xs ${r.isBadData ? 'line-through' : ''}`}>
                  {formatDate(r.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <Link
                    to={`/records/${r.id}`}
                    className="inline-flex items-center gap-1 text-brand-500 hover:text-brand-600 hover:bg-brand-50 px-2 py-1 rounded-md transition-colors text-xs font-medium"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    详情/复核
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
