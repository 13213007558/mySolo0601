import { useState } from 'react';
import { Upload, FileWarning, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useReconciliationStore } from '@/store/useReconciliationStore';
import type { PaymentFlow, ImportCheckResult } from '@/types';
import { formatAmount } from '@/utils/formatters';

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkResult: ImportCheckResult;
  onConfirmReturn: () => void;
}

export const ReturnModal = ({ isOpen, onClose, checkResult, onConfirmReturn }: ReturnModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-amber-500/20 rounded-xl">
            <FileWarning className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">需要退回补材料</h3>
            <p className="text-sm text-slate-400">以下记录缺少必要材料，请退回补充</p>
          </div>
        </div>

        <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
          {checkResult.needReturn.map((flow, idx) => (
            <div key={idx} className="bg-slate-900/50 rounded-xl p-4 border border-amber-500/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-white">{flow.plateNumber}</span>
                  <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-xs rounded">{flow.gunNo}</span>
                  <span className="text-slate-400 text-sm">{formatAmount(flow.amount)}</span>
                </div>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-sm text-amber-400/80">
                {checkResult.returnReasons[idx]}
              </div>
              <div className="mt-2 text-xs text-slate-500">
                需要补充：{flow.trialReportDate ? '' : '试运行报告、'}
                {flow.paymentRemarkDate ? '' : '支付流水备注、'}
                {flow.trialReportDate && flow.paymentRemarkDate && flow.trialReportDate !== flow.paymentRemarkDate
                  ? '日期一致性证明'
                  : ''}
              </div>
            </div>
          ))}

          {checkResult.duplicates.length > 0 && (
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-600/30">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-300">重复记录（已自动跳过）</span>
              </div>
              <div className="text-xs text-slate-500">
                {checkResult.duplicates.map(f => f.plateNumber).join('、')}
              </div>
            </div>
          )}

          {checkResult.validNew.length > 0 && (
            <div className="bg-slate-900/50 rounded-xl p-4 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-emerald-300">可正常导入记录</span>
              </div>
              <div className="text-xs text-emerald-400/70">
                {checkResult.validNew.map(f => `${f.plateNumber} (${formatAmount(f.amount)})`).join('、')}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-all text-sm font-medium"
          >
            取消
          </button>
          <button
            onClick={onConfirmReturn}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl transition-all text-sm font-medium shadow-lg shadow-amber-500/20"
          >
            确认退回，要求补材料
          </button>
        </div>
      </div>
    </div>
  );
};

interface ImportPanelProps {
  onExport: () => void;
}

export const ImportPanel = ({ onExport }: ImportPanelProps) => {
  const { simulateImport, confirmImport, returnForMaterials, currentSample, setSample, importHistories } = useReconciliationStore();
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [checkResult, setCheckResult] = useState<ImportCheckResult | null>(null);

  const handleSimulateImport = () => {
    const result = simulateImport();
    setCheckResult(result);
    
    if (result.needReturn.length > 0 || result.duplicates.length > 0) {
      setShowReturnModal(true);
    } else if (result.validNew.length > 0) {
      confirmImport(result.validNew);
    }
  };

  const handleConfirmReturn = () => {
    if (checkResult) {
      returnForMaterials(checkResult.needReturn, checkResult.returnReasons);
      if (checkResult.validNew.length > 0) {
        confirmImport(checkResult.validNew);
      }
    }
    setShowReturnModal(false);
    setCheckResult(null);
  };

  const sampleConfig = [
    { value: 'normal', label: '正常样例', color: 'emerald', desc: '所有数据正常' },
    { value: 'anomaly', label: '异常样例', color: 'red', desc: '包含多种异常' },
    { value: 'empty', label: '空数据', color: 'slate', desc: '无交易记录' }
  ];

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50 h-fit">
      <h3 className="text-lg font-semibold text-white mb-4">数据操作</h3>

      <div className="mb-5">
        <div className="text-sm text-slate-400 mb-2">内置样例数据</div>
        <div className="space-y-2">
          {sampleConfig.map(sample => (
            <button
              key={sample.value}
              onClick={() => setSample(sample.value as 'normal' | 'anomaly' | 'empty')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                currentSample === sample.value
                  ? sample.color === 'emerald'
                    ? 'bg-emerald-500/20 border-2 border-emerald-500/50'
                    : sample.color === 'red'
                    ? 'bg-red-500/20 border-2 border-red-500/50'
                    : 'bg-slate-700/50 border-2 border-slate-500/50'
                  : 'bg-slate-900/30 border border-slate-700/50 hover:bg-slate-700/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  sample.color === 'emerald' ? 'bg-emerald-400' :
                  sample.color === 'red' ? 'bg-red-400' : 'bg-slate-400'
                }`} />
                <span className={`font-medium ${
                  currentSample === sample.value ? 'text-white' : 'text-slate-300'
                }`}>{sample.label}</span>
              </div>
              <span className="text-xs text-slate-500">{sample.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleSimulateImport}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl transition-all text-sm font-medium shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5"
        >
          <Upload className="w-4 h-4" />
          模拟导入（触发重复检测）
        </button>

        <button
          onClick={onExport}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-xl transition-all text-sm font-medium"
        >
          导出 Excel（含未采用原因）
        </button>
      </div>

      {importHistories.length > 0 && (
        <div className="mt-5 pt-5 border-t border-slate-700/50">
          <div className="text-sm text-slate-400 mb-3">最近导入记录</div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {importHistories.slice(-3).reverse().map(history => (
              <div
                key={history.id}
                className={`p-3 rounded-lg text-xs ${
                  history.status === 'completed'
                    ? 'bg-emerald-500/10 border border-emerald-500/20'
                    : 'bg-amber-500/10 border border-amber-500/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-300">{history.fileName}</span>
                  <span className={history.status === 'completed' ? 'text-emerald-400' : 'text-amber-400'}>
                    {history.status === 'completed' ? '已完成' : '已退回'}
                  </span>
                </div>
                <div className="text-slate-500">
                  共{history.totalRecords}条 | 新增{history.validNewRecords}条 | 退回{history.returnedRecords}条
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {checkResult && (
        <ReturnModal
          isOpen={showReturnModal}
          onClose={() => { setShowReturnModal(false); setCheckResult(null); }}
          checkResult={checkResult}
          onConfirmReturn={handleConfirmReturn}
        />
      )}
    </div>
  );
};
