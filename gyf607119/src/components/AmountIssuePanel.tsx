import { X, AlertTriangle, Calculator, Info } from 'lucide-react';
import { useGateStore } from '../store/useGateStore';
import { formatCurrency } from '../utils/storage';

export function AmountIssuePanel() {
  const { showAmountIssuePanel, setShowAmountIssuePanel, gates, selectedGateId } = useGateStore();

  const selectedGate = gates.find((g) => g.id === selectedGateId);
  const issue = selectedGate?.amountIssue;

  if (!showAmountIssuePanel || !issue) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-2 border-industrial-orange-300 max-w-lg w-full shadow-xl">
        <div className="bg-industrial-orange-500 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            <h3 className="panel-title text-white">金额精度问题详情</h3>
          </div>
          <button
            onClick={() => setShowAmountIssuePanel(false)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-industrial-orange-50 border-l-4 border-industrial-orange-500 p-4">
            <p className="text-industrial-orange-800 font-medium flex items-start gap-2">
              <Calculator className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>JavaScript 浮点数精度问题可能导致金额计算偏差，影响班组对账准确性。</span>
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-industrial-gray-800 flex items-center gap-2">
              <Info className="w-4 h-4 text-industrial-orange-500" />
              详细计算过程
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-industrial-gray-50 p-4 border border-industrial-gray-200">
                <p className="text-sm text-industrial-gray-500 mb-1">原始计算值</p>
                <p className="text-xl font-mono font-bold text-industrial-gray-800">
                  {formatCurrency(issue.rawValue)}
                </p>
                <p className="text-xs text-industrial-gray-400 mt-1">
                  {issue.rawValue.toFixed(6)}
                </p>
              </div>
              
              <div className="bg-industrial-orange-50 p-4 border border-industrial-orange-200">
                <p className="text-sm text-industrial-orange-600 mb-1">显示值（四舍五入）</p>
                <p className="text-xl font-mono font-bold text-industrial-orange-600">
                  {formatCurrency(issue.displayValue)}
                </p>
                <p className="text-xs text-industrial-orange-400 mt-1">
                  {issue.displayValue.toFixed(6)}
                </p>
              </div>
            </div>

            <div className="bg-industrial-red-50 p-4 border border-industrial-red-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-industrial-red-600">偏差值</p>
                <p className="text-2xl font-mono font-bold text-industrial-red-600">
                  +{issue.deviation.toFixed(6)} 元
                </p>
              </div>
              <p className="text-xs text-industrial-red-500 mt-1">
                约 {(issue.deviation * 1000).toFixed(3)} 厘钱
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-industrial-gray-800">原因说明</h4>
            <div className="bg-industrial-gray-50 p-4 border border-industrial-gray-200">
              <p className="text-industrial-gray-700 leading-relaxed whitespace-pre-wrap">
                {issue.reason}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-industrial-gray-800">技术背景</h4>
            <div className="bg-industrial-blue-50 p-4 border border-industrial-blue-200 text-sm">
              <p className="text-industrial-blue-700 mb-2">
                JavaScript 使用 IEEE 754 双精度浮点数表示数字，某些十进制小数无法精确表示：
              </p>
              <code className="block bg-white p-2 rounded font-mono text-xs text-industrial-gray-800 border border-industrial-blue-200">
                0.1 + 0.2 = 0.30000000000000004
              </code>
              <p className="text-industrial-blue-600 mt-2">
                建议：金额使用整数（分）存储和计算，显示时再转换为元。
              </p>
            </div>
          </div>

          {selectedGate && (
            <div className="pt-4 border-t border-industrial-gray-200">
              <p className="text-sm text-industrial-gray-500">
                关联道闸：<span className="font-mono font-medium text-industrial-gray-700">{selectedGate.gateNo}</span>
                <span className="mx-2">|</span>
                位置：{selectedGate.location}
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-industrial-gray-50 border-t border-industrial-gray-200 flex justify-end">
          <button
            onClick={() => setShowAmountIssuePanel(false)}
            className="industrial-btn-primary"
          >
            我已了解
          </button>
        </div>
      </div>
    </div>
  );
}
