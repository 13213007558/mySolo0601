import React from 'react';
import { AlertCircle, Clock, CheckCircle, Info, FileText } from 'lucide-react';
import { useGateStore } from '../store/useGateStore';
import { formatCurrency } from '../utils/storage';
import { cn } from '@/lib/utils';

const statusConfig = {
  normal: { label: '正常', class: 'status-normal', icon: CheckCircle },
  abnormal: { label: '异常', class: 'status-abnormal', icon: AlertCircle },
  pending: { label: '待巡检', class: 'status-pending', icon: Clock },
};

export function GateList() {
  const { 
    gates, 
    filter, 
    selectedGateId, 
    setSelectedGateId,
    setShowAmountIssuePanel,
    setShowThresholdIssuePanel,
    setShowDiffViewer,
    setShowEmptyState,
    emptyStateType,
    showEmptyState,
  } = useGateStore();

  const filteredGates = gates.filter((gate) => {
    if (filter === 'all') return true;
    return gate.status === filter;
  });

  const handleRowClick = (gateId: string) => {
    setSelectedGateId(selectedGateId === gateId ? null : gateId);
  };

  const selectedGate = gates.find((g) => g.id === selectedGateId);

  if (showEmptyState && emptyStateType) {
    return null;
  }

  if (filteredGates.length === 0 && !showEmptyState) {
    return (
      <div className="industrial-card p-8 text-center">
        <FileText className="w-12 h-12 text-industrial-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-industrial-gray-700 mb-2">暂无匹配数据</h3>
        <p className="text-industrial-gray-500 mb-4">当前筛选条件下没有道闸巡检记录</p>
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setShowEmptyState(true, 'filter-narrow')}
            className="industrial-btn-secondary"
          >
            查看筛选过窄提示
          </button>
          <button
            onClick={() => setShowEmptyState(true, 'all-damaged')}
            className="industrial-btn-danger"
          >
            查看全坏场景
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="industrial-card border-2 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="px-4 py-3 text-left">道闸编号</th>
              <th className="px-4 py-3 text-left">位置</th>
              <th className="px-4 py-3 text-left">状态</th>
              <th className="px-4 py-3 text-left">巡检时间</th>
              <th className="px-4 py-3 text-right">金额</th>
              <th className="px-4 py-3 text-center">异常标记</th>
              <th className="px-4 py-3 text-center">放行说明</th>
            </tr>
          </thead>
          <tbody>
            {filteredGates.map((gate, index) => {
              const StatusIcon = statusConfig[gate.status].icon;
              const isSelected = selectedGateId === gate.id;
              const hasAmountIssue = !!gate.amountIssue;
              const hasThresholdIssue = !!gate.thresholdIssue;
              const hasManualEntry = !!gate.isManualEntry;

              return (
                <React.Fragment key={gate.id}>
                  <tr
                    onClick={() => handleRowClick(gate.id)}
                    className={cn(
                      'table-row cursor-pointer',
                      index % 2 === 1 && 'table-row-alternate',
                      gate.status === 'abnormal' && 'bg-industrial-orange-50/30',
                      isSelected && 'bg-industrial-blue-100'
                    )}
                  >
                    <td className="px-4 py-3 font-mono font-medium text-industrial-gray-800">
                      {gate.gateNo}
                    </td>
                    <td className="px-4 py-3 text-industrial-gray-700">{gate.location}</td>
                    <td className="px-4 py-3">
                      <span className={statusConfig[gate.status].class}>
                        <StatusIcon className="w-3 h-3 mr-1 inline" />
                        {statusConfig[gate.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-industrial-gray-600 font-mono text-sm">
                      {gate.inspectionTime}
                    </td>
                    <td className={cn(
                      'px-4 py-3 text-right font-mono font-medium',
                      hasAmountIssue ? 'text-industrial-orange-600' : 'text-industrial-gray-800'
                    )}>
                      {formatCurrency(gate.amount)}
                      {hasAmountIssue && (
                        <AlertCircle className="w-4 h-4 inline ml-1 text-industrial-orange-500" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        {hasAmountIssue && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedGateId(gate.id);
                              setShowAmountIssuePanel(true);
                            }}
                            className="p-1.5 rounded bg-industrial-orange-100 text-industrial-orange-600 hover:bg-industrial-orange-200 transition-colors"
                            title="金额精度问题"
                          >
                            <span className="text-xs font-mono">¥</span>
                          </button>
                        )}
                        {hasThresholdIssue && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedGateId(gate.id);
                              setShowThresholdIssuePanel(true);
                            }}
                            className="p-1.5 rounded bg-industrial-red-100 text-industrial-red-600 hover:bg-industrial-red-200 transition-colors"
                            title="边界阈值问题"
                          >
                            <span className="text-xs font-mono">⚡</span>
                          </button>
                        )}
                        {!hasAmountIssue && !hasThresholdIssue && (
                          <span className="text-industrial-gray-400 text-sm">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGateId(gate.id);
                            if (hasManualEntry) {
                              setShowDiffViewer(true);
                            }
                          }}
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors',
                            hasManualEntry
                              ? 'bg-industrial-blue-100 text-industrial-blue-600 hover:bg-industrial-blue-200'
                              : 'bg-industrial-gray-100 text-industrial-gray-600 hover:bg-industrial-gray-200'
                          )}
                        >
                          <FileText className="w-3 h-3" />
                          {hasManualEntry ? '已补录' : '查看'}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isSelected && (
                    <tr className="bg-industrial-gray-50">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <Info className="w-4 h-4 text-industrial-blue-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-industrial-gray-700 mb-1">放行说明：</p>
                              <p className="text-industrial-gray-600 text-sm leading-relaxed">
                                {gate.passDescription || '暂无放行说明'}
                              </p>
                              {hasManualEntry && gate.manualEntryTime && (
                                <p className="text-xs text-industrial-gray-500 mt-2">
                                  补录时间：{gate.manualEntryTime} | 补录人：{gate.operator}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {selectedGate && (
        <div className="px-4 py-3 bg-industrial-gray-50 border-t border-industrial-gray-200 flex justify-between items-center">
          <span className="text-sm text-industrial-gray-600">
            已选中：<span className="font-mono font-medium">{selectedGate.gateNo}</span> - {selectedGate.location}
          </span>
          <div className="flex gap-2">
            {selectedGate.amountIssue && (
              <button
                onClick={() => setShowAmountIssuePanel(true)}
                className="industrial-btn-warning text-sm py-1.5 px-3"
              >
                查看金额精度问题
              </button>
            )}
            {selectedGate.thresholdIssue && (
              <button
                onClick={() => setShowThresholdIssuePanel(true)}
                className="industrial-btn-danger text-sm py-1.5 px-3"
              >
                查看阈值问题
              </button>
            )}
            {selectedGate.isManualEntry && (
              <button
                onClick={() => setShowDiffViewer(true)}
                className="industrial-btn-primary text-sm py-1.5 px-3"
              >
                查看补录差异
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
