import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Save,
  Camera,
  Phone,
  MapPin,
  AlertTriangle,
  Clock,
  User,
  FileText,
  Tag,
} from 'lucide-react';
import { useAlarmStore } from '../stores/useAlarmStore';
import { StatusBadge } from '../components/StatusBadge';
import { LevelBadge } from '../components/LevelBadge';
import { StatusTimeline } from '../components/StatusTimeline';
import { DiffViewer } from '../components/DiffViewer';
import { formatDate } from '../utils/formatters';
import type { AlarmStatus } from '../types';
import { ALARM_STATUS_LABELS, DATA_SOURCE_LABELS } from '../types';
import { cn } from '../lib/utils';

export default function AlarmDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    getAlarmById,
    getStatusHistoryByAlarmId,
    getOperationHistoryByAlarmId,
    getManualEntryByAlarmId,
    updateAlarmStatus,
  } = useAlarmStore();

  const [isEditing, setIsEditing] = useState(false);
  const [newStatus, setNewStatus] = useState<AlarmStatus>('pending');
  const [reason, setReason] = useState('');
  const [operator, setOperator] = useState('');

  const alarm = getAlarmById(id || '');
  const statusHistory = alarm ? getStatusHistoryByAlarmId(alarm.id) : [];
  const operationHistory = alarm ? getOperationHistoryByAlarmId(alarm.id) : [];
  const manualEntry = alarm ? getManualEntryByAlarmId(alarm.id) : undefined;

  if (!alarm) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-slate-800">告警不存在</h2>
          <p className="text-slate-500 mt-2">未找到ID为 {id} 的告警记录</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4" />
            返回列表
          </Link>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    if (!newStatus || !reason || !operator) {
      alert('请填写完整的状态变更信息');
      return;
    }
    updateAlarmStatus(alarm.id, newStatus, reason, operator);
    setIsEditing(false);
    setReason('');
    setOperator('');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-slate-800 font-mono">
                    {alarm.alarmCode}
                  </h1>
                  <LevelBadge level={alarm.level} />
                  <StatusBadge status={alarm.status} />
                  {alarm.source === 'manual' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded border border-amber-200">
                      <Camera className="h-3 w-3" />
                      {DATA_SOURCE_LABELS[alarm.source]}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-1">{alarm.description}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setNewStatus(alarm.status);
                setIsEditing(!isEditing);
              }}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded transition-colors',
                isEditing
                  ? 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                  : 'text-white bg-blue-600 hover:bg-blue-700'
              )}
            >
              {isEditing ? (
                <>
                  取消修改
                </>
              ) : (
                <>
                  <Edit3 className="h-4 w-4" />
                  修改状态
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {isEditing && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-3">修改告警状态</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  新状态
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as AlarmStatus)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {(Object.keys(ALARM_STATUS_LABELS) as AlarmStatus[]).map((status) => (
                    <option key={status} value={status}>
                      {ALARM_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  <User className="inline h-3 w-3 mr-1" />
                  操作人
                </label>
                <input
                  type="text"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  placeholder="请输入操作人姓名"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleSave}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  确认修改
                </button>
              </div>
            </div>
            <div className="mt-4">
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                <FileText className="inline h-3 w-3 mr-1" />
                变更原因
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="请详细说明状态变更的原因..."
                rows={2}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                基本信息
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">站点名称</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <p className="text-sm font-medium text-slate-800">{alarm.siteName}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">设备名称</p>
                  <p className="text-sm font-medium text-slate-800 font-mono">{alarm.deviceName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">涉及金额</p>
                  <p className="text-lg font-bold text-slate-900 font-mono">
                    ¥{alarm.amountDisplay}
                  </p>
                  <p className="text-xs text-slate-400">精确值: ¥{alarm.amount.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">联系电话</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <p className="text-sm font-mono text-slate-800">{alarm.phoneMasked}</p>
                    {alarm.phone === alarm.phoneMasked && (
                      <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                        未脱敏
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">创建时间</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <p className="text-sm text-slate-700">{formatDate(alarm.createdAt)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">更新时间</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <p className="text-sm text-slate-700">{formatDate(alarm.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {manualEntry && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-amber-800 mb-4 flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  手工补录信息（{manualEntry.enteredBy}）
                </h3>
                <div className="space-y-4">
                  <div className="rounded-lg overflow-hidden border border-amber-200">
                    <img
                      src={manualEntry.photoUrl}
                      alt="BMS屏幕拍照"
                      className="w-full h-64 object-cover"
                    />
                  </div>
                  <p className="text-sm text-slate-700 bg-white p-3 rounded border border-amber-200">
                    <span className="text-slate-500">补录备注：</span>
                    {manualEntry.entryNote}
                  </p>
                  <DiffViewer diffData={manualEntry.diffData} title="补录前后差异对比" />
                </div>
              </div>
            )}

            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                操作历史
              </h3>
              <StatusTimeline
                statusHistories={statusHistory}
                operationHistories={operationHistory}
              />
            </div>
          </div>

          <div className="space-y-6">
            {alarm.bmsPhotoUrl && (
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">
                  BMS 屏幕拍照
                </h3>
                <div className="rounded-lg overflow-hidden">
                  <img
                    src={alarm.bmsPhotoUrl}
                    alt="BMS屏幕拍照"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            )}

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">
                数据一致性校验
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">金额精度</span>
                  {Math.abs(alarm.amount - parseFloat(alarm.amountDisplay)) < 0.001 ? (
                    <span className="text-emerald-600 text-xs">✓ 一致</span>
                  ) : (
                    <span className="text-amber-600 text-xs">⚠ 存在精度偏差</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">手机号脱敏</span>
                  {alarm.phoneMasked.includes('****') ? (
                    <span className="text-emerald-600 text-xs">✓ 已脱敏</span>
                  ) : (
                    <span className="text-red-600 text-xs">✗ 未脱敏</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">README一致性</span>
                  {alarm.id === 'alarm-readme-001' ? (
                    <span className="text-amber-600 text-xs">⚠ 存在不一致</span>
                  ) : (
                    <span className="text-emerald-600 text-xs">✓ 一致</span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
                原始数据（调试用）
              </h3>
              <pre className="text-xs text-slate-600 bg-white p-3 rounded border border-slate-200 overflow-auto max-h-48 font-mono">
                {JSON.stringify(alarm, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
