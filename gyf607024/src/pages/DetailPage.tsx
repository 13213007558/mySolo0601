import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, Phone, BookOpen, FileText, Clock,
  AlertTriangle, XCircle, CheckCircle2, History, Calendar,
  FileEdit, Tag
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { useRecordStore } from '@/store/useRecordStore';

const fieldLabelMap: Record<string, string> = {
  babyName: '宝宝姓名',
  phone: '手机号',
  hours: '课时数量',
  targetCourse: '改期课程',
  unit: '课时单位'
};

export default function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { initFromMock, getRecordById } = useRecordStore();

  useEffect(() => {
    initFromMock();
  }, [initFromMock]);

  const record = id ? getRecordById(id) : undefined;

  if (!record) {
    return (
      <div className="p-6">
        <button className="btn-secondary mb-4" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4" />
          返回列表
        </button>
        <div className="card p-16 text-center">
          <div className="text-slate-muted text-sm">未找到该记录，可能已被删除</div>
        </div>
      </div>
    );
  }

  const sortedLogs = [...record.logs].sort((a, b) => {
    return new Date(b.timestamp.replace(/\//g, '-')).getTime() - new Date(a.timestamp.replace(/\//g, '-')).getTime();
  });

  const infoItems = [
    { icon: <User className="w-4 h-4" />, label: '宝宝姓名', value: record.babyName },
    { icon: <Phone className="w-4 h-4" />, label: '联系手机号', value: record.phone },
    { icon: <BookOpen className="w-4 h-4" />, label: '原课程', value: record.originalCourse },
    { icon: <BookOpen className="w-4 h-4" />, label: '改期课程', value: record.targetCourse },
    { icon: <FileText className="w-4 h-4" />, label: '改期原因', value: record.reason || '-' },
    { icon: <Tag className="w-4 h-4" />, label: '课时', value: `${record.hours} ${record.unit}` },
    { icon: <User className="w-4 h-4" />, label: '处理人', value: record.handler },
    { icon: <FileEdit className="w-4 h-4" />, label: '操作人', value: record.operator },
    { icon: <FileText className="w-4 h-4" />, label: '来源文件', value: record.sourceFile },
    { icon: <Calendar className="w-4 h-4" />, label: '创建时间', value: record.createdAt },
    { icon: <Calendar className="w-4 h-4" />, label: '更新时间', value: record.updatedAt }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <button className="btn-secondary" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4" />
          返回列表
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-ink">改期记录详情</h1>
          <p className="text-sm text-slate-muted mt-0.5">记录 ID：{record.id}</p>
        </div>
        <div className="flex-1" />
        <StatusBadge status={record.status} />
        {record.isManual && (
          <span className="badge bg-aqua-teal/10 text-aqua-teal-dark border border-aqua-teal/30">
            <FileEdit className="w-3 h-3" />
            手工补录
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-base font-semibold text-slate-ink mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-deep-ocean" />
              基础信息
            </h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {infoItems.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-paper flex items-center justify-center text-slate-muted flex-shrink-0">
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-slate-muted">{item.label}</div>
                    <div className="text-sm text-slate-ink mt-0.5 break-words">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-slate-line">
              <div className="text-xs text-slate-muted mb-1">最近人工说明</div>
              <div className="text-sm text-slate-ink bg-slate-paper rounded-lg px-4 py-3">
                {record.latestNote || '暂无人工说明'}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-base font-semibold text-slate-ink mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-deep-ocean" />
              操作流水
              <span className="text-xs font-normal text-slate-muted ml-1">（共 {sortedLogs.length} 条）</span>
            </h2>
            <div className="relative pl-6">
              <div className="absolute left-2.5 top-1 bottom-1 w-px bg-slate-line" />
              {sortedLogs.map((log, idx) => (
                <div key={log.id} className="relative mb-5 last:mb-0">
                  <div className={`absolute -left-[18px] top-1 w-3 h-3 rounded-full border-2 border-white ${
                    log.action === 'status_update'
                      ? 'bg-emerald-500'
                      : log.action === 'manual_create'
                      ? 'bg-aqua-teal'
                      : 'bg-deep-ocean'
                  }`} />
                  <div className="bg-slate-paper rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-ink">
                        {log.action === 'create' && '创建记录'}
                        {log.action === 'manual_create' && '手工补录入库'}
                        {log.action === 'status_update' && '状态更新'}
                      </span>
                      <span className="text-xs text-slate-muted">操作人：{log.operator}</span>
                    </div>
                    <div className="text-sm text-slate-muted mt-1">{log.note}</div>
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-hint">
                      <Clock className="w-3 h-3" />
                      {log.timestamp}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-base font-semibold text-slate-ink mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning-orange" />
              数据质量面板
              {record.issues.length > 0 && (
                <span className="badge bg-danger-red/10 text-danger-red border border-danger-red/30">
                  {record.issues.length} 项问题
                </span>
              )}
            </h2>

            {record.issues.length === 0 ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-emerald-800">数据质量良好</div>
                  <div className="text-xs text-emerald-700 mt-0.5">未检测到任何数据异常</div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {record.issues.map((issue) => {
                  const isError = issue.severity === 'error';
                  const Icon = isError ? XCircle : AlertTriangle;
                  const bgClass = isError ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200';
                  const iconBgClass = isError ? 'bg-red-100 text-danger-red' : 'bg-orange-100 text-warning-orange';
                  const labelColor = isError ? 'text-red-800' : 'text-orange-800';
                  const descColor = isError ? 'text-red-700' : 'text-orange-700';
                  return (
                    <div key={issue.id} className={`rounded-lg border p-4 ${bgClass}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBgClass}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-semibold ${labelColor}`}>
                              {isError ? '错误' : '警告'}
                            </span>
                            <span className="text-xs text-slate-muted bg-white/70 rounded px-2 py-0.5">
                              字段：{fieldLabelMap[issue.field] || issue.field}
                            </span>
                          </div>
                          <div className={`text-sm mt-1.5 ${descColor}`}>
                            {issue.reason}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card p-6 bg-gradient-to-br from-deep-ocean to-deep-ocean-light text-white">
            <h3 className="text-sm font-semibold mb-2">门店售后提示</h3>
            <p className="text-xs text-white/70 leading-relaxed">
              所有带「错误」级别的记录需联系家长核实信息后再处理；警告级别记录建议人工复核确认。手工补录记录请保留纸质凭证备查。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
