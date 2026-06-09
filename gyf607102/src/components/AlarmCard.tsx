import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Eye,
  ArrowLeftRight,
  FileWarning,
  User,
  UserCheck
} from 'lucide-react';
import type { FuseAlarm } from '@/types';
import { useAlarmStore } from '@/store/useAlarmStore';
import { formatDateTime, getStatusText, getProcessStatusText } from '@/utils/export';
import { cn } from '@/lib/utils';
import { PhotoGallery } from './PhotoGallery';
import { HistoryTimeline } from './HistoryTimeline';

interface AlarmCardProps {
  alarm: FuseAlarm;
}

const statusColorMap: Record<string, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  normal: {
    bg: 'bg-emerald-50',
    border: 'border-l-emerald-500',
    text: 'text-emerald-700',
    icon: <CheckCircle className="h-4 w-4" />
  },
  abnormal: {
    bg: 'bg-red-50',
    border: 'border-l-red-500',
    text: 'text-red-700',
    icon: <AlertTriangle className="h-4 w-4" />
  },
  pending: {
    bg: 'bg-amber-50',
    border: 'border-l-amber-500',
    text: 'text-amber-700',
    icon: <Clock className="h-4 w-4" />
  },
  resolved: {
    bg: 'bg-blue-50',
    border: 'border-l-blue-500',
    text: 'text-blue-700',
    icon: <CheckCircle className="h-4 w-4" />
  }
};

const processColorMap: Record<string, string> = {
  received: 'bg-gray-100 text-gray-700',
  processing: 'bg-blue-100 text-blue-700',
  pending_review: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  withdrawn: 'bg-red-100 text-red-700'
};

export const AlarmCard = ({ alarm }: AlarmCardProps) => {
  const { expandedCardId, toggleCardExpand, setSelectedAlarm, setShowPhotoCompare, updateProcessedValue } = useAlarmStore();
  const [editValue, setEditValue] = useState(alarm.processedValue);
  const [showWarning, setShowWarning] = useState(false);

  const isExpanded = expandedCardId === alarm.id;
  const statusStyle = statusColorMap[alarm.status] || statusColorMap.pending;

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
    if (alarm.attachmentLost) {
      setShowWarning(true);
    }
  };

  const handleSaveValue = () => {
    updateProcessedValue(alarm.id, editValue);
    setShowWarning(false);
  };

  const handleYeMasterCompare = () => {
    if (alarm.isYeMasterSample && alarm.inspectionPhotos[0] && alarm.manualPhotos[0]) {
      setShowPhotoCompare(true, {
        before: alarm.inspectionPhotos[0].id,
        after: alarm.manualPhotos[0].id
      });
    }
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md',
        statusStyle.border,
        isExpanded && 'shadow-lg'
      )}
    >
      {alarm.isYeMasterSample && (
        <div className="absolute right-0 top-0 rounded-bl-lg bg-purple-600 px-3 py-1 text-xs font-medium text-white">
          叶师傅补录样例
        </div>
      )}
      {alarm.isManualSample && (
        <div className="absolute right-0 top-0 rounded-bl-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white">
          人工补录样例
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <code className="rounded bg-gray-100 px-2 py-0.5 font-mono text-sm font-semibold text-gray-800">
                {alarm.fuseNo}
              </code>
              <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', processColorMap[alarm.processStatus])}>
                {getProcessStatusText(alarm.processStatus)}
              </span>
              <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', statusStyle.bg, statusStyle.text)}>
                {statusStyle.icon}
                {getStatusText(alarm.status)}
              </span>
              {alarm.attachmentLost && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  <FileWarning className="h-3 w-3" />
                  附件丢失
                </span>
              )}
            </div>

            <h3 className="mt-2 font-medium text-gray-900">{alarm.deviceLocation}</h3>
            <p className="mt-1 text-sm text-gray-600 line-clamp-1">{alarm.emailSubject}</p>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {alarm.customerEmail}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDateTime(alarm.receivedAt)}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {alarm.operator}
              </span>
              {alarm.supervisor && (
                <span className="flex items-center gap-1">
                  <UserCheck className="h-3 w-3" />
                  {alarm.supervisor}
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">检测值（原始）</p>
                <p className={cn(
                  'font-mono text-sm font-semibold',
                  alarm.status === 'abnormal' ? 'text-red-600 line-through' : 'text-gray-700'
                )}>
                  {alarm.originalValue || '-'}
                </p>
              </div>
              {alarm.processedValue && alarm.originalValue !== alarm.processedValue && (
                <div className="rounded-lg bg-emerald-50 px-3 py-2">
                  <p className="text-xs text-emerald-600">检测值（处理后）</p>
                  <p className="font-mono text-sm font-semibold text-emerald-700">{alarm.processedValue}</p>
                </div>
              )}
              <div className="rounded-lg bg-blue-50 px-3 py-2">
                <p className="text-xs text-blue-600">当前结论</p>
                <p className="text-sm font-medium text-blue-700">{alarm.currentConclusion || '-'}</p>
              </div>
            </div>

            {alarm.attachmentLost && (
              <div className="mt-3">
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-800">附件丢失警告</p>
                      <p className="mt-1 text-xs text-amber-700">
                        该记录的邮件附件已丢失，但您仍可提交处理结果。已填写的内容不会被清空。
                      </p>
                      <div className="mt-2 flex gap-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={handleValueChange}
                          placeholder="输入处理后的值..."
                          className="flex-1 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm focus:border-amber-500 focus:outline-none"
                        />
                        <button
                          onClick={handleSaveValue}
                          className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
                        >
                          保存
                        </button>
                      </div>
                      {showWarning && (
                        <p className="mt-2 text-xs text-amber-600">
                          ⚠️ 附件已丢失，提交时请注意核对信息。您的输入已自动保存，不会丢失。
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <button
              onClick={() => setSelectedAlarm(alarm.id)}
              className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:border-blue-500 hover:text-blue-600"
            >
              <Eye className="h-4 w-4" />
              详情
            </button>
            {alarm.isYeMasterSample && alarm.manualPhotos.length > 0 && (
              <button
                onClick={handleYeMasterCompare}
                className="flex items-center gap-1 rounded-md border border-purple-300 bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-100"
              >
                <ArrowLeftRight className="h-4 w-4" />
                查看差异
              </button>
            )}
          </div>
        </div>

        <button
          onClick={() => toggleCardExpand(alarm.id)}
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-md border border-gray-200 bg-gray-50 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              收起详情
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              展开查看照片和历史
            </>
          )}
        </button>
      </div>

      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-in-out',
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="border-t border-gray-200 bg-gray-50/50 p-4">
          <div className="space-y-6">
            <PhotoGallery
              photos={alarm.inspectionPhotos}
              title="原始抽检照片"
              showManualBadge={false}
            />

            {alarm.manualPhotos.length > 0 && (
              <PhotoGallery
                photos={alarm.manualPhotos}
                title="手工补录照片"
                showManualBadge={true}
              />
            )}

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h4 className="mb-2 text-sm font-semibold text-gray-700">邮件信息</h4>
              <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-gray-500">发件人</dt>
                  <dd className="font-medium text-gray-800">{alarm.customerEmail}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">接收时间</dt>
                  <dd className="font-medium text-gray-800">{formatDateTime(alarm.receivedAt)}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-gray-500">邮件主题</dt>
                  <dd className="font-medium text-gray-800">{alarm.emailSubject}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">附件状态</dt>
                  <dd className={cn(
                    'font-medium',
                    alarm.hasAttachment ? 'text-emerald-600' : 'text-red-600'
                  )}>
                    {alarm.hasAttachment ? '正常' : alarm.attachmentLost ? '已丢失' : '无附件'}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">记录ID</dt>
                  <dd className="font-mono text-xs text-gray-800">{alarm.id}</dd>
                </div>
              </dl>
            </div>

            {alarm.supervisorNote && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <h4 className="mb-1 text-sm font-semibold text-amber-800">主管备注</h4>
                <p className="text-sm text-amber-700 whitespace-pre-wrap">{alarm.supervisorNote}</p>
              </div>
            )}

            {alarm.currentReason && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h4 className="mb-1 text-sm font-semibold text-blue-800">当前理由</h4>
                <p className="text-sm text-blue-700">{alarm.currentReason}</p>
              </div>
            )}

            <HistoryTimeline history={alarm.history} />
          </div>
        </div>
      </div>
    </div>
  );
};
