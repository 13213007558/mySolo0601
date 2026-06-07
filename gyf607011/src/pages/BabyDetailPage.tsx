import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import TraceBreadcrumb from '../components/TraceBreadcrumb';
import RecordEditModal from '../components/RecordEditModal';
import AuditDrawer from '../components/AuditDrawer';
import { DataQualityBadge, ReviewBadge, StatusBadge, TemperatureBadge } from '../components/Badges';
import {
  ArrowLeft,
  Phone,
  FileText,
  Thermometer,
  Calendar,
  Clock,
  User,
  Edit3,
  History,
  ShieldCheck,
  Sparkles,
  ZoomIn,
  FileWarning,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type {
  Baby,
  MorningCheck,
  ThermometerLog,
  LeaveSlip,
  ManualEntry,
  AuditLog,
} from '../../shared/types';

interface DetailData {
  baby: Baby | null;
  records: MorningCheck[];
  thermometerMap: Record<string, ThermometerLog>;
  leaveMap: Record<string, LeaveSlip>;
  manualMap: Record<string, ManualEntry>;
}

export default function BabyDetailPage() {
  const { id = '' } = useParams();
  const [data, setData] = useState<DetailData>({
    baby: null,
    records: [],
    thermometerMap: {},
    leaveMap: {},
    manualMap: {},
  });
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState<{ open: boolean; mode: 'edit' | 'manual'; record?: MorningCheck }>({
    open: false,
    mode: 'edit',
  });
  const [auditDrawer, setAuditDrawer] = useState<{ open: boolean; recordId: string; title: string }>({
    open: false,
    recordId: '',
    title: '',
  });
  const [previewLeave, setPreviewLeave] = useState<LeaveSlip | null>(null);
  const [previewThermo, setPreviewThermo] = useState<ThermometerLog | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    const [babyRes, recRes] = await Promise.all([
      fetch(`/api/babies/${id}`),
      fetch(`/api/records/baby/${id}`),
    ]);
    const babyJson = await babyRes.json();
    const recJson = await recRes.json();
    const baby: Baby | null = babyJson.success ? babyJson.data : null;
    const records: MorningCheck[] = recJson.success ? recJson.data : [];

    const thermometerMap: Record<string, ThermometerLog> = {};
    const leaveMap: Record<string, LeaveSlip> = {};
    const manualMap: Record<string, ManualEntry> = {};

    await Promise.all(
      records.map(async (r) => {
        if (r.thermometerLogId) {
          const res = await fetch(`/api/export/thermometer/${r.thermometerLogId}`);
          const json = await res.json();
          if (json.success) thermometerMap[r.thermometerLogId] = json.data;
        }
        if (r.leaveSlipId) {
          const res = await fetch(`/api/export/leaves/${r.leaveSlipId}`);
          const json = await res.json();
          if (json.success) leaveMap[r.leaveSlipId] = json.data;
        }
        const mRes = await fetch(`/api/records/${r.id}/manual`);
        const mJson = await mRes.json();
        if (mJson.success) manualMap[r.id] = mJson.data;
      }),
    );

    setData({ baby, records, thermometerMap, leaveMap, manualMap });
    setLoading(false);
  };

  const { baby, records, thermometerMap, leaveMap, manualMap } = data;

  if (loading) {
    return (
      <AppLayout>
        <div className="text-center py-20 text-medical-500">加载中...</div>
      </AppLayout>
    );
  }

  if (!baby) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-medical-500 mb-4">未找到宝宝信息</p>
          <Link to="/records" className="text-medical-600 hover:text-medical-800 underline">
            返回列表
          </Link>
        </div>
      </AppLayout>
    );
  }

  const hasManualEntry = Object.keys(manualMap).length > 0;

  return (
    <AppLayout>
      <div className="mb-6 animate-fade-in-up">
        <div className="flex items-center gap-3 mb-5">
          <Link
            to="/records"
            className="w-10 h-10 rounded-xl bg-white border border-medical-100 text-medical-600 hover:bg-medical-50 flex items-center justify-center transition-colors shadow-soft"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <TraceBreadcrumb
              items={[
                { label: `导出表第 ${baby.exportRowNo ?? '?'} 行`, icon: 'sheet' },
                { label: baby.name, icon: 'baby' },
                { label: '详情追溯', icon: 'thermometer', active: true },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-white via-medical-50/40 to-warm-50/40 p-6 shadow-soft border border-medical-100 mb-6 animate-fade-in-up" style={{ animationDelay: '60ms' }}>
        <div className="flex flex-wrap items-start gap-6">
          <img
            src={baby.avatar}
            alt={baby.name}
            className="w-20 h-20 rounded-2xl bg-medical-100 border-4 border-white shadow-card"
          />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="font-serif text-2xl font-bold text-medical-800">{baby.name}</h1>
              <span className="px-2.5 py-1 rounded-md bg-medical-100 text-medical-700 text-sm font-medium">
                {baby.className}
              </span>
              {baby.exportRowNo && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-warm-100 text-warm-700 text-xs font-medium">
                  <FileText className="w-3 h-3" />
                  导出行 #{baby.exportRowNo}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-5 text-sm text-medical-600">
              <span className="inline-flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-medical-400" />
                {baby.parentPhone}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-medical-400" />
                档案号 {baby.healthCode}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setEditModal({ open: true, mode: 'manual' })}
              className="px-4 py-2.5 rounded-xl bg-white border border-warm-200 text-warm-700 text-sm font-medium hover:bg-warm-50 transition-colors flex items-center gap-1.5 shadow-soft"
            >
              <Edit3 className="w-4 h-4" />
              手工补录
            </button>
          </div>
        </div>
      </div>

      {hasManualEntry && (
        <div className="rounded-2xl bg-gradient-to-r from-warm-50 to-warm-100/70 border border-warm-200 p-5 mb-6 animate-fade-in-up" style={{ animationDelay: '120ms' }}>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-warm-200 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-warm-700" />
            </div>
            <div className="flex-1">
              <h3 className="font-serif text-base font-semibold text-warm-800 mb-2">手工补录差异对比</h3>
              <div className="space-y-3">
                {Object.entries(manualMap).map(([recId, manual]) => {
                  const before = manual.beforeSnapshot as Record<string, unknown>;
                  const after = manual.afterSnapshot as Record<string, unknown>;
                  const fields = Object.keys({ ...before, ...after });
                  return (
                    <div key={recId} className="bg-white rounded-xl p-4 border border-warm-100">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-warm-700">补录人：{manual.enteredBy}</span>
                        <span className="text-xs text-warm-500">
                          {new Date(manual.enteredAt).toLocaleString('zh-CN', { hour12: false })}
                        </span>
                      </div>
                      <div className="grid gap-2">
                        {fields.map((f) => {
                          const b = before[f];
                          const a = after[f];
                          const changed = JSON.stringify(b) !== JSON.stringify(a);
                          return (
                            <div key={f} className="flex items-center gap-3 text-sm">
                              <span className={`w-20 text-xs font-medium ${changed ? 'text-warm-600' : 'text-gray-400'}`}>
                                {f}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded font-mono text-xs ${
                                  b === undefined || b === null
                                    ? 'bg-gray-100 text-gray-400 italic'
                                    : 'bg-gray-50 text-gray-500 line-through'
                                }`}
                              >
                                {b === undefined || b === null ? '无值' : String(b)}
                              </span>
                              <span className="text-warm-400">→</span>
                              <span className="px-2 py-0.5 rounded font-mono text-xs bg-medical-50 text-medical-700 font-semibold">
                                {a === undefined || a === null ? '无值' : String(a)}
                              </span>
                              {changed && <CheckCircle2 className="w-3.5 h-3.5 text-medical-500" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="animate-fade-in-up" style={{ animationDelay: '180ms' }}>
        <h2 className="font-serif text-lg font-semibold text-medical-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-medical-500" />
          晨检记录时间轴
        </h2>

        {records.length === 0 ? (
          <div className="text-center py-16 text-medical-400">
            <FileWarning className="w-12 h-12 mx-auto mb-3 opacity-40" />
            暂无晨检记录
          </div>
        ) : (
          <div className="relative pl-8">
            <div className="absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-medical-300 via-medical-200 to-transparent" />
            <div className="space-y-5">
              {records.map((rec, idx) => {
                const thermo = rec.thermometerLogId ? thermometerMap[rec.thermometerLogId] : undefined;
                const leave = rec.leaveSlipId ? leaveMap[rec.leaveSlipId] : undefined;
                const manual = manualMap[rec.id];
                return (
                  <div
                    key={rec.id}
                    className="relative bg-white rounded-2xl p-5 shadow-soft border border-medical-50 hover:shadow-card transition-shadow animate-fade-in-up"
                    style={{ animationDelay: `${240 + idx * 80}ms` }}
                  >
                    <div className="absolute -left-5 top-5 w-4 h-4 rounded-full bg-medical-500 border-4 border-warm-50 shadow-soft" />
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-serif text-lg font-bold text-medical-800">{rec.date}</span>
                        <StatusBadge status={rec.status} />
                        <DataQualityBadge quality={rec.dataQuality} />
                        <ReviewBadge status={rec.reviewStatus} />
                        {manual && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-warm-100 text-warm-700 font-medium">
                            <Sparkles className="w-3 h-3" />
                            手工补录
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditModal({ open: true, mode: 'edit', record: rec })}
                          className="w-8 h-8 rounded-lg text-medical-600 hover:bg-medical-50 flex items-center justify-center transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            setAuditDrawer({
                              open: true,
                              recordId: rec.id,
                              title: `${baby.name} · ${rec.date}`,
                            })
                          }
                          className="w-8 h-8 rounded-lg text-medical-600 hover:bg-medical-50 flex items-center justify-center transition-colors"
                          title="审计历史"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <div className="bg-medical-50/50 rounded-xl p-3">
                        <p className="text-xs text-medical-500 mb-1">体温</p>
                        <TemperatureBadge value={rec.temperature} />
                      </div>
                      <div className="bg-medical-50/50 rounded-xl p-3">
                        <p className="text-xs text-medical-500 mb-1">口腔</p>
                        <p className={`text-sm font-semibold ${rec.oralCheck === 'normal' ? 'text-medical-700' : 'text-red-600'}`}>
                          {rec.oralCheck === 'normal' ? '正常' : '异常'}
                        </p>
                      </div>
                      <div className="bg-medical-50/50 rounded-xl p-3">
                        <p className="text-xs text-medical-500 mb-1">手部</p>
                        <p className={`text-sm font-semibold ${rec.handCheck === 'normal' ? 'text-medical-700' : 'text-red-600'}`}>
                          {rec.handCheck === 'normal' ? '正常' : '异常'}
                        </p>
                      </div>
                      <div className="bg-medical-50/50 rounded-xl p-3">
                        <p className="text-xs text-medical-500 mb-1">皮肤</p>
                        <p className={`text-sm font-semibold ${rec.skinCheck === 'normal' ? 'text-medical-700' : 'text-red-600'}`}>
                          {rec.skinCheck === 'normal' ? '正常' : '异常'}
                        </p>
                      </div>
                    </div>

                    {rec.remark && (
                      <div className="text-sm text-medical-600 bg-warm-50 rounded-lg px-3 py-2 mb-4 border border-warm-100">
                        📝 {rec.remark}
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-3">
                      {thermo && (
                        <button
                          onClick={() => setPreviewThermo(thermo)}
                          className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-medical-50 to-white border border-medical-100 hover:border-medical-300 transition-colors text-left group"
                        >
                          <div className="w-9 h-9 rounded-lg bg-medical-500 text-white flex items-center justify-center shadow-inset-medical flex-shrink-0">
                            <Thermometer className="w-4.5 h-4.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-medical-800 flex items-center gap-2">
                              原始体温枪记录
                              <ZoomIn className="w-3.5 h-3.5 text-medical-400 group-hover:text-medical-600 transition-colors" />
                            </p>
                            <p className="text-xs text-medical-500 mt-0.5">
                              设备 #{thermo.deviceNo}
                            </p>
                            <p className="text-xs text-medical-400 mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(thermo.measuredAt).toLocaleString('zh-CN', { hour12: false })}
                            </p>
                          </div>
                          <div className="font-mono text-lg font-bold text-medical-600">
                            {thermo.temperature.toFixed(1)}°
                          </div>
                        </button>
                      )}

                      {leave && (
                        <button
                          onClick={() => setPreviewLeave(leave)}
                          className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-warm-50 to-white border border-warm-100 hover:border-warm-300 transition-colors text-left group"
                        >
                          <div className="w-9 h-9 rounded-lg bg-warm-500 text-white flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4.5 h-4.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-warm-800 flex items-center gap-2">
                              请假条凭证
                              <ZoomIn className="w-3.5 h-3.5 text-warm-400 group-hover:text-warm-600 transition-colors" />
                            </p>
                            <p className="text-xs text-warm-600 mt-0.5 truncate">{leave.reason}</p>
                            <p className="text-xs text-warm-500 mt-0.5 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {leave.submittedBy}
                            </p>
                          </div>
                          <img
                            src={leave.photoUrl}
                            alt="请假条"
                            className="w-12 h-16 object-cover rounded-lg border border-warm-200"
                          />
                        </button>
                      )}

                      {!thermo && !leave && rec.dataQuality === 'empty' && (
                        <div className="md:col-span-2 p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-500 flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-gray-400" />
                          无原始体温枪记录或请假条凭证，数据待补录
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

      {previewThermo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-dissolve">
          <div className="absolute inset-0 bg-medical-900/60 backdrop-blur-sm" onClick={() => setPreviewThermo(null)} />
          <div className="relative bg-white rounded-2xl shadow-card max-w-md w-full p-6 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-medical-500 text-white flex items-center justify-center shadow-inset-medical">
                <Thermometer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-semibold text-medical-800">体温枪原始记录</h3>
                <p className="text-xs text-medical-500">设备编号：{previewThermo.deviceNo}</p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-medical-50 to-warm-50 rounded-xl p-5 mb-4">
              <div className="text-center mb-4">
                <p className="text-sm text-medical-500 mb-1">测量值</p>
                <p className="font-mono text-5xl font-bold text-medical-700">{previewThermo.temperature.toFixed(1)}°C</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-medical-500">测量时间</span>
                  <span className="text-medical-800 font-mono">
                    {new Date(previewThermo.measuredAt).toLocaleString('zh-CN', { hour12: false })}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-medical-600 mb-2">原始数据快照</p>
              <pre className="bg-medical-900 text-medical-100 rounded-lg p-3 text-xs font-mono overflow-x-auto">
                {JSON.stringify(JSON.parse(previewThermo.rawSnapshot), null, 2)}
              </pre>
            </div>
            <button
              onClick={() => setPreviewThermo(null)}
              className="mt-5 w-full py-2.5 rounded-xl bg-medical-500 text-white font-medium shadow-inset-medical hover:bg-medical-600 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {previewLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-dissolve">
          <div className="absolute inset-0 bg-medical-900/60 backdrop-blur-sm" onClick={() => setPreviewLeave(null)} />
          <div className="relative bg-white rounded-2xl shadow-card max-w-lg w-full p-6 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-warm-500 text-white flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-semibold text-warm-800">请假条凭证</h3>
                <p className="text-xs text-warm-500">提交人：{previewLeave.submittedBy}</p>
              </div>
            </div>
            <img
              src={previewLeave.photoUrl}
              alt="请假条"
              className="w-full rounded-xl border border-warm-100 shadow-soft mb-4"
            />
            <div className="space-y-2 text-sm bg-warm-50 rounded-xl p-4 border border-warm-100">
              <div className="flex justify-between">
                <span className="text-warm-500">请假事由</span>
                <span className="text-warm-800 font-medium">{previewLeave.reason}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-warm-500">提交时间</span>
                <span className="text-warm-800 font-mono text-xs">
                  {new Date(previewLeave.submittedAt).toLocaleString('zh-CN', { hour12: false })}
                </span>
              </div>
            </div>
            <button
              onClick={() => setPreviewLeave(null)}
              className="mt-5 w-full py-2.5 rounded-xl bg-warm-500 text-white font-medium hover:bg-warm-600 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      <RecordEditModal
        open={editModal.open}
        onClose={() => setEditModal({ ...editModal, open: false })}
        mode={editModal.mode}
        initialData={
          editModal.record
            ? {
                id: editModal.record.id,
                babyId: editModal.record.babyId,
                date: editModal.record.date,
                temperature: editModal.record.temperature,
                oralCheck: editModal.record.oralCheck,
                handCheck: editModal.record.handCheck,
                skinCheck: editModal.record.skinCheck,
                remark: editModal.record.remark,
              }
            : { babyId: id }
        }
        onSuccess={() => loadData()}
      />

      <AuditDrawer
        open={auditDrawer.open}
        onClose={() => setAuditDrawer({ ...auditDrawer, open: false })}
        recordId={auditDrawer.recordId}
        recordTitle={auditDrawer.title}
      />
    </AppLayout>
  );
}
