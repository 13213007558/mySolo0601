import { X, AlertTriangle, Gauge, Info, History } from 'lucide-react';
import { useGateStore } from '../store/useGateStore';

export function ThresholdIssuePanel() {
  const { showThresholdIssuePanel, setShowThresholdIssuePanel, gates, selectedGateId } = useGateStore();

  const selectedGate = gates.find((g) => g.id === selectedGateId);
  const issue = selectedGate?.thresholdIssue;

  if (!showThresholdIssuePanel || !issue) return null;

  const exceedPercent = ((issue.currentValue - issue.threshold) / issue.threshold) * 100;
  const isWarningLevel = exceedPercent > 10 ? 'danger' : exceedPercent > 5 ? 'warning' : 'caution';

  const levelConfig = {
    danger: {
      barColor: 'bg-industrial-red-500',
      textColor: 'text-industrial-red-600',
      bgColor: 'bg-industrial-red-50',
      borderColor: 'border-industrial-red-300',
      label: '严重超标',
    },
    warning: {
      barColor: 'bg-industrial-orange-500',
      textColor: 'text-industrial-orange-600',
      bgColor: 'bg-industrial-orange-50',
      borderColor: 'border-industrial-orange-300',
      label: '超标',
    },
    caution: {
      barColor: 'bg-industrial-orange-400',
      textColor: 'text-industrial-orange-500',
      bgColor: 'bg-industrial-orange-50',
      borderColor: 'border-industrial-orange-200',
      label: '轻微超标',
    },
  };

  const level = levelConfig[isWarningLevel];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-2 border-industrial-red-300 max-w-lg w-full shadow-xl">
        <div className="bg-industrial-red-500 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            <h3 className="panel-title text-white">边界阈值问题详情</h3>
          </div>
          <button
            onClick={() => setShowThresholdIssuePanel(false)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className={`${level.bgColor} border-l-4 ${level.borderColor} p-4`}>
            <p className={`${level.textColor} font-medium flex items-start gap-2`}>
              <Gauge className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{level.label}：当前值已超过安全阈值，可能导致设备故障或安全隐患。</span>
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-industrial-gray-800 flex items-center gap-2">
              <Info className="w-4 h-4 text-industrial-red-500" />
              阈值对比分析
            </h4>

            <div className="relative pt-2">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-industrial-gray-600">当前值</span>
                <span className={`font-mono font-bold ${level.textColor}`}>
                  {issue.currentValue} {issue.unit}
                </span>
              </div>
              <div className="h-4 bg-industrial-gray-200 relative overflow-hidden">
                <div
                  className={`h-full ${level.barColor} transition-all duration-500`}
                  style={{ width: `${Math.min(100, (issue.currentValue / issue.threshold) * 50)}%` }}
                />
                <div
                  className="absolute top-0 h-full w-0.5 bg-industrial-gray-800"
                  style={{ left: '50%' }}
                  title={`阈值：${issue.threshold} ${issue.unit}`}
                />
              </div>
              <div className="flex justify-between text-xs mt-1 text-industrial-gray-500">
                <span>0</span>
                <span className="font-mono">阈值: {issue.threshold} {issue.unit}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-industrial-gray-50 p-4 border border-industrial-gray-200">
                <p className="text-sm text-industrial-gray-500 mb-1">安全阈值</p>
                <p className="text-xl font-mono font-bold text-industrial-green-600">
                  ≤ {issue.threshold} {issue.unit}
                </p>
              </div>
              <div className={`${level.bgColor} p-4 border ${level.borderColor}`}>
                <p className={`text-sm ${level.textColor} mb-1`}>超出量</p>
                <p className={`text-xl font-mono font-bold ${level.textColor}`}>
                  +{(issue.currentValue - issue.threshold).toFixed(1)} {issue.unit}
                </p>
                <p className="text-xs mt-1">
                  超出 <span className="font-bold">{exceedPercent.toFixed(1)}%</span>
                </p>
              </div>
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
            <h4 className="font-semibold text-industrial-gray-800 flex items-center gap-2">
              <History className="w-4 h-4 text-industrial-blue-500" />
              历史参考
            </h4>
            <div className="bg-industrial-blue-50 p-4 border border-industrial-blue-200">
              <p className="text-industrial-blue-700 text-sm">
                {issue.historicalRef}
              </p>
            </div>
          </div>

          <div className="bg-industrial-gray-50 p-4 border border-industrial-gray-200 text-sm">
            <p className="text-industrial-gray-700 font-medium mb-2">复盘要点：</p>
            <ul className="list-disc list-inside space-y-1 text-industrial-gray-600">
              <li>阈值设定是否合理？是否需要根据季节调整？</li>
              <li>超阈值持续了多长时间？是否有预警机制？</li>
              <li>本次超阈值是否造成了实际损失？</li>
              <li>后续如何避免类似情况发生？</li>
            </ul>
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

        <div className="px-6 py-4 bg-industrial-gray-50 border-t border-industrial-gray-200 flex justify-end gap-3">
          <button
            onClick={() => setShowThresholdIssuePanel(false)}
            className="industrial-btn-secondary"
          >
            稍后处理
          </button>
          <button
            onClick={() => {
              setShowThresholdIssuePanel(false);
              alert('已创建检修工单，维修班组将在30分钟内到场处理。');
            }}
            className="industrial-btn-danger"
          >
            立即派单检修
          </button>
        </div>
      </div>
    </div>
  );
}
