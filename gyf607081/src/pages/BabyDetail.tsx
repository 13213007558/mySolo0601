import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Thermometer, FileText, Clock, User, Phone, GraduationCap,
  ChevronLeft, ChevronRight, ZoomIn, AlertTriangle, CheckCircle, XCircle
} from 'lucide-react';
import { Tabs, Modal, Button } from 'antd';
import { useCheckStore } from '../store/useCheckStore';
import { getAuditLogsByRecordId, restoreFromAudit } from '../services/auditService';
import { getStatusChangesByRecordId } from '../services/exportService';
import { StatusBadge, DataStatusBadge } from '../components/StatusBadge';
import { AuditTimeline } from '../components/AuditTimeline';
import { validateCheckRecord } from '../services/dataValidationService';
import { RecordStatus, DataStatus } from '../types';

const BabyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    getBabyById,
    getTemperatureRecordById,
    getLeaveNoteById,
    checkRecords,
    currentOperator
  } = useCheckStore();

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const baby = id ? getBabyById(id) : undefined;
  const babyRecords = checkRecords.filter(r => r.babyId === id);
  const auditLogs = babyRecords.flatMap(r => getAuditLogsByRecordId(r.id));
  const statusChanges = babyRecords.flatMap(r => getStatusChangesByRecordId(r.id));

  const [restoreModal, setRestoreModal] = useState<{ open: boolean; recordId: string }>({
    open: false,
    recordId: ''
  });

  const handleRestore = async () => {
    const restored = await restoreFromAudit(restoreModal.recordId);
    if (restored) {
      setRestoreModal({ open: false, recordId: '' });
    }
  };

  if (!baby) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-slate-400">
        <XCircle className="w-16 h-16 mb-4" />
        <p className="text-lg">未找到宝宝信息</p>
        <Button
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate('/')}
          className="mt-4"
        >
          返回列表
        </Button>
      </div>
    );
  }

  const ImageGallery: React.FC<{ images: string[]; title: string }> = ({ images, title }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (images.length === 0) return null;

    return (
      <div className="space-y-3">
        <h4 className="font-semibold text-slate-700">{title}</h4>
        <div className="relative group">
          <div className="aspect-video rounded-xl overflow-hidden bg-slate-100">
            <img
              src={images[currentIndex]}
              alt={title}
              className="w-full h-full object-cover cursor-pointer transition-transform duration-300 hover:scale-105"
              onClick={() => setPreviewImage(images[currentIndex])}
            />
          </div>
          {images.length > 1 && (
            <>
              <button
                onClick={() => setCurrentIndex(i => (i - 1 + images.length) % images.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentIndex(i => (i + 1) % images.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentIndex ? 'bg-white w-4' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
          <button
            onClick={() => setPreviewImage(images[currentIndex])}
            className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const tabItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6" style={{ fontFamily: '"Noto Serif SC", serif' }}>
              宝宝信息
            </h3>

            <div className="flex items-start gap-6 mb-6">
              <img
                src={baby.avatar}
                alt={baby.name}
                className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 shadow-lg"
              />
              <div className="flex-1">
                <h4 className="text-2xl font-bold text-slate-800 mb-2">{baby.name}</h4>
                <div className="flex flex-wrap gap-2 mb-3">
                  <StatusBadge status={babyRecords[0]?.status || RecordStatus.PENDING} />
                  <DataStatusBadge status={babyRecords[0]?.dataStatus || DataStatus.NORMAL} />
                  {babyRecords.some(r => r.isManual) && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                      含手工补录
                    </span>
                  )}
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-slate-400" />
                    <span>{baby.className} · {baby.age}岁</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>监护人：{baby.guardian}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{baby.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            {babyRecords.some(r => r.manualAddInfo) && (
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                <h5 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  手工补录信息
                </h5>
                {babyRecords.filter(r => r.manualAddInfo).map(record => (
                  <div key={record.id} className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-xs text-slate-500 mb-1">补录前</p>
                      <pre className="text-xs text-slate-600 whitespace-pre-wrap">
                        {JSON.stringify(record.manualAddInfo!.beforeData, null, 2)}
                      </pre>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <p className="text-xs text-emerald-600 font-medium mb-1">补录后</p>
                      <pre className="text-xs text-emerald-800 whitespace-pre-wrap">
                        {JSON.stringify(record.manualAddInfo!.afterData, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
                <div className="mt-3 text-xs text-purple-600">
                  补录时间：{new Date(babyRecords[0].manualAddInfo!.addTime).toLocaleString('zh-CN')}
                  <br />
                  操作人：{babyRecords[0].manualAddInfo!.operator}
                  <br />
                  原因：{babyRecords[0].manualAddInfo!.reason}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {babyRecords.map(record => {
              const tempRecord = record.temperatureRecordId
                ? getTemperatureRecordById(record.temperatureRecordId)
                : undefined;
              const leaveNote = record.leaveNoteId
                ? getLeaveNoteById(record.leaveNoteId)
                : undefined;
              const validation = validateCheckRecord(record, tempRecord);

              return (
                <div key={record.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-800">晨检记录</h4>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={record.status} />
                      <DataStatusBadge status={record.dataStatus} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {tempRecord && (
                      <div className="p-4 bg-gradient-to-br from-rose-50 to-orange-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-3">
                          <Thermometer className="w-5 h-5 text-rose-500" />
                          <span className="font-semibold text-slate-800">体温枪原始记录</span>
                          {tempRecord.isDirty && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                              脏数据
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-slate-500">体温</p>
                            <p className={`text-xl font-bold ${
                              tempRecord.temperature >= 37.5 ? 'text-red-600' : 'text-slate-800'
                            }`}>
                              {tempRecord.temperature}℃
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">测量时间</p>
                            <p className="text-sm text-slate-700">
                              {new Date(tempRecord.measureTime).toLocaleString('zh-CN')}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">测量设备</p>
                            <p className="text-sm text-slate-700">{tempRecord.measureDevice}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">操作人</p>
                            <p className="text-sm text-slate-700">{tempRecord.operator}</p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-xs text-slate-500 mb-1">备注</p>
                          <p className="text-sm text-slate-700">{tempRecord.remark || '（无备注）'}</p>
                        </div>

                        {tempRecord.dirtyReason && (
                          <div className="p-3 bg-amber-50 rounded-lg text-sm text-amber-700 border border-amber-200">
                            <AlertTriangle className="w-4 h-4 inline mr-1" />
                            {tempRecord.dirtyReason}
                          </div>
                        )}

                        {validation.issues.length > 0 && (
                          <div className="mt-3 p-3 bg-amber-50 rounded-lg">
                            <p className="text-xs text-amber-600 font-medium mb-1">数据问题：</p>
                            <ul className="text-xs text-amber-700 space-y-1">
                              {validation.issues.map((issue, idx) => (
                                <li key={idx}>• {issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {tempRecord.photoUrl && (
                          <div className="mt-4">
                            <ImageGallery images={[tempRecord.photoUrl]} title="体温枪记录照片" />
                          </div>
                        )}
                      </div>
                    )}

                    {leaveNote && (
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="w-5 h-5 text-blue-500" />
                          <span className="font-semibold text-slate-800">请假条</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-slate-500">请假日期</p>
                            <p className="text-sm text-slate-700">{leaveNote.leaveDate}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">提交人</p>
                            <p className="text-sm text-slate-700">{leaveNote.operator}</p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-xs text-slate-500 mb-1">请假原因</p>
                          <p className="text-sm text-slate-700">{leaveNote.reason}</p>
                        </div>

                        <ImageGallery images={leaveNote.photoUrls} title="请假条照片" />
                      </div>
                    )}

                    {!tempRecord && !leaveNote && (
                      <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                        <div className="flex items-center gap-2 text-red-700">
                          <XCircle className="w-5 h-5" />
                          <span className="font-medium">缺少体温记录和请假条</span>
                        </div>
                        <p className="text-sm text-red-600 mt-2">
                          此记录只有宝宝信息，没有体温枪记录或请假条，请尽快补录
                        </p>
                      </div>
                    )}

                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-xs text-slate-500 mb-1">当前处理备注</p>
                      <p className="text-sm text-slate-700">{record.currentRemark}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>更新于 {new Date(record.updatedAt).toLocaleString('zh-CN')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        <span>{record.operator}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )
    },
    {
      key: 'statusChanges',
      label: `状态变更痕迹 (${statusChanges.length})`,
      children: (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6" style={{ fontFamily: '"Noto Serif SC", serif' }}>
            导出中的状态变化痕迹
          </h3>

          {statusChanges.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>暂无状态变更记录</p>
            </div>
          ) : (
            <div className="space-y-4">
              {statusChanges.map((change, index) => (
                <div
                  key={index}
                  className="p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={change.oldStatus} />
                      <span className="text-slate-400">→</span>
                      <StatusBadge status={change.newStatus} />
                    </div>
                    <div className="text-xs text-slate-400">
                      {new Date(change.changeTime).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">{change.operator}</span>：{change.remark}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'audit',
      label: `审计日志 (${auditLogs.length})`,
      children: (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800" style={{ fontFamily: '"Noto Serif SC", serif' }}>
              审计记录
            </h3>
            {auditLogs.some(log => !log.success) && (
              <Button
                type="primary"
                danger
                onClick={() => setRestoreModal({ open: true, recordId: auditLogs.find(l => !l.success)?.recordId || '' })}
              >
                从审计恢复数据
              </Button>
            )}
          </div>
          <AuditTimeline logs={auditLogs} />
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回列表</span>
        </button>
        <div className="h-6 w-px bg-slate-200" />
        <div>
          <h2
            className="text-2xl font-bold text-slate-800"
            style={{ fontFamily: '"Noto Serif SC", serif' }}
          >
            宝宝详情 - {baby.name}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            财务反查：从导出表定位到宝宝，查看原始记录和审计痕迹
          </p>
        </div>
      </div>

      <Tabs
        defaultActiveKey="basic"
        items={tabItems}
        className="bg-transparent"
      />

      <Modal
        title="从审计恢复数据"
        open={restoreModal.open}
        onOk={handleRestore}
        onCancel={() => setRestoreModal({ open: false, recordId: '' })}
        okText="确认恢复"
        cancelText="取消"
      >
        <p className="text-slate-600">
          即使主数据丢失，审计快照中仍保留了数据记录。确认要从审计恢复此记录吗？
        </p>
      </Modal>

      <Modal
        title="图片预览"
        open={!!previewImage}
        onCancel={() => setPreviewImage(null)}
        footer={null}
        width="auto"
        centered
      >
        {previewImage && (
          <img
            src={previewImage}
            alt="预览"
            className="max-w-full max-h-[80vh] object-contain"
          />
        )}
      </Modal>
    </div>
  );
};

export default BabyDetail;
