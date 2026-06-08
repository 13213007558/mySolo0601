import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { ChevronLeft, ClipboardList, Filter, ShieldAlert } from 'lucide-react';
import {
  AUDIT_TYPE_LABEL,
  AUDIT_TYPE_COLOR,
  ROLE_INFO,
  type AuditLogType,
} from '../../shared/types';
import { formatDateTime } from '../utils/helpers';

const ALL_TYPES: (AuditLogType | 'all')[] = [
  'all',
  'export_privacy',
  'import',
  'update',
  'supplement',
  'verify',
  'reject',
  'delete',
];

export default function AuditCenter() {
  const navigate = useNavigate();
  const { auditLogs, importBatches, currentRole } = useAppStore();
  const [filterType, setFilterType] = useState<AuditLogType | 'all'>('all');

  if (currentRole !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-10 text-center">
        <div className="card max-w-md mx-auto">
          <ShieldAlert className="w-12 h-12 text-warm-rose mx-auto mb-3" />
          <h3 className="font-display text-xl text-gray-800 mb-2">权限不足</h3>
          <p className="text-sm text-gray-500 mb-5">
            只有主管角色才能查看审计中心
          </p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            返回提醒墙
          </button>
        </div>
      </div>
    );
  }

  const filtered =
    filterType === 'all' ? auditLogs : auditLogs.filter((l) => l.type === filterType);

  const privacyExportCount = auditLogs.filter(
    (l) => l.type === 'export_privacy',
  ).length;

  return (
    <div className="min-h-screen pb-16">
      <div className="container mx-auto px-4 pt-6 max-w-4xl">
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-ghost mb-5 -ml-2 text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          返回提醒墙
        </button>

        <div className="mb-6 animate-fade-in-up">
          <h2 className="font-display text-2xl text-gray-800 mb-1 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-warm-rose" />
            审计中心
          </h2>
          <p className="text-sm text-gray-500">
            所有操作记录都在这里，方便主管复查
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div
            className="card !p-4 animate-fade-in-up"
            style={{ animationDelay: '0ms' }}
          >
            <div className="text-xs text-gray-500 mb-1">总操作数</div>
            <div className="font-display text-2xl text-gray-800">
              {auditLogs.length}
            </div>
          </div>
          <div
            className="card !p-4 animate-fade-in-up"
            style={{ animationDelay: '50ms' }}
          >
            <div className="text-xs text-gray-500 mb-1">
              隐私导出次数
            </div>
            <div className="font-display text-2xl text-warm-rose">
              {privacyExportCount}
            </div>
          </div>
          <div
            className="card !p-4 animate-fade-in-up"
            style={{ animationDelay: '100ms' }}
          >
            <div className="text-xs text-gray-500 mb-1">手工补录数</div>
            <div className="font-display text-2xl text-violet-600">
              {auditLogs.filter((l) => l.type === 'supplement').length}
            </div>
          </div>
          <div
            className="card !p-4 animate-fade-in-up"
            style={{ animationDelay: '150ms' }}
          >
            <div className="text-xs text-gray-500 mb-1">导入批次</div>
            <div className="font-display text-2xl text-sky-600">
              {importBatches.length}
            </div>
          </div>
        </div>

        <div className="card animate-scale-in">
          <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
            <h3 className="font-display text-lg text-gray-800 flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              操作日志
            </h3>
            <div className="flex items-center gap-1 flex-wrap">
              {ALL_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`
                    px-2.5 py-1 rounded-lg text-xs font-medium transition-all
                    ${
                      filterType === t
                        ? 'bg-warm-orange text-white'
                        : 'bg-cream-50 text-gray-600 hover:bg-cream-100'
                    }
                  `}
                >
                  {t === 'all' ? '全部' : AUDIT_TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 max-h-[65vh] overflow-y-auto scrollbar-thin pr-2">
            {filtered.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>暂无日志记录</p>
              </div>
            ) : (
              filtered.map((log, i) => {
                const roleInfo = ROLE_INFO[log.operatorRole];
                return (
                  <div
                    key={log.id}
                    style={{ animationDelay: `${i * 30}ms` }}
                    className={`
                      relative p-4 rounded-xl border animate-fade-in-up
                      ${
                        log.type === 'export_privacy'
                          ? 'bg-rose-50/50 border-rose-200'
                          : 'bg-cream-50/50 border-cream-200'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`
                          flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center
                          ${roleInfo.color}
                        `}
                      >
                        <span className="text-base">{roleInfo.avatar}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-medium text-gray-800">
                            {log.operatorName}
                          </span>
                          <span
                            className={`tag ${AUDIT_TYPE_COLOR[log.type]}`}
                          >
                            {AUDIT_TYPE_LABEL[log.type]}
                          </span>
                          <span className="text-xs text-gray-400 font-mono ml-auto">
                            {formatDateTime(log.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 break-words">
                          {log.details}
                        </p>
                        {log.fieldsExposed && log.fieldsExposed.length > 0 && (
                          <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-warm-rose/10 border border-warm-rose/20 text-warm-rose text-xs">
                            <ShieldAlert className="w-3 h-3" />
                            暴露字段：{log.fieldsExposed.join('、')}
                          </div>
                        )}
                        {log.targetRecordId && (
                          <div className="mt-1 text-[11px] text-gray-400 font-mono">
                            记录ID: {log.targetRecordId.slice(0, 16)}...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {importBatches.length > 0 && (
          <div className="card mt-6 animate-fade-in-up animate-delay-200">
            <h3 className="font-display text-lg text-gray-800 mb-4 flex items-center gap-2">
              📥 导入批次历史
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 text-xs border-b border-cream-200">
                    <th className="pb-2 pr-4">批次号</th>
                    <th className="pb-2 pr-4">导入时间</th>
                    <th className="pb-2 pr-4">总条数</th>
                    <th className="pb-2 pr-4">成功</th>
                    <th className="pb-2">重复跳过</th>
                  </tr>
                </thead>
                <tbody>
                  {importBatches.map((b) => (
                    <tr
                      key={b.id}
                      className="border-b border-cream-100 last:border-0"
                    >
                      <td className="py-2 pr-4 font-mono text-xs text-gray-600">
                        {b.id.slice(-10)}
                      </td>
                      <td className="py-2 pr-4 text-gray-600">
                        {formatDateTime(b.importedAt)}
                      </td>
                      <td className="py-2 pr-4 text-gray-800">
                        {b.recordsCount}
                      </td>
                      <td className="py-2 pr-4 text-emerald-600 font-medium">
                        {b.recordsCount - b.duplicatesCount - b.skippedCount}
                      </td>
                      <td className="py-2 text-amber-600">
                        {b.duplicatesCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
