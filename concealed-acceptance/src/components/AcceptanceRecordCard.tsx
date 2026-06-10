import React, { useState } from 'react';
import {
  Building2,
  Calendar,
  MapPin,
  Wrench,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  XCircle,
  FileWarning,
  Eye
} from 'lucide-react';
import type { AcceptanceRecord } from '@/types';
import { ACCEPTANCE_STATUS_LABELS, USER_ROLE_LABELS } from '@/types';
import { StatusBadge } from './StatusBadge';
import { EvidenceList } from './EvidenceList';
import { formatDateChinese, formatDateTimeChinese } from '@/utils/date';
import { validateEvidence } from '@/utils/validator';
import { getAvailableTransitions, getStatusTransitionText } from '@/utils/statusFlow';
import { useAcceptanceStore } from '@/store/acceptanceStore';

interface AcceptanceRecordCardProps {
  record: AcceptanceRecord;
  onEdit?: (record: AcceptanceRecord) => void;
}

export const AcceptanceRecordCard: React.FC<AcceptanceRecordCardProps> = ({ record, onEdit }) => {
  const [expanded, setExpanded] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  const currentUser = useAcceptanceStore((state) => state.currentUser);
  const changeStatus = useAcceptanceStore((state) => state.changeStatus);
  const getRecordHistory = useAcceptanceStore((state) => state.getRecordHistory);
  const addError = useAcceptanceStore((state) => state.addError);

  const history = getRecordHistory(record.id);
  const evidenceErrors = validateEvidence(record.evidence);
  const missingEvidence = evidenceErrors.filter((e) => e.severity === 'warning');

  const availableTransitions = currentUser
    ? getAvailableTransitions(record.status, currentUser.role)
    : [];

  const handleStatusChange = (toStatus: string) => {
    if (toStatus === 'REJECTED' || toStatus === 'PENDING_EVIDENCE') {
      setPendingStatus(toStatus);
      setShowStatusModal(true);
      setRejectReason('');
    } else {
      const result = changeStatus(record.id, toStatus as any);
      if (!result.success && result.error) {
        addError(result.error);
      }
    }
  };

  const confirmStatusChange = () => {
    if (!pendingStatus) return;

    const reason = rejectReason.trim() || (pendingStatus === 'REJECTED' ? '退回整改' : '要求补证');
    const result = changeStatus(record.id, pendingStatus as any, reason);
    if (!result.success && result.error) {
      addError(result.error);
    }
    setShowStatusModal(false);
    setPendingStatus(null);
    setRejectReason('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ARCHIVABLE':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'PENDING_EVIDENCE':
        return <FileWarning className="w-5 h-5 text-yellow-600" />;
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'SUBMITTED':
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <Eye className="w-5 h-5 text-gray-500" />;
    }
  };

  const canEdit = currentUser?.role === 'PROJECT_MANAGER' && record.status === 'DRAFT';
  const canViewDetails = currentUser?.role !== 'DOCUMENT_CONTROLLER' || record.status === 'ARCHIVABLE';

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={record.status} />
              <span className="text-xs text-gray-500">#{record.id.slice(-6)}</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1 truncate">{record.projectName}</h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {record.axis} / {record.location}
              </span>
              <span className="flex items-center gap-1">
                <Wrench className="w-4 h-4" />
                {record.workType}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {missingEvidence.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 rounded text-xs">
                <AlertTriangle className="w-3.5 h-3.5" />
                缺{missingEvidence.length}项
              </div>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>验收: {formatDateChinese(record.acceptanceDate)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Building2 className="w-4 h-4" />
            <span>封模: {formatDateChinese(record.formworkDate)}</span>
          </div>
          <div className="text-sm text-gray-500 ml-auto">
            {record.createdBy} · {formatDateTimeChinese(record.createdAt)}
          </div>
        </div>

        {record.rejectReason && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">退回原因</p>
                <p className="text-sm text-red-700 mt-0.5">{record.rejectReason}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
          {canViewDetails ? (
            <>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">验收说明</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{record.description}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  证据材料 ({record.evidence.length})
                </h4>
                <EvidenceList evidence={record.evidence} canEdit={false} />
              </div>

              {history.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">状态变更历史</h4>
                  <div className="relative pl-6 space-y-3">
                    <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-200" />
                    {history.map((item) => (
                      <div key={item.id} className="relative">
                        <div className="absolute -left-6 w-4 h-4 rounded-full bg-white border-2 border-concealed-blue flex items-center justify-center">
                          {getStatusIcon(item.toStatus)}
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {item.fromStatus
                                ? `${ACCEPTANCE_STATUS_LABELS[item.fromStatus]} → `
                                : ''}
                              {ACCEPTANCE_STATUS_LABELS[item.toStatus]}
                            </span>
                            <span className="text-xs text-gray-500">
                              {item.fromStatus
                                ? getStatusTransitionText(item.fromStatus, item.toStatus)
                                : '创建记录'}
                            </span>
                          </div>
                          {item.reason && (
                            <p className="text-sm text-gray-600 mb-1">原因: {item.reason}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            {item.operator} ({USER_ROLE_LABELS[item.operatorRole]}) ·{' '}
                            {formatDateTimeChinese(item.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4 text-sm text-gray-500">
              资料员仅可查看已归档的记录详情
            </div>
          )}

          {availableTransitions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              {availableTransitions.map((status) => {
                const label = getStatusTransitionText(record.status, status);
                let btnClass = 'px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200';
                if (status === 'ARCHIVABLE') btnClass = 'px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-green-500 text-white hover:bg-green-600';
                if (status === 'REJECTED') btnClass = 'px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-red-500 text-white hover:bg-red-600';
                if (status === 'PENDING_EVIDENCE')
                  btnClass = 'px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-yellow-500 text-white hover:bg-yellow-600';
                if (status === 'SUBMITTED')
                  btnClass = 'px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-blue-500 text-white hover:bg-blue-600';

                return (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className={btnClass}
                  >
                    {label}
                  </button>
                );
              })}
              {canEdit && onEdit && (
                <button
                  onClick={() => onEdit(record)}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  编辑记录
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {pendingStatus === 'REJECTED' ? '退回整改' : '要求补证'}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {pendingStatus === 'REJECTED' ? '退回原因' : '补证要求'}
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-concealed-orange"
                rows={4}
                placeholder={
                  pendingStatus === 'REJECTED'
                    ? '请描述退回整改的原因...'
                    : '请描述需要补充的证据材料...'
                }
                autoFocus
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setPendingStatus(null);
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={confirmStatusChange}
                className={`px-4 py-2 rounded-lg text-sm font-medium text-white
                  ${pendingStatus === 'REJECTED' ? 'bg-red-500 hover:bg-red-600' : 'bg-yellow-500 hover:bg-yellow-600'}`}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
