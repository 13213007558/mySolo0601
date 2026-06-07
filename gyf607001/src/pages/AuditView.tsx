import { useEffect, useState } from 'react';
import {
  FileCheck,
  GitCompare,
  User,
  Clock,
  CheckCircle,
  ShieldCheck,
  Search,
  Baby,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { AuditLog, CheckStatus } from '../../shared/types';
import { STATUS_LABELS } from '../../shared/types';
import StatusBadge from '@/components/StatusBadge';

type AuditWithBaby = AuditLog & { babyName?: string; className?: string };

export default function AuditView() {
  const { auditLogs, fetchAuditLogs, confirmAudit } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [confirming, setConfirming] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const filtered = auditLogs.filter((log) => {
    if (!keyword.trim()) return true;
    const kw = keyword.trim().toLowerCase();
    return (
      log.babyName?.toLowerCase().includes(kw) ||
      log.className?.toLowerCase().includes(kw) ||
      log.operatorName.toLowerCase().includes(kw) ||
      log.newReason.toLowerCase().includes(kw)
    );
  });

  const handleConfirm = async (auditId: string) => {
    setConfirming(auditId);
    await confirmAudit(auditId);
    setConfirming(null);
  };

  const stats = {
    total: auditLogs.length,
    reviewed: auditLogs.filter((l) => l.reviewedBy).length,
    pending: auditLogs.filter((l) => !l.reviewedBy).length,
  };

  return (
    <div className="max-w-[1400px] mx-auto p-6 min-h-screen">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-brand-500" />
            主管审计视图
          </h2>
          <p className="text-gray-500 mt-1">复查所有人工改判记录，确认后生效</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: '总改判次数', value: stats.total, icon: GitCompare, cls: 'bg-brand-100 text-brand-700' },
          { label: '已复核', value: stats.reviewed, icon: CheckCircle, cls: 'bg-green-100 text-green-700' },
          { label: '待复核', value: stats.pending, icon: ShieldCheck, cls: 'bg-orange-100 text-orange-700' },
        ].map((it) => {
          const Icon = it.icon;
          return (
            <div key={it.label} className="card p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${it.cls} flex items-center justify-center`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{it.label}</p>
                <p className="text-2xl font-display font-bold text-gray-900">{it.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card mb-5 p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜索宝宝姓名、班级、改判人、理由..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card border-2 border-dashed border-gray-200">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-gray-300" />
            </div>
            <h4 className="font-display text-lg font-semibold text-gray-600 mb-1">暂无审计记录</h4>
            <p className="text-sm text-gray-400">
              {keyword ? '没有匹配搜索条件的记录' : '目前还没有人工改判操作'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((log, idx) => (
            <div
              key={log.id}
              className="card animate-fade-in-up"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
                      <Baby className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {log.babyName || '未知宝宝'}
                        <span className="text-sm font-normal text-gray-500 ml-2">{log.className}</span>
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          改判人：{log.operatorName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(log.operatedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div className="rounded-xl border-2 border-red-100 bg-red-50/40 p-4">
                      <p className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        改判前
                      </p>
                      <div className="mb-2">
                        <StatusBadge status={log.oldStatus as CheckStatus} size="sm" />
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{log.oldReason || '(空)'}</p>
                    </div>
                    <div className="rounded-xl border-2 border-green-100 bg-green-50/40 p-4">
                      <p className="text-xs font-semibold text-green-600 mb-2 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        改判后
                      </p>
                      <div className="mb-2">
                        <StatusBadge status={log.newStatus as CheckStatus} size="sm" />
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{log.newReason}</p>
                    </div>
                  </div>

                  {log.reviewedBy && log.reviewedAt && (
                    <div className="mt-4 flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2 inline-flex">
                      <CheckCircle className="w-4 h-4" />
                      已由 <span className="font-medium">{log.reviewedBy}</span> 于{' '}
                      {new Date(log.reviewedAt).toLocaleString()} 复核确认
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0">
                  {!log.reviewedBy ? (
                    <button
                      onClick={() => handleConfirm(log.id)}
                      disabled={confirming === log.id}
                      className="btn-primary flex items-center gap-2"
                    >
                      {confirming === log.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      {confirming === log.id ? '确认中...' : '确认复核'}
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-green-50 text-green-700 border border-green-200 text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      已确认
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <GitCompare className="w-3 h-3" />
                  审计ID: {log.id}
                </span>
                <span className="flex items-center gap-1">
                  完整审计链路已保存 <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
