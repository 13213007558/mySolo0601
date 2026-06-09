import { useState, useMemo } from 'react';
import { X, Edit3, TrendingUp, AlertTriangle } from 'lucide-react';
import { useForecastStore } from '../store/useForecastStore';
import { calculateDeviation } from '../utils/calculation';

export const ReviseModal = () => {
  const { modals, closeModal, reviseRecord } = useForecastStore();
  const { open, record } = modals.revise;
  const [revisedValue, setRevisedValue] = useState('');
  const [remark, setRemark] = useState('');

  const newDeviation = useMemo(() => {
    if (!record || !revisedValue) return null;
    const revised = parseFloat(revisedValue);
    if (isNaN(revised)) return null;
    return calculateDeviation(revised, record.actualValue);
  }, [record, revisedValue]);

  if (!open || !record) return null;

  const originalDeviation = calculateDeviation(record.forecastValue, record.actualValue);
  const hasImprovement = newDeviation !== null && Math.abs(newDeviation) < Math.abs(originalDeviation);

  const handleSubmit = () => {
    const revised = parseFloat(revisedValue);
    if (isNaN(revised) || revised <= 0) {
      alert('请输入有效的修正值');
      return;
    }
    reviseRecord(record.id, revised, remark);
    setRevisedValue('');
    setRemark('');
    closeModal('revise');
    alert('日前预测修正已补录完成');
  };

  const handleClose = () => {
    setRevisedValue('');
    setRemark('');
    closeModal('revise');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-orange-200 bg-orange-50">
          <div className="flex items-center gap-2">
            <Edit3 size={18} className="text-orange-600" />
            <h3 className="text-base font-semibold text-slate-800">补录日前预测修正</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-white/50 rounded transition-colors text-slate-500"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-1">设备信息</p>
            <p className="text-sm font-medium text-slate-800">{record.deviceNo}</p>
            <p className="text-xs text-slate-600">{record.deviceName}</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-500">原始预测 (MW)</label>
              <p className="text-sm font-mono text-slate-800 bg-slate-50 px-3 py-2 rounded">
                {record.forecastValue.toFixed(2)}
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">实际值 (MW)</label>
              <p className="text-sm font-mono text-slate-800 bg-slate-50 px-3 py-2 rounded">
                {record.actualValue.toFixed(2)}
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">原始偏差</label>
              <p className={`text-sm font-mono font-medium px-3 py-2 rounded ${
                Math.abs(originalDeviation) > 5 ? 'bg-red-50 text-red-600' :
                Math.abs(originalDeviation) > 3 ? 'bg-orange-50 text-orange-600' :
                'bg-green-50 text-green-600'
              }`}>
                {originalDeviation > 0 ? '+' : ''}{originalDeviation.toFixed(2)}%
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-2">日前预测修正值 (MW)</label>
            <input
              type="number"
              value={revisedValue}
              onChange={(e) => setRevisedValue(e.target.value)}
              placeholder="请输入修正后的预测值..."
              className="w-full px-3 py-2 border-2 border-orange-300 rounded text-sm font-mono focus:outline-none focus:border-orange-500 transition-colors bg-orange-50"
            />
            {newDeviation !== null && (
              <div className={`mt-2 flex items-center gap-2 text-xs ${
                hasImprovement ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp size={12} />
                <span>
                  修正后偏差: {newDeviation > 0 ? '+' : ''}{newDeviation.toFixed(2)}%
                  {hasImprovement ? ' (偏差减小，建议采纳)' : ' (偏差增大，请确认)'}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-2">修正说明</label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="请输入修正原因，如：考虑促销活动影响、设备检修调整等..."
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-orange-500 transition-colors resize-none"
              rows={3}
            />
          </div>

          {record.revisedValue !== undefined && (
            <div className="text-xs text-orange-600 bg-orange-50 rounded p-3 border border-orange-200">
              <div className="flex items-center gap-1 font-medium mb-1">
                <AlertTriangle size={12} />
                已有修正记录
              </div>
              <p>当前修正值: {record.revisedValue.toFixed(2)} MW，提交后将覆盖原有修正值。</p>
            </div>
          )}

          <div className="text-xs text-blue-600 bg-blue-50 rounded p-3 border border-blue-200">
            <p className="font-medium mb-1">补录说明</p>
            <p>补录日前预测修正后，曲线图表将显示橙色虚线作为修正曲线。导出时将同时包含原始预测值和修正值两列，便于对比差异。</p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-sm transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded text-sm transition-colors"
          >
            <Edit3 size={14} />
            确认补录
          </button>
        </div>
      </div>
    </div>
  );
};
