import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Baby,
  Phone,
  Calendar,
  Thermometer,
  FileImage,
  GitCompare,
  User,
  Clock,
  PenLine,
  ShieldCheck,
  Eye,
  X,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { DailyCheckRecord, Baby as BabyType } from '../../shared/types';
import { STATUS_LABELS, REVIEW_STATUS_LABELS } from '../../shared/types';
import StatusBadge from '@/components/StatusBadge';
import ReviewModal from '@/components/ReviewModal';

const tempColor = (t: number) => {
  if (t >= 37.5) return 'text-red-600 bg-red-50 border-red-200';
  if (t >= 37.0) return 'text-orange-600 bg-orange-50 border-orange-200';
  return 'text-green-600 bg-green-50 border-green-200';
};

export default function BabyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { babies, getRecordDetail } = useAppStore();

  const [record, setRecord] = useState<DailyCheckRecord | null>(null);
  const [baby, setBaby] = useState<BabyType | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const detail = await getRecordDetail(id);
      if (detail) {
        setRecord(detail);
        const b = babies.find((x) => x.id === detail.babyId);
        if (b) setBaby(b);
      }
      setLoading(false);
    })();
  }, [id, getRecordDetail, babies]);

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="grid lg:grid-cols-[1fr_380px] gap-6">
            <div className="space-y-4">
              <div className="card h-48 bg-gray-100" />
              <div className="card h-96 bg-gray-100" />
            </div>
            <div className="space-y-4">
              <div className="card h-56 bg-gray-100" />
              <div className="card h-72 bg-gray-100" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="max-w-[1400px] mx-auto p-6">
        <button onClick={() => navigate('/review')} className="btn-secondary mb-6 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> 返回复核墙
        </button>
        <div className="card border-2 border-dashed border-gray-200 py-20 text-center">
          <p className="text-gray-500">记录不存在</p>
        </div>
      </div>
    );
  }

  const sortedTemps = [...record.temperatures].sort(
    (a, b) => new Date(b.measureTime).getTime() - new Date(a.measureTime).getTime()
  );

  const auditLogs = record.auditLogs || [];

  return (
    <div className="max-w-[1400px] mx-auto p-6 min-h-screen">
      <button
        onClick={() => navigate('/review')}
        className="btn-secondary mb-6 flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" /> 返回复核墙
      </button>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-5">
          <div className="card p-6 bg-gradient-to-br from-white via-brand-50/30 to-white">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg">
                  <Baby className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-gray-900">{baby?.name || '未知宝宝'}</h2>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {record.date}
                    </span>
                    <span className="text-sm text-gray-500">{baby?.className}</span>
                    <span className="text-sm text-gray-500">{baby?.age}岁</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={record.status} pulse={record.status === 'abnormal'} />
                <span className={`text-xs px-2.5 py-1 rounded-full border ${
                  record.reviewStatus === 'reviewed'
                    ? 'text-green-600 bg-green-50 border-green-200'
                    : record.reviewStatus === 'appealed'
                    ? 'text-blue-600 bg-blue-50 border-blue-200'
                    : 'text-orange-600 bg-orange-50 border-orange-200'
                }`}>
                  {REVIEW_STATUS_LABELS[record.reviewStatus]}
                </span>
              </div>
            </div>

            <div className="mt-5 p-4 rounded-xl bg-white/60 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1.5">当前理由</p>
              <p className="text-sm text-gray-800 leading-relaxed">{record.initialReason || '暂无'}</p>
            </div>

            {record.reviewStatus === 'unreviewed' && (
              <button
                onClick={() => setModalOpen(true)}
                className="btn-primary mt-4 w-full flex items-center justify-center gap-2"
              >
                <PenLine className="w-4 h-4" />
                人工改判（生成审计记录）
              </button>
            )}
          </div>

          <div className="card">
            <h3 className="font-display text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-brand-500" />
              体温枪原始记录
              <span className="ml-auto text-xs font-normal text-gray-500">共 {sortedTemps.length} 次</span>
            </h3>

            {sortedTemps.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">暂无体温记录</div>
            ) : (
              <div className="relative">
                <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gray-100" />
                <div className="space-y-4">
                  {sortedTemps.map((t, idx) => {
                    const d = new Date(t.measureTime);
                    const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
                    return (
                      <div key={t.id} className="relative flex gap-4 animate-fade-in-up" style={{ animationDelay: `${idx * 60}ms` }}>
                        <div className={`relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${tempColor(t.temperature)}`}>
                          <Thermometer className="w-4 h-4" />
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-100">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-3">
                                <span className={`text-2xl font-display font-bold ${t.temperature >= 37.5 ? 'text-red-600' : t.temperature >= 37.0 ? 'text-orange-600' : 'text-green-700'}`}>
                                  {t.temperature.toFixed(1)}℃
                                </span>
                                <span className="text-sm text-gray-500 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  {timeStr}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {t.measurePerson}
                                </span>
                                <span>设备: {t.deviceId}</span>
                              </div>
                            </div>
                          </div>
                          {t.rawNote && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs text-gray-500 mb-0.5">原始备注</p>
                              <p className="text-sm text-gray-700">{t.rawNote}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="font-display text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileImage className="w-5 h-5 text-brand-500" />
              请假条附件
            </h3>

            {record.leaveAttachments.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-xl">
                暂无请假条照片
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {record.leaveAttachments.map((att) => (
                  <div
                    key={att.id}
                    onClick={() => setPreviewImg(att.imageUrl)}
                    className="group relative rounded-xl overflow-hidden border border-gray-100 cursor-pointer hover:shadow-md transition-all"
                  >
                    <img
                      src={att.imageUrl}
                      alt="请假条"
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                      <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-xs text-white">{att.uploadedBy}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="card">
            <h3 className="font-display text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-brand-500" />
              宝宝信息
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">姓名</span>
                <span className="text-sm font-medium text-gray-900">{baby?.name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">班级</span>
                <span className="text-sm font-medium text-gray-900">{baby?.className}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">年龄</span>
                <span className="text-sm font-medium text-gray-900">{baby?.age}岁</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-500">监护人</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{baby?.guardian}</span>
                  <a
                    href={`tel:${baby?.guardianPhone}`}
                    className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center hover:bg-brand-100 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-display text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-brand-500" />
              改判审计记录
              {auditLogs.length > 0 && (
                <span className="ml-auto text-xs font-normal px-2 py-0.5 rounded-full bg-brand-50 text-brand-600">
                  {auditLogs.length} 条
                </span>
              )}
            </h3>

            {auditLogs.length === 0 ? (
              <div className="py-6 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-2">
                  <ShieldCheck className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-sm text-gray-400">暂无改判记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log, idx) => {
                  const d = new Date(log.operatedAt);
                  return (
                    <div
                      key={log.id}
                      className="bg-gray-50 rounded-xl p-3 border border-gray-100 animate-fade-in-up"
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                          {log.operatorName}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {d.toLocaleDateString()} {d.getHours().toString().padStart(2, '0')}:{d.getMinutes().toString().padStart(2, '0')}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-start gap-2 text-xs">
                          <span className="text-gray-400 flex-shrink-0 w-12">状态:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-red-50 text-red-600">{STATUS_LABELS[log.oldStatus as keyof typeof STATUS_LABELS] || log.oldStatus}</span>
                            <ChevronRight className="w-3 h-3 text-gray-300" />
                            <span className="px-2 py-0.5 rounded bg-green-50 text-green-600">{STATUS_LABELS[log.newStatus as keyof typeof STATUS_LABELS] || log.newStatus}</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 text-xs">
                          <span className="text-gray-400 flex-shrink-0 w-12">理由:</span>
                          <div className="flex-1 space-y-1">
                            <div className="bg-red-50 text-red-700 rounded px-2 py-1.5 line-through decoration-red-300">
                              {log.oldReason || '(空)'}
                            </div>
                            <div className="bg-green-50 text-green-700 rounded px-2 py-1.5">
                              {log.newReason}
                            </div>
                          </div>
                        </div>
                      </div>
                      {log.reviewedBy && (
                        <div className="mt-2 pt-2 border-t border-gray-200 flex items-center gap-1.5 text-[11px] text-gray-500">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          已由 {log.reviewedBy} 复核确认
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <ReviewModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        record={record}
        babyName={baby?.name}
      />

      {previewImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          onClick={() => setPreviewImg(null)}
        >
          <button
            onClick={() => setPreviewImg(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={previewImg}
            alt="请假条预览"
            className="max-w-full max-h-full rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
