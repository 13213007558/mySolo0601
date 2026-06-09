import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Wrench, XCircle, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useMeterStore } from '@/store/useMeterStore';
import { ProblemRecord, ERROR_TYPE_LABELS, STATUS_LABELS } from '@/types';
import { getErrorTypeColor } from '@/utils/validation';
import SupplementForm from './SupplementForm';

export default function ProblemRecordsList() {
  const problemRecords = useMeterStore((state) => state.problemRecords);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<ProblemRecord | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'resolved' | 'rejected'>('all');

  const filteredRecords = problemRecords.filter((r) => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  const pendingCount = problemRecords.filter((r) => r.status === 'pending').length;
  const resolvedCount = problemRecords.filter((r) => r.status === 'resolved').length;
  const rejectedCount = problemRecords.filter((r) => r.status === 'rejected').length;

  const getStatusColor = (status: ProblemRecord['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-status-warning/20 text-status-warning border-status-warning/30';
      case 'reviewing':
        return 'bg-primary-500/20 text-primary-400 border-primary-500/30';
      case 'resolved':
        return 'bg-status-success/20 text-status-success border-status-success/30';
      case 'rejected':
        return 'bg-status-danger/20 text-status-danger border-status-danger/30';
    }
  };

  const getStatusBarColor = (status: ProblemRecord['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-status-warning';
      case 'reviewing':
        return 'bg-primary-500';
      case 'resolved':
        return 'bg-status-success';
      case 'rejected':
        return 'bg-status-danger';
    }
  };

  return (
    <div className="card overflow-hidden">
      <div className="p-5 border-b border-industrial-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-status-warning animate-pulse" />
              问题记录
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              共 {problemRecords.length} 条问题记录需要处理
            </p>
          </div>

          <div className="flex items-center gap-2">
            {[
              { key: 'all', label: '全部', count: problemRecords.length },
              { key: 'pending', label: '待处理', count: pendingCount },
              { key: 'resolved', label: '已解决', count: resolvedCount },
              { key: 'rejected', label: '已驳回', count: rejectedCount },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterStatus(tab.key as typeof filterStatus)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  filterStatus === tab.key
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-industrial-hover'
                }`}
              >
                {tab.label}
                <span className="ml-1.5 opacity-70">({tab.count})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="divide-y divide-industrial-border/50 max-h-[600px] overflow-y-auto">
        {filteredRecords.length > 0 ? (
          filteredRecords.map((record) => (
            <div
              key={record.id}
              className="relative animate-fade-in"
            >
              <div className={`status-bar ${getStatusBarColor(record.status)}`} />

              <div className="pl-4">
                <div
                  className="p-4 cursor-pointer hover:bg-industrial-hover/50 transition-colors"
                  onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-primary-400 font-medium">
                          {record.meterNo}
                        </span>
                        <span className={`badge ${getErrorTypeColor(record.errorType)}`}>
                          <AlertTriangle className="w-3 h-3" />
                          {ERROR_TYPE_LABELS[record.errorType]}
                        </span>
                        <span className={`badge ${getStatusColor(record.status)}`}>
                          {record.status === 'pending' && <Clock className="w-3 h-3" />}
                          {record.status === 'resolved' && <Wrench className="w-3 h-3" />}
                          {record.status === 'rejected' && <XCircle className="w-3 h-3" />}
                          {STATUS_LABELS[record.status]}
                        </span>
                        {record.lateSupplementReason && (
                          <span className="badge bg-status-orange/20 text-status-orange border-status-orange/30">
                            补录晚到
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-300 mb-2">{record.errorMessage}</p>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>原始行号: {record.rowIndex}</span>
                        <span>原始读数: {record.reading}</span>
                        <span>
                          导入时间: {format(record.importedAt, 'MM-dd HH:mm', { locale: zhCN })}
                        </span>
                      </div>

                      {record.supplementNote && (
                        <div className="mt-3 p-3 rounded-lg bg-industrial-bg/50 border border-industrial-border">
                          <p className="text-xs text-gray-400 mb-1">
                            <User className="w-3 h-3 inline mr-1" />
                            {record.reviewedBy} 处理备注：
                          </p>
                          <p className="text-sm text-gray-300">{record.supplementNote}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {record.status === 'pending' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingRecord(record);
                          }}
                          className="btn-primary py-1.5 px-3 text-sm"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          处理
                        </button>
                      )}
                      <button className="text-gray-500 hover:text-gray-300 transition-colors">
                        {expandedId === record.id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {expandedId === record.id && (
                  <div className="px-4 pb-4 animate-fade-in">
                    <div className="p-4 rounded-lg bg-industrial-bg/70 border border-industrial-border">
                      <h4 className="text-sm font-medium text-gray-300 mb-3">原始数据快照</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {Object.entries(record.originalData).map(([key, value]) => (
                          <div key={key}>
                            <p className="text-xs text-gray-500">{key}</p>
                            <p className="text-sm font-mono text-gray-300 truncate">
                              {String(value ?? '-')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-gray-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>
              {filterStatus === 'all'
                ? '暂无问题记录'
                : `暂无${STATUS_LABELS[filterStatus as keyof typeof STATUS_LABELS]}的记录`}
            </p>
          </div>
        )}
      </div>

      {editingRecord && (
        <SupplementForm
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
        />
      )}
    </div>
  );
}
