import { X, FileText, AlertTriangle, Users, ArrowLeft, Clock } from 'lucide-react';
import { useForecastStore } from '../store/useForecastStore';
import { statusLabels, statusColors } from '../data/mockData';
import { displayValue, formatDeviation } from '../utils/calculation';

export const DetailModal = () => {
  const { modals, closeModal, setChartRecordId } = useForecastStore();
  const { open, record } = modals.detail;

  if (!open || !record) return null;

  const handleClose = () => closeModal('detail');

  const handleBackToSource = () => {
    if (record.sourceMaterial && record.sourceMaterial.trim() !== '') {
      alert(`正在打开原始材料: ${record.sourceMaterial}\n\n(实际应用中会跳转到对应的客服回访表)`);
    }
  };

  const handleViewChart = () => {
    setChartRecordId(record.id);
    handleClose();
  };

  const deviation = formatDeviation(record.deviationRate);
  const originalRemarks = record.remarks.filter(r => r.type === 'original');
  const newRemarks = record.remarks.filter(r => r.type === 'new');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="text-base font-semibold text-slate-800">负荷预测详情</h3>
            <p className="text-xs text-slate-500 mt-0.5">{record.deviceNo} - {record.deviceName}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-slate-200 rounded transition-colors text-slate-500"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(85vh-64px)]">
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-500">预测日期</label>
                <p className="text-sm text-slate-800 font-medium">{displayValue(record.forecastDate)}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">状态</label>
                <p>
                  <span className={`inline-flex items-center px-2 py-1 text-xs rounded font-medium ${statusColors[record.status]}`}>
                    {statusLabels[record.status]}
                  </span>
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">原始预测值 (MW)</label>
                <p className="text-sm text-slate-800 font-mono">{record.forecastValue.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-orange-600">日前修正值 (MW)</label>
                <p className="text-sm font-mono">
                  {record.revisedValue !== undefined ? (
                    <span className="text-orange-600 font-medium">{record.revisedValue.toFixed(2)}</span>
                  ) : (
                    <span className="text-slate-400">--</span>
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">实际值 (MW)</label>
                <p className="text-sm text-slate-800 font-mono">{record.actualValue.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">偏差率</label>
                <p className={`text-sm font-mono font-medium ${deviation.color}`}>{deviation.text}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs ${
                record.isAbnormal ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'
              }`}>
                <AlertTriangle size={12} />
                {record.isAbnormal ? '客服回访异常' : '数据正常'}
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs ${
                record.hasStatusConflict ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
              }`}>
                <Users size={12} />
                {record.hasStatusConflict ? '多人修改冲突，不计入汇总' : '状态正常'}
              </div>
              {record.isManualEntry && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-blue-100 text-blue-700">
                  <FileText size={12} />
                  手工补录记录
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 pt-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">操作记录</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock size={12} />
                  <span>创建人: {displayValue(record.createdBy)}</span>
                </div>
                {record.updatedBy && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock size={12} />
                    <span>最后更新: {record.updatedBy} at {displayValue(record.updatedAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {record.remarks.length > 0 && (
              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">备注历史</h4>
                <div className="space-y-3">
                  {originalRemarks.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500">旧理由（撤回前保留）</p>
                      {originalRemarks.map(remark => (
                        <div key={remark.id} className="bg-slate-50 rounded p-3 border border-slate-200">
                          <p className="text-sm text-slate-500 italic">{remark.content}</p>
                          <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                            <span>{remark.author}</span>
                            <span>{remark.createdAt}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {newRemarks.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500">新备注</p>
                      {newRemarks.map(remark => (
                        <div key={remark.id} className="bg-blue-50 rounded p-3 border border-blue-200">
                          <p className="text-sm text-slate-800">{remark.content}</p>
                          <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                            <span>{remark.author}</span>
                            <span>{remark.createdAt}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={handleBackToSource}
            disabled={!record.sourceMaterial || record.sourceMaterial.trim() === ''}
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm transition-colors ${
              record.sourceMaterial && record.sourceMaterial.trim() !== ''
                ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <ArrowLeft size={14} />
            {record.sourceMaterial && record.sourceMaterial.trim() !== ''
              ? `返回原始材料: ${record.sourceMaterial}`
              : '暂无原始材料'}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleViewChart}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm transition-colors"
            >
              查看曲线
            </button>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-sm transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
