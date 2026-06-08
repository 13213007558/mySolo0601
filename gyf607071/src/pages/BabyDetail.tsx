import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Thermometer,
  FileText,
  ArrowRightLeft,
  Plus,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  Ban,
  AlertTriangle,
  Eye,
  EyeOff,
  X,
  ShieldAlert,
  History,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useStore } from '@/store/useStore';

export default function BabyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useStore((s) => s.currentUser);
  const babies = useStore((s) => s.babies);
  const getTemperatureByBaby = useStore((s) => s.getTemperatureByBaby);
  const getLeaveByBaby = useStore((s) => s.getLeaveByBaby);
  const canViewFullDetail = useStore((s) => s.canViewFullDetail(id || ''));
  const canViewPhoto = useStore((s) => s.canViewPhoto(id || ''));
  const canViewDetail = useStore((s) => s.canViewDetail(id || ''));
  const canSupplement = useStore((s) => s.canSupplement());
  const addSupplementRecord = useStore((s) => s.addSupplementRecord);
  const addAuditLog = useStore((s) => s.addAuditLog);

  const [showSupplementModal, setShowSupplementModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [supplementField, setSupplementField] = useState('体温记录');
  const [supplementValue, setSupplementValue] = useState('');
  const [supplementReason, setSupplementReason] = useState('');

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  const baby = babies.find((b) => b.id === id);
  if (!baby) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-gray-800 mb-2">
            未找到宝宝信息
          </h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-6 px-6 py-2 rounded-xl bg-medical-500 text-white hover:bg-medical-600 transition-colors"
          >
            返回排程板
          </button>
        </div>
      </div>
    );
  }

  const temperatures = getTemperatureByBaby(baby.id);
  const leaveRecord = getLeaveByBaby(baby.id);

  const dataQualityConfig = {
    normal: {
      icon: CheckCircle,
      label: '数据正常',
      color: 'text-emerald-500 bg-emerald-50',
    },
    empty: {
      icon: Ban,
      label: '数据缺失',
      color: 'text-gray-500 bg-gray-100',
    },
    dirty: {
      icon: AlertTriangle,
      label: '数据异常',
      color: 'text-amber-500 bg-amber-50',
    },
  };

  const DataQualityIcon = dataQualityConfig[baby.dataQuality].icon;

  const handleSupplement = () => {
    if (!supplementValue.trim() || !supplementReason.trim()) return;

    addSupplementRecord({
      babyId: baby.id,
      field: supplementField,
      beforeValue: baby.temperatureSummary || '未记录',
      afterValue: supplementValue,
      operator: currentUser.name,
      operatorRole: currentUser.role,
      time: new Date().toISOString().slice(0, 16).replace('T', ' '),
      reason: supplementReason,
    });

    addAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'supplement',
      targetId: baby.id,
      targetName: baby.name,
      time: new Date().toISOString().slice(0, 16).replace('T', ' '),
      result: 'success',
      detail: `手工补录${supplementField}：${baby.temperatureSummary || '未记录'} → ${supplementValue}`,
    });

    setShowSupplementModal(false);
    setSupplementValue('');
    setSupplementReason('');
  };

  const handleViewPhoto = () => {
    if (!canViewPhoto) {
      addAuditLog({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'view_photo',
        targetId: baby.id,
        targetName: baby.name,
        time: new Date().toISOString().slice(0, 16).replace('T', ' '),
        result: 'denied',
        detail: `无权查看 ${baby.name} 的请假条照片`,
      });
      return;
    }
    addAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'view_photo',
      targetId: baby.id,
      targetName: baby.name,
      time: new Date().toISOString().slice(0, 16).replace('T', ' '),
      result: 'success',
    });
    setShowPhotoModal(true);
  };

  const isElderPartialView = currentUser.role === 'elder' && !canViewFullDetail;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-medical-50/30">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-medical-600 mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          返回排程板
        </button>

        {isElderPartialView && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 animate-fade-in">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                您当前为老人角色，仅可查看摘要信息
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                如需查看完整详情，请联系宝宝父母或使用父母账号登录
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-6 animate-slide-up">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-medical-100 to-medical-200 flex items-center justify-center text-3xl font-bold text-medical-700 shadow-inner">
                {baby.name.charAt(0)}
              </div>
              <div>
                <h1 className="font-serif text-3xl font-bold text-gray-900 mb-1">
                  {baby.name}
                </h1>
                <p className="text-gray-500 mb-2">{baby.className}</p>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${dataQualityConfig[baby.dataQuality].color}`}>
                  <DataQualityIcon className="w-3.5 h-3.5" />
                  {dataQualityConfig[baby.dataQuality].label}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-gray-500">晨检状态</p>
                <p className="font-serif text-2xl font-bold text-gray-800">
                  {baby.temperatureSummary || '—'}
                </p>
              </div>
              {canSupplement && (
                <button
                  onClick={() => setShowSupplementModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-medical-500 text-white hover:bg-medical-600 transition-colors shadow-sm text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  手工补录
                </button>
              )}
            </div>
          </div>
        </div>

        {!canViewFullDetail && !isElderPartialView && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 animate-fade-in">
            <EyeOff className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">
                您无权查看此宝宝的完整详情
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                此操作已记录到审计日志中
              </p>
            </div>
          </div>
        )}

        {canViewFullDetail && (
          <>
            {baby.crossClassInfo && (
              <div className="mb-6 bg-violet-50 border border-violet-200 rounded-2xl p-6 animate-slide-up">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <ArrowRightLeft className="w-6 h-6 text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-serif text-lg font-bold text-violet-900">
                        跨班记录
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        baby.crossClassInfo.status === 'partial_success'
                          ? 'bg-amber-100 text-amber-700'
                          : baby.crossClassInfo.status === 'success'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {baby.crossClassInfo.status === 'partial_success'
                          ? '部分成功'
                          : baby.crossClassInfo.status === 'success'
                          ? '成功'
                          : '失败'}
                      </span>
                    </div>
                    <p className="text-violet-700 mb-1">
                      {baby.crossClassInfo.fromClass} → {baby.crossClassInfo.toClass}
                    </p>
                    {baby.crossClassInfo.message && (
                      <p className="text-sm text-violet-600">
                        {baby.crossClassInfo.message}
                      </p>
                    )}
                    <p className="text-xs text-violet-500 mt-2 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {baby.crossClassInfo.transferTime}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-slide-up">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-medical-50 flex items-center justify-center">
                    <Thermometer className="w-5 h-5 text-medical-600" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-gray-900">
                      体温枪原始记录
                    </h3>
                    <p className="text-xs text-gray-500">来自体温设备的原始数据</p>
                  </div>
                </div>

                {temperatures.length > 0 ? (
                  <div className="space-y-3">
                    {temperatures.map((temp, idx) => (
                      <div
                        key={temp.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
                              temp.value >= 37.5
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {temp.value.toFixed(1)}°
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {temp.value.toFixed(1)}°C
                              {temp.value >= 37.5 && (
                                <span className="ml-2 text-xs text-amber-600">偏高</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-1.5">
                              <Clock className="w-3 h-3" />
                              {temp.time}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">来源</p>
                          <p className="text-sm text-gray-700">
                            {temp.source === 'thermometer'
                              ? `体温枪 ${temp.deviceId || ''}`
                              : temp.source === 'manual'
                              ? '手工录入'
                              : '未知来源'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <Ban className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-500 text-sm">暂无体温记录</p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-slide-up">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-baby-50 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-baby-600" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-gray-900">
                      请假条
                    </h3>
                    <p className="text-xs text-gray-500">家长提交的请假申请</p>
                  </div>
                </div>

                {leaveRecord ? (
                  <div>
                    <div
                      onClick={handleViewPhoto}
                      className={`relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-dashed ${
                        canViewPhoto
                          ? 'border-medical-200 cursor-pointer hover:border-medical-400 group'
                          : 'border-gray-200'
                      } transition-colors mb-4`}
                    >
                      {canViewPhoto ? (
                        <>
                          <img
                            src={leaveRecord.photoUrl}
                            alt="请假条"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-white bg-black/50 px-4 py-2 rounded-full">
                              <Eye className="w-4 h-4" />
                              查看原图
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
                          <EyeOff className="w-10 h-10 text-gray-300 mb-2" />
                          <p className="text-sm text-gray-500">无权查看请假条照片</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">请假原因</span>
                        <span className="font-medium text-gray-800">
                          {leaveRecord.reason}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">请假日期</span>
                        <span className="font-medium text-gray-800">
                          {leaveRecord.date}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          提交人
                        </span>
                        <span className="font-medium text-gray-800">
                          {leaveRecord.submitter}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          提交时间
                        </span>
                        <span className="font-medium text-gray-800">
                          {leaveRecord.submitTime}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-500 text-sm">今日无请假记录</p>
                  </div>
                )}
              </div>
            </div>

            {baby.supplementRecords && baby.supplementRecords.length > 0 && (
              <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-slide-up">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                    <History className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-gray-900">
                      手工补录记录
                    </h3>
                    <p className="text-xs text-gray-500">补录前后数据对比</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {baby.supplementRecords.map((record, idx) => (
                    <div
                      key={record.id}
                      className="border border-gray-200 rounded-2xl p-5"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className="flex flex-wrap items-center gap-4 mb-4">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                          {record.field}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          {record.operator}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {record.time}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex-1 p-3 rounded-xl bg-gray-50">
                          <p className="text-xs text-gray-500 mb-1">补录前</p>
                          <p className="font-medium text-gray-700 line-through opacity-60">
                            {record.beforeValue}
                          </p>
                        </div>
                        <ArrowRightLeft className="w-5 h-5 text-medical-500 flex-shrink-0" />
                        <div className="flex-1 p-3 rounded-xl bg-emerald-50">
                          <p className="text-xs text-emerald-600 mb-1">补录后</p>
                          <p className="font-medium text-emerald-700">
                            {record.afterValue}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-2">
                        <span className="font-medium text-gray-600">补录原因：</span>
                        {record.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {!canViewFullDetail && isElderPartialView && canViewDetail && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-serif text-lg font-bold text-gray-900 mb-4">
                晨检摘要
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <span className="text-gray-600">体温状态</span>
                  <span className="font-bold text-gray-800">
                    {baby.temperatureSummary || '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <span className="text-gray-600">出勤状态</span>
                  <span className="font-bold text-gray-800">
                    {baby.status === 'absent' ? '请假' : '已入园'}
                  </span>
                </div>
                {baby.checkInTime && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                    <span className="text-gray-600">入园时间</span>
                    <span className="font-bold text-gray-800">{baby.checkInTime}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showSupplementModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="font-serif text-xl font-bold text-gray-900">
                手工补录数据
              </h3>
              <button
                onClick={() => setShowSupplementModal(false)}
                className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  补录字段
                </label>
                <select
                  value={supplementField}
                  onChange={(e) => setSupplementField(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-medical-300 focus:border-medical-400"
                >
                  <option value="体温记录">体温记录</option>
                  <option value="入园时间">入园时间</option>
                  <option value="晨检状态">晨检状态</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  补录值
                </label>
                <input
                  type="text"
                  placeholder="例如：36.5°C"
                  value={supplementValue}
                  onChange={(e) => setSupplementValue(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-medical-300 focus:border-medical-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  补录原因
                </label>
                <textarea
                  placeholder="请填写补录原因，如体温枪蓝牙断连..."
                  value={supplementReason}
                  onChange={(e) => setSupplementReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-medical-300 focus:border-medical-400 resize-none"
                />
              </div>

              <div className="p-4 rounded-xl bg-amber-50 text-sm text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>补录操作将被记录到审计日志，主管可随时复查</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-6 border-t border-gray-100">
              <button
                onClick={() => setShowSupplementModal(false)}
                className="flex-1 px-5 py-3 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSupplement}
                disabled={!supplementValue.trim() || !supplementReason.trim()}
                className="flex-1 px-5 py-3 rounded-xl text-sm font-medium text-white bg-medical-500 hover:bg-medical-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认补录
              </button>
            </div>
          </div>
        </div>
      )}

      {showPhotoModal && leaveRecord && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowPhotoModal(false)}
        >
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowPhotoModal(false)}
              className="absolute -top-14 right-0 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <img
              src={leaveRecord.photoUrl}
              alt="请假条原图"
              className="w-full rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
