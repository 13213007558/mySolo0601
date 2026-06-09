import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle, Clock, Undo2, Edit3 } from 'lucide-react';
import { useState, Fragment } from 'react';
import { useReconciliationStore } from '@/store/useReconciliationStore';
import { formatAmount, formatDateTime, formatDate, getStatusColor, getStatusText, getPaymentStatusText } from '@/utils/formatters';

interface DataTableProps {
  onSupplement: (flowId: string) => void;
}

export const DataTable = ({ onSupplement }: DataTableProps) => {
  const { filteredFlows, selectFlow, selectedFlowId, supplementRecords } = useReconciliationStore();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'anomaly':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-400" />;
      default:
        return null;
    }
  };

  const hasSupplement = (flowId: string) => {
    return supplementRecords.some(s => s.paymentFlowId === flowId);
  };

  if (filteredFlows.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-12 text-center">
        <div className="text-slate-500 text-lg mb-2">暂无数据</div>
        <div className="text-slate-600 text-sm">请切换样例数据或调整筛选条件</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50 bg-slate-800/80">
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-10"></th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">车牌号</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">枪号</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">司机</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">金额</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">交易时间</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">支付状态</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">账单状态</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">异常类型</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">补录</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {filteredFlows.map((flow, idx) => {
              const isExpanded = expandedRows.has(flow.id);
              const isSelected = selectedFlowId === flow.id;
              const isAnomaly = flow.status === 'anomaly';
              const supplemented = hasSupplement(flow.id);

              return (
                <Fragment key={flow.id}>
                  <tr
                    onClick={() => selectFlow(flow.id)}
                    className={`transition-all duration-200 cursor-pointer ${
                      isSelected ? 'bg-slate-700/50' : 'hover:bg-slate-700/30'
                    } ${isAnomaly ? 'bg-red-500/5' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleExpand(flow.id); }}
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white font-mono text-sm">{flow.plateNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-cyan-500/10 text-cyan-400 text-xs rounded-lg font-medium">
                        {flow.gunNo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-sm">{flow.driverName}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-mono font-semibold ${
                        flow.hasRefundMark ? 'text-purple-400' : 'text-white'
                      }`}>
                        {formatAmount(flow.amount)}
                        {flow.hasRefundMark && <Undo2 className="w-3 h-3 inline ml-1" />}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-sm font-mono text-xs">
                      {formatDateTime(flow.transactionTime)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs rounded-lg font-medium ${
                        getStatusColor(flow.paymentStatus)
                      }`}>
                        {getPaymentStatusText(flow.paymentStatus)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-lg font-medium ${
                        getStatusColor(flow.status)
                      } ${isAnomaly ? 'animate-pulse' : ''}`}>
                        {getStatusIcon(flow.status)}
                        {getStatusText(flow.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm ${isAnomaly ? 'text-red-400' : 'text-slate-500'}`}>
                        {flow.anomalyType || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {supplemented ? (
                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-lg">已补录</span>
                      ) : (
                        <span className="text-slate-600 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); onSupplement(flow.id); }}
                        className="p-1.5 text-slate-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-all"
                        title="补录备注"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-slate-900/50">
                      <td colSpan={11} className="px-6 py-4">
                        <div className="grid grid-cols-4 gap-6">
                          <div>
                            <div className="text-xs text-slate-500 mb-1">充电时长</div>
                            <div className="text-white font-medium">{flow.chargeDuration}分钟</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500 mb-1">电量变化</div>
                            <div className="text-white font-medium">{flow.startSoc}% → {flow.endSoc}%</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500 mb-1">试运行报告日期</div>
                            <div className="text-white font-medium">{formatDate(flow.trialReportDate)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500 mb-1">支付流水备注日期</div>
                            <div className="text-white font-medium">{formatDate(flow.paymentRemarkDate)}</div>
                          </div>
                          <div className="col-span-4">
                            <div className="text-xs text-slate-500 mb-1">支付流水备注</div>
                            <div className="text-slate-300 text-sm bg-slate-800/50 px-3 py-2 rounded-lg">
                              {flow.remark || '<span class="text-red-400">备注缺失</span>'}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
