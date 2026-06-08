import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye, XCircle, RefreshCw, FileSpreadsheet, Thermometer, FileText, AlertTriangle, CheckCircle
} from 'lucide-react';
import { Modal, Input, message, Popconfirm } from 'antd';
import { CheckRecord, DataStatus, RecordStatus } from '../types';
import { useCheckStore } from '../store/useCheckStore';
import { StatusBadge, DataStatusBadge } from './StatusBadge';
import { validateCheckRecord } from '../services/dataValidationService';

interface RecordTableProps {
  filter?: DataStatus;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export const RecordTable: React.FC<RecordTableProps> = ({ filter }) => {
  const navigate = useNavigate();
  const {
    checkRecords,
    babies,
    temperatureRecords,
    leaveNotes,
    getTemperatureRecordById,
    getBabyById,
    getLeaveNoteById,
    rejectRecord,
    reissueRecord,
    rejectThenReissue,
    exportRecords
  } = useCheckStore();

  const [rejectModal, setRejectModal] = useState<{ open: boolean; recordId: string }>({
    open: false,
    recordId: ''
  });
  const [rejectReason, setRejectReason] = useState('');
  const [reissueModal, setReissueModal] = useState<{ open: boolean; recordId: string }>({
    open: false,
    recordId: ''
  });
  const [reissueReason, setReissueReason] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredRecords = filter
    ? checkRecords.filter(r => r.dataStatus === filter)
    : checkRecords;

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      message.warning('请填写拒绝原因');
      return;
    }
    setLoading(true);
    try {
      await rejectRecord(rejectModal.recordId, rejectReason);
      message.success('记录已标记为拒绝');
      setRejectModal({ open: false, recordId: '' });
      setRejectReason('');
    } catch (error) {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReissue = async () => {
    if (!reissueReason.trim()) {
      message.warning('请填写补发原因');
      return;
    }
    setLoading(true);
    try {
      await reissueRecord(reissueModal.recordId, reissueReason);
      message.success('记录已标记为已补发');
      setReissueModal({ open: false, recordId: '' });
      setReissueReason('');
    } catch (error) {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectThenReissue = async (recordId: string) => {
    setLoading(true);
    try {
      await rejectThenReissue(
        recordId,
        '体温异常，未收到家长反馈',
        '家长已提供医院证明，体温正常，补发餐食'
      );
      message.success('已完成拒绝→已补发流程');
    } catch (error) {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (recordId: string) => {
    try {
      await exportRecords([recordId]);
      message.success('导出成功，Excel文件已下载');
    } catch (error) {
      message.error('导出失败');
    }
  };

  const getRowBgColor = (record: CheckRecord): string => {
    if (record.dataStatus === DataStatus.DIRTY) return 'bg-amber-50/50';
    if (record.dataStatus === DataStatus.EMPTY) return 'bg-red-50/50';
    return '';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
              <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                宝宝信息
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                体温/请假
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                数据状态
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                处理状态
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                备注
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                操作人
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                更新时间
              </th>
              <th className="px-4 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center text-slate-400">
                    {filter === DataStatus.EMPTY ? (
                      <>
                        <CheckCircle className="w-12 h-12 mb-3 text-emerald-400" />
                        <p className="text-lg font-medium">暂无空数据</p>
                        <p className="text-sm">所有记录数据完整</p>
                      </>
                    ) : filter === DataStatus.DIRTY ? (
                      <>
                        <CheckCircle className="w-12 h-12 mb-3 text-emerald-400" />
                        <p className="text-lg font-medium">暂无脏数据</p>
                        <p className="text-sm">所有记录校验通过</p>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-12 h-12 mb-3" />
                        <p className="text-lg font-medium">暂无记录</p>
                        <p className="text-sm">请稍后查看</p>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredRecords.map((record, index) => {
                const baby = getBabyById(record.babyId);
                const tempRecord = record.temperatureRecordId
                  ? getTemperatureRecordById(record.temperatureRecordId)
                  : undefined;
                const leaveNote = record.leaveNoteId
                  ? getLeaveNoteById(record.leaveNoteId)
                  : undefined;
                const validation = validateCheckRecord(record, tempRecord);

                return (
                  <tr
                    key={record.id}
                    className={`${getRowBgColor(record)} hover:bg-slate-50 transition-colors duration-150`}
                    style={{
                      animation: `fadeIn 0.3s ease-out ${index * 0.05}s both`
                    }}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={baby?.avatar}
                          alt={baby?.name}
                          className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200"
                        />
                        <div>
                          <p className="font-semibold text-slate-800">{baby?.name}</p>
                          <p className="text-xs text-slate-500">
                            {baby?.className} · {baby?.age}岁
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      {tempRecord ? (
                        <div className="flex items-center gap-2">
                          <Thermometer className="w-4 h-4 text-rose-500" />
                          <span className={`font-semibold ${
                            tempRecord.temperature >= 37.5 ? 'text-red-600' : 'text-slate-700'
                          }`}>
                            {tempRecord.temperature}℃
                          </span>
                          {tempRecord.isDirty && (
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          )}
                        </div>
                      ) : leaveNote ? (
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-500" />
                          <span className="text-sm text-slate-600">已请假</span>
                        </div>
                      ) : (
                        <span className="text-xs text-red-500 font-medium">无记录</span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <DataStatusBadge status={record.dataStatus} />
                        {validation.issues.length > 0 && (
                          <p className="text-xs text-amber-600">
                            {validation.issues[0]}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={record.status} />
                      {record.isManual && (
                        <p className="text-xs text-purple-600 mt-1">含手工补录</p>
                      )}
                    </td>

                    <td className="px-4 py-4 max-w-xs">
                      <p className="text-sm text-slate-700 line-clamp-2">
                        {record.currentRemark}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <span className="text-sm text-slate-600">{record.operator}</span>
                    </td>

                    <td className="px-4 py-4">
                      <span className="text-sm text-slate-500">
                        {formatDate(record.updatedAt)}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => navigate(`/baby/${record.babyId}`)}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {record.status === RecordStatus.PENDING && (
                          <>
                            <button
                              onClick={() => setRejectModal({ open: true, recordId: record.id })}
                              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                              title="拒绝"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setReissueModal({ open: true, recordId: record.id })}
                              className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                              title="补发"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {record.status === RecordStatus.REJECTED && (
                          <button
                            onClick={() => setReissueModal({ open: true, recordId: record.id })}
                            className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                            title="改为补发"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}

                        <Popconfirm
                          title="模拟拒绝→补发流程"
                          description="将自动执行先拒绝后补发的完整流程，用于演示状态变化痕迹"
                          onConfirm={() => handleRejectThenReissue(record.id)}
                          okText="确认执行"
                          cancelText="取消"
                        >
                          <button
                            className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
                            title="模拟完整流程"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </Popconfirm>

                        <button
                          onClick={() => handleExport(record.id)}
                          className="p-2 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all duration-200"
                          title="导出此记录"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Modal
        title="标记为拒绝"
        open={rejectModal.open}
        onOk={handleReject}
        onCancel={() => {
          setRejectModal({ open: false, recordId: '' });
          setRejectReason('');
        }}
        confirmLoading={loading}
        okText="确认拒绝"
        cancelText="取消"
      >
        <p className="mb-4 text-slate-600">请填写拒绝原因：</p>
        <Input.TextArea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="例如：体温异常，未收到家长反馈"
          rows={4}
        />
      </Modal>

      <Modal
        title="标记为已补发"
        open={reissueModal.open}
        onOk={handleReissue}
        onCancel={() => {
          setReissueModal({ open: false, recordId: '' });
          setReissueReason('');
        }}
        confirmLoading={loading}
        okText="确认补发"
        cancelText="取消"
      >
        <p className="mb-4 text-slate-600">请填写补发原因：</p>
        <Input.TextArea
          value={reissueReason}
          onChange={(e) => setReissueReason(e.target.value)}
          placeholder="例如：家长已提供医院证明，体温正常，补发餐食"
          rows={4}
        />
      </Modal>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
