import { useState, useMemo } from 'react';
import { X, Clock, FileText, AlertTriangle, Check, User } from 'lucide-react';
import { useValveStore } from '@/store/valveStore';
import { useViewStore } from '@/store/viewStore';
import { computeDiff, formatValue, getFieldLabel } from '@/utils/diff';
import { todayStr } from '@/utils/storage';
import AnomalyFeedback from './AnomalyFeedback';

export default function ManualRecordModal() {
  const { showManualModal, closeManualModal, addManualRecord, records } = useValveStore();
  const { anomalyState, setAnomalyState } = useViewStore();

  const [formData, setFormData] = useState({
    recordDate: todayStr(),
    valveNo: 'VL-B03-07',
    opening: 78,
    temperature: 165,
    pressure: 2.4,
    remarks: '',
  });

  const [showPreview, setShowPreview] = useState(false);

  const existingRecords = useMemo(() => {
    return records.filter(r => !r.isDeleted && r.valveNo === formData.valveNo);
  }, [records, formData.valveNo]);

  const latestRecord = existingRecords[0];

  const diffPreview = useMemo(() => {
    if (!latestRecord) return [];
    return computeDiff(
      {
        opening: latestRecord.opening,
        temperature: latestRecord.temperature,
        pressure: latestRecord.pressure,
        remarks: latestRecord.remarks,
      },
      {
        opening: formData.opening,
        temperature: formData.temperature,
        pressure: formData.pressure,
        remarks: formData.remarks,
      }
    ).filter(d => d.changed);
  }, [latestRecord, formData]);

  const handleSubmit = () => {
    if (!formData.valveNo) {
      alert('请填写阀门编号');
      return;
    }

    addManualRecord({
      ...formData,
      remarks: formData.remarks || `老何手工补录 ${formData.recordDate} 巡检数据`,
    });

    const newFilters = useViewStore.getState().filters;
    const newKeyword = useViewStore.getState().searchKeyword;
    useValveStore.getState().applyFilters(newFilters, newKeyword);

    setFormData({
      recordDate: todayStr(),
      valveNo: 'VL-B03-07',
      opening: 78,
      temperature: 165,
      pressure: 2.4,
      remarks: '',
    });
    setShowPreview(false);
  };

  if (!showManualModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-slide-in">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-industrial-orange to-amber-500 text-white">
          <h3 className="font-semibold flex items-center gap-2">
            <Clock size={20} />
            老何手工补录
          </h3>
          <button
            onClick={closeManualModal}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="mb-4 p-3 bg-industrial-orange/5 border border-industrial-orange/20 rounded-lg">
            <div className="flex items-start gap-2">
              <User size={18} className="text-industrial-orange mt-0.5" />
              <div>
                <p className="text-sm font-medium text-industrial-orange">系统异常，手工补录模式</p>
                <p className="text-xs text-gray-500 mt-1">
                  此操作将被标记为"手工补录"，并记录完整的修改痕迹。请确保数据准确。
                </p>
              </div>
            </div>
          </div>

          {latestRecord && (
            <div className="mb-4">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="w-full p-3 border border-gray-200 rounded-lg text-left hover:border-primary-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <FileText size={16} className="text-primary-500" />
                    查看上次记录 & 差异预览
                  </span>
                  <span className="text-xs text-industrial-orange">
                    {diffPreview.length} 处差异
                  </span>
                </div>
              </button>

              {showPreview && (
                <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-slide-in">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-400 mb-2">上次记录 ({latestRecord.recordDate})</p>
                      <div className="space-y-1">
                        <p>开度: <span className="font-mono">{latestRecord.opening}%</span></p>
                        <p>温度: <span className="font-mono">{latestRecord.temperature}°C</span></p>
                        <p>压力: <span className="font-mono">{latestRecord.pressure}MPa</span></p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-2">本次补录</p>
                      <div className="space-y-1">
                        <p>开度: <span className={`font-mono ${diffPreview.some(d => d.field === 'opening') ? 'text-industrial-orange font-bold' : ''}`}>
                          {formData.opening}% {diffPreview.some(d => d.field === 'opening') && '↑'}
                        </span></p>
                        <p>温度: <span className={`font-mono ${diffPreview.some(d => d.field === 'temperature') ? 'text-industrial-orange font-bold' : ''}`}>
                          {formData.temperature}°C {diffPreview.some(d => d.field === 'temperature') && '↑'}
                        </span></p>
                        <p>压力: <span className={`font-mono ${diffPreview.some(d => d.field === 'pressure') ? 'text-industrial-orange font-bold' : ''}`}>
                          {formData.pressure}MPa {diffPreview.some(d => d.field === 'pressure') && '↑'}
                        </span></p>
                      </div>
                    </div>
                  </div>

                  {diffPreview.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-500 mb-2">差异详情:</p>
                      <div className="space-y-1">
                        {diffPreview.map(d => (
                          <div key={d.field} className="flex items-center justify-between text-xs bg-industrial-orange/5 px-2 py-1 rounded">
                            <span className="text-gray-600">{getFieldLabel(d.field)}</span>
                            <span className="font-mono">
                              <span className="line-through text-gray-400">{formatValue(d.field, d.oldValue)}</span>
                              <span className="mx-1">→</span>
                              <span className="text-industrial-orange font-medium">{formatValue(d.field, d.newValue)}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">记录日期</label>
              <input
                type="date"
                value={formData.recordDate}
                onChange={(e) => setFormData(prev => ({ ...prev, recordDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-industrial-orange focus:ring-1 focus:ring-industrial-orange"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">阀门编号</label>
              <input
                type="text"
                value={formData.valveNo}
                onChange={(e) => setFormData(prev => ({ ...prev, valveNo: e.target.value }))}
                placeholder="如 VL-A01-01"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-industrial-orange focus:ring-1 focus:ring-industrial-orange"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开度 (%)</label>
              <input
                type="number"
                value={formData.opening}
                onChange={(e) => setFormData(prev => ({ ...prev, opening: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-industrial-orange focus:ring-1 focus:ring-industrial-orange"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">温度 (°C)</label>
              <input
                type="number"
                value={formData.temperature}
                onChange={(e) => setFormData(prev => ({ ...prev, temperature: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-industrial-orange focus:ring-1 focus:ring-industrial-orange"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">压力 (MPa)</label>
              <input
                type="number"
                step="0.1"
                value={formData.pressure}
                onChange={(e) => setFormData(prev => ({ ...prev, pressure: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-industrial-orange focus:ring-1 focus:ring-industrial-orange"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">补录说明</label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="请说明补录原因，如：系统异常、临时停机等..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-industrial-orange focus:ring-1 focus:ring-industrial-orange resize-none"
              />
            </div>
          </div>

          {anomalyState === 'undo_reason_override' && (
            <div className="mt-4">
              <AnomalyFeedback type="undo_reason_override" />
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50">
          <button
            onClick={closeManualModal}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-gradient-to-r from-industrial-orange to-amber-500 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Check size={16} />
            确认补录
          </button>
        </div>
      </div>
    </div>
  );
}
