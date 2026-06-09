import { useState } from 'react';
import { Plus, Save, X } from 'lucide-react';
import { useForecastStore } from '../store/useForecastStore';
import { calculateDeviation } from '../utils/calculation';

export const ManualEntryRow = () => {
  const { addManualEntry } = useForecastStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    deviceNo: '',
    deviceName: '',
    forecastValue: '',
    revisedValue: '',
    actualValue: '',
    remark: '',
  });

  const handleSave = () => {
    if (!formData.deviceNo || !formData.deviceName) {
      alert('请填写设备编号和设备名称');
      return;
    }

    const forecast = parseFloat(formData.forecastValue) || 0;
    const revised = formData.revisedValue ? parseFloat(formData.revisedValue) : undefined;
    const actual = parseFloat(formData.actualValue) || 0;
    const deviation = calculateDeviation(revised || forecast, actual);

    addManualEntry({
      deviceNo: formData.deviceNo,
      deviceName: formData.deviceName,
      forecastValue: forecast,
      revisedValue: revised,
      actualValue: actual,
      deviationRate: deviation,
      remarks: formData.remark ? [{
        id: Date.now().toString(),
        content: formData.remark,
        author: '钟姐',
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        type: 'new' as const,
      }] : [],
      isAbnormal: false,
      hasStatusConflict: false,
    });

    setFormData({
      deviceNo: '',
      deviceName: '',
      forecastValue: '',
      revisedValue: '',
      actualValue: '',
      remark: '',
    });
    setIsEditing(false);
    alert('补录成功，已添加日前预测修正记录');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      deviceNo: '',
      deviceName: '',
      forecastValue: '',
      revisedValue: '',
      actualValue: '',
      remark: '',
    });
  };

  if (!isEditing) {
    return (
      <tr className="bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer" onClick={() => setIsEditing(true)}>
        <td colSpan={10} className="px-4 py-3">
          <div className="flex items-center justify-center gap-2 text-blue-600 text-sm font-medium">
            <Plus size={16} />
            <span>钟姐手工补录日前预测修正（点击添加）</span>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="bg-blue-50 border-t-2 border-blue-200">
      <td className="px-4 py-2">
        <input
          type="text"
          placeholder="设备编号"
          value={formData.deviceNo}
          onChange={(e) => setFormData({ ...formData, deviceNo: e.target.value })}
          className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:border-blue-500"
        />
      </td>
      <td className="px-4 py-2">
        <input
          type="text"
          placeholder="设备名称"
          value={formData.deviceName}
          onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
          className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:border-blue-500"
        />
      </td>
      <td className="px-4 py-2">
        <input
          type="number"
          placeholder="原始预测"
          value={formData.forecastValue}
          onChange={(e) => setFormData({ ...formData, forecastValue: e.target.value })}
          className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:border-blue-500 font-mono"
        />
      </td>
      <td className="px-4 py-2">
        <input
          type="number"
          placeholder="修正值"
          value={formData.revisedValue}
          onChange={(e) => setFormData({ ...formData, revisedValue: e.target.value })}
          className="w-full px-2 py-1 text-sm border border-orange-300 rounded focus:outline-none focus:border-orange-500 font-mono bg-orange-50"
        />
      </td>
      <td className="px-4 py-2">
        <input
          type="number"
          placeholder="实际值"
          value={formData.actualValue}
          onChange={(e) => setFormData({ ...formData, actualValue: e.target.value })}
          className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:border-blue-500 font-mono"
        />
      </td>
      <td className="px-4 py-2 text-sm font-mono text-slate-600 text-center">
        {formData.forecastValue && formData.actualValue
          ? `${calculateDeviation(
              formData.revisedValue ? parseFloat(formData.revisedValue) : parseFloat(formData.forecastValue),
              parseFloat(formData.actualValue)
            ).toFixed(2)}%`
          : '--'}
      </td>
      <td className="px-4 py-2">
        <input
          type="text"
          placeholder="备注说明"
          value={formData.remark}
          onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
          className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:border-blue-500"
        />
      </td>
      <td className="px-4 py-2">
        <span className="inline-flex items-center px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">
          待复核
        </span>
      </td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-1">
          <button
            onClick={handleSave}
            className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
          >
            <Save size={14} />
          </button>
          <button
            onClick={handleCancel}
            className="p-1.5 bg-slate-400 hover:bg-slate-500 text-white rounded transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
};
