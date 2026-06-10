import React from 'react';
import { FileCheck, Clock, AlertTriangle, XCircle, CheckCircle, FileText } from 'lucide-react';
import { useAcceptanceStore } from '@/store/acceptanceStore';
import type { AcceptanceStatus } from '@/types';

export const StatsPanel: React.FC = () => {
  const records = useAcceptanceStore((state) => state.records);
  const getFilteredRecords = useAcceptanceStore((state) => state.getFilteredRecords);

  const statusCounts = records.reduce((acc, record) => {
    acc[record.status] = (acc[record.status] || 0) + 1;
    return acc;
  }, {} as Record<AcceptanceStatus, number>);

  const stats = [
    { status: 'DRAFT' as const, label: '草稿', icon: FileText, color: 'bg-gray-100 text-gray-700' },
    { status: 'SUBMITTED' as const, label: '待审核', icon: Clock, color: 'bg-blue-100 text-blue-700' },
    { status: 'PENDING_EVIDENCE' as const, label: '待补证', icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-700' },
    { status: 'REJECTED' as const, label: '已退回', icon: XCircle, color: 'bg-red-100 text-red-700' },
    { status: 'ARCHIVABLE' as const, label: '可归档', icon: CheckCircle, color: 'bg-green-100 text-green-700' }
  ];

  const filteredCount = getFilteredRecords().length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-concealed-orange" />
          统计概览
        </h3>
        <span className="text-sm text-gray-500">
          共 {records.length} 条记录
        </span>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {stats.map(({ status, label, icon: Icon, color }) => (
          <div
            key={status}
            className={`p-3 rounded-lg text-center ${color}`}
          >
            <Icon className="w-6 h-6 mx-auto mb-1" />
            <p className="text-2xl font-bold">
              {statusCounts[status] || 0}
            </p>
            <p className="text-xs">{label}</p>
          </div>
        ))}
      </div>

      {filteredCount !== records.length && (
        <div className="mt-4 pt-3 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">
            当前筛选：<span className="font-semibold text-concealed-orange">{filteredCount}</span> 条
          </p>
        </div>
      )}
    </div>
  );
};
