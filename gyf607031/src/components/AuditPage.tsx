import { useEffect } from 'react';
import { Shield, Eye, Edit, Plus, Download, Upload, FileText, ArrowLeft, AlertTriangle, User } from 'lucide-react';
import type { AuditLog } from '../../shared/types';
import { useAppStore } from '../store/appStore';

interface Props {
  onBack: () => void;
}

export default function AuditPage({ onBack }: Props) {
  const audits = useAppStore(s => s.audits);
  const fetchAudits = useAppStore(s => s.fetchAudits);

  useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

  const iconMap: Record<AuditLog['action'], { icon: React.ReactNode; label: string; cls: string }> = {
    view: { icon: <Eye className="w-3.5 h-3.5" />, label: '查看', cls: 'bg-ink-100 text-ink-600 border-ink-200' },
    edit: { icon: <Edit className="w-3.5 h-3.5" />, label: '编辑', cls: 'bg-sage-50 text-sage-700 border-sage-200' },
    create: { icon: <Plus className="w-3.5 h-3.5" />, label: '创建', cls: 'bg-clay-50 text-clay-700 border-clay-200' },
    export: { icon: <Download className="w-3.5 h-3.5" />, label: '导出', cls: 'bg-clay-100 text-clay-700 border-clay-300' },
    import: { icon: <Upload className="w-3.5 h-3.5" />, label: '导入', cls: 'bg-sage-100 text-sage-700 border-sage-200' },
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button className="btn-ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>
        <h2 className="h-display text-xl">审计日志</h2>
        <div className="flex-1" />
        <span className="chip bg-paper-100 text-ink-600 border border-ink-200">
          共 {audits.length} 条
        </span>
      </div>

      <div className="paper-card p-4 bg-clay-50 border-clay-200 flex items-start gap-3">
        <Shield className="w-5 h-5 text-clay-600 mt-0.5" />
        <div className="flex-1 text-sm text-clay-800">
          <div className="font-medium">隐私操作均已留痕</div>
          <div className="text-clay-600 text-xs mt-0.5">
            含手机号等隐私字段的导出操作均会记录操作人、时间与原因，方便主管复查。
          </div>
        </div>
      </div>

      <div className="paper-card overflow-hidden">
        <div className="divide-y divide-ink-50">
          {audits.map(log => {
            const cfg = iconMap[log.action];
            return (
              <div key={log.id} className="px-5 py-4 hover:bg-paper-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`chip border ${cfg.cls} shrink-0`}>
                    {cfg.icon}
                    {cfg.label}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-ink-700">
                      {log.targetType === 'baby' && log.targetId === 'all' ? '全体数据' :
                      log.targetType === 'note' ? `备注变更（${log.targetId}）` :
                      log.targetType === 'baby' ? `宝宝记录 ${log.targetId}` : log.targetId}
                    </div>
                    {log.fieldName && log.oldValue !== undefined && (
                      <div className="text-xs text-ink-500 mt-1 space-y-0.5">
                        <div className="font-mono text-ink-400">字段：{log.fieldName}</div>
                        <div className="text-clay-600">旧值：{log.oldValue}</div>
                        <div className="text-sage-700">新值：{log.newValue}</div>
                      </div>
                    )}
                    {log.reason && (
                      <div className="text-xs text-ink-500 mt-1 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {log.reason}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-ink-500 flex items-center gap-1 justify-end">
                      <User className="w-3 h-3" />
                      {log.operator}
                    </div>
                    <div className="text-[10px] text-ink-400 mt-0.5">{log.timestamp}</div>
                  </div>
                  {log.privacyLeak && (
                    <span className="chip bg-clay-100 text-clay-600 border border-clay-300 shrink-0" title="含隐私字段">
                      <AlertTriangle className="w-3 h-3" />
                      隐私
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
