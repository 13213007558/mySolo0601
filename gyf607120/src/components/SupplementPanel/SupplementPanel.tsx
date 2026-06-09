import { useState, useEffect } from 'react';
import { User, FileEdit, GitCompare, Save, X } from 'lucide-react';
import { useReconciliationStore } from '@/store/useReconciliationStore';
import { computeDiff, renderDiffToHTML, hasDifferences } from '@/utils/diffCompare';
import { formatDateTime } from '@/utils/formatters';

interface SupplementPanelProps {
  selectedFlowId: string | null;
  onClose: () => void;
}

export const SupplementPanel = ({ selectedFlowId, onClose }: SupplementPanelProps) => {
  const { paymentFlows, supplementRecords, addSupplementRecord, showSupplementDiff, setShowSupplementDiff } = useReconciliationStore();
  const [remark, setRemark] = useState('');
  const [reason, setReason] = useState('');

  const selectedFlow = paymentFlows.find(f => f.id === selectedFlowId);
  const existingSupplements = supplementRecords.filter(s => s.paymentFlowId === selectedFlowId);
  const latestSupplement = existingSupplements[existingSupplements.length - 1];

  useEffect(() => {
    if (selectedFlow) {
      setRemark(latestSupplement?.afterRemark || selectedFlow.remark || '');
    }
  }, [selectedFlowId, selectedFlow, latestSupplement]);

  if (!selectedFlow) return null;

  const handleSave = () => {
    if (!remark.trim()) return;
    
    const currentRemark = latestSupplement?.afterRemark || selectedFlow.remark || '';
    if (hasDifferences(currentRemark, remark.trim())) {
      addSupplementRecord(selectedFlowId!, remark.trim(), reason.trim() || '客服补录支付流水备注');
      setShowSupplementDiff(true);
    }
    onClose();
  };

  const diffSegments = latestSupplement 
    ? computeDiff(latestSupplement.beforeRemark, latestSupplement.afterRemark)
    : selectedFlow.remark 
      ? computeDiff('', selectedFlow.remark)
      : [];

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50 h-fit">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-orange-400" />
          <h3 className="text-lg font-semibold text-white">客服补录</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-xl p-4 mb-5 border border-orange-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold">
            宁
          </div>
          <div>
            <div className="text-white font-medium">客服-阿宁</div>
            <div className="text-xs text-orange-400/70">支付流水备注手工补录通道</div>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-5">
        <div className="bg-slate-900/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">当前订单</span>
            <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-xs rounded">
              {selectedFlow.plateNumber} | {selectedFlow.gunNo}
            </span>
          </div>
          <div className="text-white text-sm mb-1">
            金额：<span className="font-mono font-semibold">¥{selectedFlow.amount.toFixed(2)}</span>
          </div>
          <div className="text-xs text-slate-500">
            交易时间：{selectedFlow.transactionTime}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm text-slate-400 mb-2">
            <FileEdit className="w-4 h-4" />
            支付流水备注
          </label>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="请输入支付流水备注..."
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition-all resize-none h-24 text-sm"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm text-slate-400 mb-2">
            补录原因
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="例如：试运行报告与支付流水备注日期不一致"
            className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition-all text-sm"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={!remark.trim()}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white rounded-xl transition-all text-sm font-medium shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 disabled:shadow-none"
      >
        <Save className="w-4 h-4" />
        保存补录记录
      </button>

      {existingSupplements.length > 0 && (
        <div className="mt-5 pt-5 border-t border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <GitCompare className="w-4 h-4" />
              补录历史
            </div>
            <button
              onClick={() => setShowSupplementDiff(!showSupplementDiff)}
              className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
            >
              {showSupplementDiff ? '隐藏差异' : '显示差异对比'}
            </button>
          </div>
          
          <div className="space-y-3">
            {existingSupplements.slice().reverse().map((record, idx) => (
              <div key={record.id} className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500">
                    {formatDateTime(record.operateTime)}
                  </span>
                  <span className="text-xs text-orange-400">{record.operatorName}</span>
                </div>
                
                {showSupplementDiff && idx === 0 ? (
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">补录前</div>
                      <div className="text-sm text-slate-400 bg-slate-800/50 px-2 py-1.5 rounded line-through">
                        {record.beforeRemark || '<空>'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">补录后</div>
                      <div 
                        className="text-sm text-white bg-slate-800/50 px-2 py-1.5 rounded"
                        dangerouslySetInnerHTML={{ __html: renderDiffToHTML(computeDiff(record.beforeRemark, record.afterRemark)) }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-white">{record.afterRemark}</div>
                )}
                
                {record.reason && (
                  <div className="mt-2 text-xs text-slate-500">
                    原因：{record.reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
