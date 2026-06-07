import { useCallback, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Baby, User, Phone, Calendar,
  FileWarning, Clock, UserCheck,
  Camera, Shield, AlertTriangle, RefreshCw, Activity,
  FileText, History, Zap,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import StatusBadge from '@/components/StatusBadge';
import ActionPanel from '@/components/ActionPanel';
import { formatDate, formatDateShort, maskPhone } from '@/utils';
import type { DetailResponse } from '@shared/types';
import {
  AUTH_TYPE_LABEL,
  PHOTO_SCOPE_LABEL,
  REMARK_SOURCE_LABEL,
  SYSTEM_EVENT_LABEL,
  AUTH_STATUS_LABEL,
} from '@shared/types';
import { cn } from '@/utils';

export default function Detail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSnapshot, setShowSnapshot] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/records/${id}`);
      if (res.status === 404) {
        setError('记录不存在，可能已被删除或数据库已恢复为初始化数据');
        return;
      }
      if (!res.ok) throw new Error('加载失败');
      setData(await res.json());
    } catch (e: any) {
      setError(e.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-20 text-center text-gray-500">
          加载中...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-16">
          <Link to="/" className="inline-flex items-center gap-1.5 text-brand-500 hover:text-brand-600 mb-4">
            <ArrowLeft className="w-4 h-4" />
            返回列表
          </Link>
          <div className="bg-red-50 border border-red-200 rounded-card p-8 text-center text-red-600">
            <FileWarning className="w-10 h-10 mx-auto mb-2 text-red-400" />
            {error || '记录不存在'}
          </div>
        </div>
      </div>
    );
  }

  const { record, remarks, versions, audits, relatedEvents } = data;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        <div className="flex items-center gap-3 animate-fade-in">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-brand-500 hover:text-brand-600 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> 返回列表
          </button>
          <div className="h-4 w-px bg-cream-300" />
          <h2 className="font-serif text-xl font-bold text-gray-800">照片授权详情</h2>
          <StatusBadge status={record.status} />
          {record.isManualEntry && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand-50 text-brand-600 border border-brand-200">
              手工补录
            </span>
          )}
          {record.isBadData && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700 border border-red-200">
              <AlertTriangle className="w-3 h-3 mr-0.5" /> 已隔离
            </span>
          )}
          <div className="flex-1" />
          <button
            onClick={load}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <RefreshCw className="w-4 h-4" /> 刷新
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <section className="bg-white rounded-card shadow-card border border-cream-200 p-5 animate-fade-in">
              <h3 className="font-serif text-lg font-semibold text-gray-800 mb-4 flex items-center gap-1.5">
                <Baby className="w-4.5 h-4.5 text-brand-500" />
                基础信息
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <InfoRow icon={<Baby className="w-3.5 h-3.5" />} label="婴幼儿姓名">
                  <span className="text-gray-800 font-medium">{record.babyName}</span>
                </InfoRow>
                <InfoRow icon={<Calendar className="w-3.5 h-3.5" />} label="出生日期">
                  {record.babyBirthday ? formatDateShort(record.babyBirthday) : '—'}
                </InfoRow>
                <InfoRow icon={<User className="w-3.5 h-3.5" />} label="家长姓名">
                  {record.parentName}
                </InfoRow>
                <InfoRow icon={<Phone className="w-3.5 h-3.5" />} label="家长电话">
                  <span className="font-mono">{maskPhone(record.parentPhone)}</span>
                </InfoRow>
                <InfoRow icon={<FileText className="w-3.5 h-3.5" />} label="班级">
                  {record.className}
                </InfoRow>
                <InfoRow icon={<UserCheck className="w-3.5 h-3.5" />} label="操作处理人">
                  {record.handlerName || '—'}
                </InfoRow>
                <InfoRow icon={<Camera className="w-3.5 h-3.5" />} label="授权类型">
                  {AUTH_TYPE_LABEL[record.authType]}
                </InfoRow>
                <InfoRow icon={<Shield className="w-3.5 h-3.5" />} label="使用范围">
                  {PHOTO_SCOPE_LABEL[record.photoScope]}
                </InfoRow>
                {record.validStart && (
                    <InfoRow icon={<Clock className="w-3.5 h-3.5" />} label="有效期">
                      {formatDateShort(record.validStart)}
                      {record.validEnd ? ` — ${formatDateShort(record.validEnd)}` : ' 起'}
                    </InfoRow>
                  )}
                <InfoRow icon={<Clock className="w-3.5 h-3.5" />} label="最近更新">
                  {formatDate(record.updatedAt)}
                </InfoRow>
              </div>
            </section>

            <section className="bg-white rounded-card shadow-card border border-cream-200 p-5">
              <h3 className="font-serif text-lg font-semibold text-gray-800 mb-3 flex items-center gap-1.5">
                <History className="w-4.5 h-4.5 text-brand-500" />
                家长原始承诺
              </h3>
              <div className="bg-cream-50 rounded-lg p-4 border border-cream-200 text-sm text-gray-700 leading-relaxed">
                {record.originalCommitment || '—'}
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                以上内容作为最初录入时的家长承诺，仅追加，不覆盖。
              </p>
            </section>

            <section className="bg-white rounded-card shadow-card border border-cream-200 p-5">
              <h3 className="font-serif text-lg font-semibold text-gray-800 mb-4 flex items-center gap-1.5">
                <Activity className="w-4.5 h-4.5 text-brand-500" />
                备注与历史时间线
                <span className="ml-auto text-xs font-normal text-gray-500">
                  共 {remarks.length} 条
                </span>
              </h3>
              <ol className="relative border-l-2 border-cream-200 ml-2.5 pl-5 space-y-4">
                {remarks.map((r) => (
                  <li key={r.id} className="relative">
                    <span
                      className={cn(
                        'absolute -left-[27px] top-1.5 w-3 h-3 rounded-full border-2 border-white ring-2',
                        r.source === 'original_commitment' && 'ring-brand-500 bg-brand-500',
                        r.source === 'supplement' && 'ring-medical-500 bg-medical-500',
                        r.source === 'status_change' && 'ring-gray-400 bg-gray-400',
                        r.source === 'parent_revision' && 'ring-warning-500 bg-warning-500',
                      )}
                    />
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={cn(
                          'text-[11px] px-2 py-0.5 rounded-full border font-medium',
                          r.source === 'original_commitment' && 'bg-brand-50 text-brand-600 border-brand-200',
                          r.source === 'supplement' && 'bg-medical-100 text-medical-600 border-medical-200',
                          r.source === 'status_change' && 'bg-cream-100 text-gray-600 border-cream-300',
                          r.source === 'parent_revision' && 'bg-warning-100 text-warning-600 border-warning-200',
                        )}
                      >
                        {REMARK_SOURCE_LABEL[r.source]}
                      </span>
                      <span className="text-xs text-gray-500">{r.operatorName}</span>
                      <span className="text-[11px] text-gray-400">· {formatDate(r.timestamp)}</span>
                    </div>
                    <div className="text-sm text-gray-700 leading-relaxed mt-1">{r.content}</div>
                  </li>
                ))}
              </ol>
            </section>

            <section className="bg-white rounded-card shadow-card border border-cream-200 p-5">
              <h3 className="font-serif text-lg font-semibold text-gray-800 mb-4 flex items-center gap-1.5">
                <Zap className="w-4.5 h-4.5 text-brand-500" />
                历史版本快照
                <span className="ml-auto text-xs font-normal text-gray-500">
                  共 {versions.length} 个版本 · 每次变更自动生成不可覆盖
                </span>
              </h3>
              <div className="space-y-2">
                {versions
                  .slice()
                  .reverse()
                  .map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between gap-3 p-3 border border-cream-200 rounded-lg hover:bg-cream-50"
                    >
                      <div>
                        <div className="text-sm text-gray-800 font-medium">
                          版本 v{v.version}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {v.changeReason}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          {v.operatorName} · {formatDate(v.createdAt)}
                        </div>
                      </div>
                      <button
                        onClick={() => setShowSnapshot(v.snapshot)}
                        className="text-xs text-brand-600 hover:text-brand-700 px-2.5 py-1 rounded border border-brand-200 bg-brand-50"
                      >
                        查看快照
                      </button>
                    </div>
                  ))}
              </div>
            </section>

            <section className="bg-white rounded-card shadow-card border border-cream-200 p-5">
              <h3 className="font-serif text-lg font-semibold text-gray-800 mb-3 flex items-center gap-1.5">
                <Activity className="w-4.5 h-4.5 text-brand-500" />
                系统事件与异常原因
              </h3>
              {relatedEvents.length === 0 ? (
                <div className="text-sm text-gray-400">暂无系统事件</div>
              ) : (
                <div className="space-y-2">
                  {relatedEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className={cn(
                        'p-3 rounded-lg border',
                        ev.eventType === 'bad_data_isolated' || ev.eventType === 'history_loss_detected'
                          ? 'bg-red-50 border-red-200'
                          : ev.eventType === 'data_recovery'
                            ? 'bg-warning-50 border-warning-200'
                            : 'bg-cream-50 border-cream-200',
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={cn(
                            'text-[11px] px-2 py-0.5 rounded-full border font-medium',
                            ev.eventType === 'bad_data_isolated' &&
                              'bg-red-100 text-red-700 border-red-200',
                            ev.eventType === 'history_loss_detected' &&
                              'bg-red-100 text-red-700 border-red-200',
                            ev.eventType === 'data_recovery' &&
                              'bg-warning-100 text-warning-700 border-warning-200',
                            (ev.eventType === 'service_start' || ev.eventType === 'service_restart') &&
                              'bg-medical-100 text-medical-600 border-medical-200',
                            ev.eventType === 'db_migrated' &&
                              'bg-brand-50 text-brand-600 border-brand-200',
                          )}
                        >
                          {SYSTEM_EVENT_LABEL[ev.eventType]}
                        </span>
                        <span className="text-xs text-gray-500">{ev.title}</span>
                      </div>
                      <div className="text-sm text-gray-700 mt-1">{ev.detail}</div>
                      <div className="text-[11px] text-gray-400 mt-1">{formatDate(ev.createdAt)}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white rounded-card shadow-card border border-cream-200 p-5">
              <h3 className="font-serif text-lg font-semibold text-gray-800 mb-3 flex items-center gap-1.5">
                <FileText className="w-4.5 h-4.5 text-brand-500" />
                操作审计日志
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 border-b border-cream-200">
                      <th className="text-left font-normal py-2 pr-3">时间</th>
                      <th className="text-left font-normal py-2 pr-3">操作</th>
                      <th className="text-left font-normal py-2 pr-3">操作人</th>
                      <th className="text-left font-normal py-2 pr-3">字段</th>
                      <th className="text-left font-normal py-2 pr-3">原因</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audits.map((a) => (
                      <tr key={a.id} className="border-b border-cream-100 last:border-0">
                        <td className="py-2 pr-3 text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(a.timestamp)}
                        </td>
                        <td className="py-2 pr-3 text-gray-700">{actionLabel(a.action)}</td>
                        <td className="py-2 pr-3">{a.operatorName}</td>
                        <td className="py-2 pr-3">
                          {a.field ? (
                            <span className="text-xs text-gray-500">
                              {a.oldValue && (
                                <span>
                                  {(AUTH_STATUS_LABEL as Record<string, string>)[a.oldValue] || a.oldValue} →{' '}
                                </span>
                              )}
                              <span className="text-gray-700">
                                {a.newValue ? ((AUTH_STATUS_LABEL as Record<string, string>)[a.newValue] || a.newValue) : '—'}
                              </span>
                            </span>
                          ) : (
                              <span className="text-gray-400">—</span>
                            )}
                        </td>
                        <td className="py-2 pr-3 text-gray-500 max-w-xs truncate">
                          {a.reason || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <div className="lg:col-span-1">
            <ActionPanel record={record} onUpdated={load} />
          </div>
        </div>
      </main>

      {showSnapshot && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6"
          onClick={() => setShowSnapshot(null)}
        >
          <div
            className="bg-white rounded-card border border-cream-200 max-w-2xl w-full max-h-[80vh] overflow-auto p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-serif text-lg font-semibold">历史版本快照</h4>
              <button
                onClick={() => setShowSnapshot(null)}
                className="text-sm text-gray-500"
              >
                关闭
              </button>
            </div>
            <pre className="bg-cream-50 border border-cream-200 rounded-lg p-4 text-xs text-gray-700 whitespace-pre-wrap break-all">
{JSON.stringify(JSON.parse(showSnapshot), null, 2)}
            </pre>
          </div>
          </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-start gap-2 py-2.5 border-b border-cream-100 last:border-0">
      <span className="text-xs text-gray-500 flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function actionLabel(a: string) {
  const map: Record<string, string> = {
    create: '创建',
    update: '更新',
    status_change: '状态变更',
    supplement_remark: '补充备注',
    manual_entry: '手工补录',
    mark_bad: '标记坏数据',
    restore: '恢复记录',
    export: '导出',
  };
  return map[a] || a;
}
