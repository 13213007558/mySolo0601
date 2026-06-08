import React from 'react';
import { Clock, User, UserX } from 'lucide-react';
import { StatusChange, STATUS_LABELS } from '../../shared/types';

interface StatusTimelineProps {
  statusHistory: StatusChange[];
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ statusHistory }) => {
  if (!statusHistory || statusHistory.length === 0) {
    return (
      <div className="text-gray-500 text-sm py-4 text-center">
        暂无状态变更记录
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
      <div className="space-y-4">
        {statusHistory.map((change, index) => (
          <div key={change.id || index} className="relative pl-10">
            <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs">
                    {STATUS_LABELS[change.fromStatus]}
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    {STATUS_LABELS[change.toStatus]}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock size={12} />
                  {new Date(change.createdAt).toLocaleString('zh-CN')}
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-1">{change.reason}</p>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                {change.operatorName ? (
                  <>
                    <User size={12} />
                    <span>处理人：{change.operatorName}</span>
                  </>
                ) : (
                  <>
                    <UserX size={12} className="text-orange-500" />
                    <span className="text-orange-600">处理人信息缺失（请联系主管复查）</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatusTimeline;
