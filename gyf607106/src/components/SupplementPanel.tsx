import { useState, useMemo } from 'react';
import { X, Plus, Trash2, Download, Upload, Check, AlertCircle } from 'lucide-react';
import type { SupplementPoint } from '@/types';
import { useOilTempStore } from '@/store/useOilTempStore';
import { useSupplementComparison } from '@/hooks/useSupplementComparison';
import { generateZhaoSupplementData } from '@/utils/mockData';
import { parseImportData } from '@/utils/export';
import { calculateHash } from '@/utils/hash';

export function SupplementPanel() {
  const {
    showSupplementPanel,
    setShowSupplementPanel,
    selectedDevice,
    addSupplementRecord,
    exportSupplement,
  } = useOilTempStore();

  const activeSupplementId = useMemo(() => {
    const supplements = useOilTempStore.getState().supplementRecords;
    return supplements.length > 0 ? supplements[supplements.length - 1].id : null;
  }, []);

  const { supplement, comparisonData, statistics, hasSupplement } = useSupplementComparison(activeSupplementId);

  const [points, setPoints] = useState<SupplementPoint[]>([]);
  const [newTime, setNewTime] = useState('22:00');
  const [newTemp, setNewTemp] = useState('58.0');
  const [remark, setRemark] = useState('');
  const [activeTab, setActiveTab] = useState<'input' | 'compare'>('input');

  if (!showSupplementPanel) return null;

  const handleAddPoint = () => {
    const exists = points.some(p => p.time === newTime);
    if (exists) {
      setPoints(points.map(p =>
        p.time === newTime ? { ...p, temperature: parseFloat(newTemp) } : p
      ));
    } else {
      setPoints([...points, { time: newTime, temperature: parseFloat(newTemp) }].sort(
        (a, b) => {
          const getMin = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            let mins = h * 60 + m;
            if (h < 12) mins += 24 * 60;
            return mins;
          };
          return getMin(a.time) - getMin(b.time);
        }
      ));
    }
    setNewTemp('');
  };

  const handleRemovePoint = (time: string) => {
    setPoints(points.filter(p => p.time !== time));
  };

  const handleLoadTemplate = () => {
    const template = generateZhaoSupplementData();
    setPoints(template.points);
    setRemark(template.remark || '');
  };

  const handleSave = () => {
    if (points.length === 0) return;
    addSupplementRecord({
      deviceName: selectedDevice,
      operator: '小赵',
      recordDate: new Date().toISOString().split('T')[0],
      points,
      remark,
    });
    setPoints([]);
    setRemark('');
  };

  const handleExport = () => {
    if (activeSupplementId) {
      exportSupplement(activeSupplementId);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then(text => {
      try {
        const data = JSON.parse(text);
        if (data.points && Array.isArray(data.points)) {
          setPoints(data.points);
          setRemark(data.remark || '');
        }
      } catch {
        console.error('导入失败');
      }
    });
    e.target.value = '';
  };

  const handleVerifyHash = () => {
    if (!supplement) return false;
    const currentHash = calculateHash(supplement.points);
    return currentHash === supplement.originalDataHash;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">小赵手工补录</h2>
              <p className="text-xs text-slate-500">录入夜间油温曲线，与原始数据对比</p>
            </div>
          </div>
          <button
            onClick={() => setShowSupplementPanel(false)}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="border-b border-slate-700">
          <div className="flex">
            <button
              onClick={() => setActiveTab('input')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'input'
                  ? 'text-amber-400 border-b-2 border-amber-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              数据录入
            </button>
            <button
              onClick={() => setActiveTab('compare')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'compare'
                  ? 'text-amber-400 border-b-2 border-amber-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              对比分析
              {hasSupplement && (
                <span className="ml-2 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">
                  {statistics.significantDiffs}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {activeTab === 'input' ? (
            <div className="space-y-6">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-slate-400 mb-1">时间</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-slate-400 mb-1">油温 (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newTemp}
                    onChange={(e) => setNewTemp(e.target.value)}
                    placeholder="58.0"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
                <button
                  onClick={handleAddPoint}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  添加
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleLoadTemplate}
                  className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                >
                  加载小赵补录模板
                </button>
                <span className="text-slate-600">|</span>
                <label className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer transition-colors">
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                  <span className="inline-flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    读回补录文件
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">备注</label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  rows={2}
                  placeholder="输入补录说明..."
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                  <h4 className="text-sm font-medium text-slate-200">已录入数据点 ({points.length})</h4>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-800 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">时间</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">油温 (°C)</th>
                        <th className="px-4 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {points.map((point) => (
                        <tr key={point.time} className="hover:bg-slate-700/30">
                          <td className="px-4 py-2 font-mono text-slate-300">{point.time}</td>
                          <td className="px-4 py-2 font-mono text-amber-400">{point.temperature.toFixed(1)}°C</td>
                          <td className="px-4 py-2">
                            <button
                              onClick={() => handleRemovePoint(point.time)}
                              className="p-1 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {points.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-slate-500 text-sm">
                            暂无录入数据，请添加或加载模板
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {hasSupplement && supplement ? (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
                      <div className="text-xs text-slate-500 mb-1">总数据点</div>
                      <div className="text-2xl font-semibold text-white font-mono">{statistics.totalPoints}</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
                      <div className="text-xs text-slate-500 mb-1">匹配数据点</div>
                      <div className="text-2xl font-semibold text-blue-400 font-mono">{statistics.matchedPoints}</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
                      <div className="text-xs text-slate-500 mb-1">显著差异点</div>
                      <div className={`text-2xl font-semibold font-mono ${
                        statistics.significantDiffs > 0 ? 'text-pink-400' : 'text-emerald-400'
                      }`}>
                        {statistics.significantDiffs}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
                      <div className="text-xs text-slate-500 mb-1">平均差异</div>
                      <div className={`text-xl font-semibold font-mono ${
                        statistics.avgDifference > 2 ? 'text-amber-400' : 'text-slate-300'
                      }`}>
                        {statistics.avgDifference > 0 ? '+' : ''}{statistics.avgDifference.toFixed(1)}°C
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
                      <div className="text-xs text-slate-500 mb-1">最大差异</div>
                      <div className="text-xl font-semibold text-red-400 font-mono">
                        +{statistics.maxDifference.toFixed(1)}°C
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
                      <div className="text-xs text-slate-500 mb-1">最小差异</div>
                      <div className="text-xl font-semibold text-blue-400 font-mono">
                        {statistics.minDifference.toFixed(1)}°C
                      </div>
                    </div>
                  </div>

                  <div className={`rounded-xl border p-4 flex items-center gap-3 ${
                    handleVerifyHash()
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                  }`}>
                    {handleVerifyHash() ? (
                      <>
                        <Check className="w-5 h-5 text-emerald-400" />
                        <span className="text-emerald-300 text-sm">数据完整性验证通过：补录数据未被篡改</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-red-400" />
                        <span className="text-red-300 text-sm">警告：补录数据哈希不匹配，可能已被修改</span>
                      </>
                    )}
                  </div>

                  <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-700">
                      <h4 className="text-sm font-medium text-slate-200">差异明细</h4>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-800 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">时间</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">原始值</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">补录值</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">差异</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                          {comparisonData.map((item) => (
                            <tr
                              key={item.time}
                              className={item.hasSignificantDiff ? 'bg-pink-500/5' : 'hover:bg-slate-700/30'}
                            >
                              <td className="px-4 py-2 font-mono text-slate-300">{item.time}</td>
                              <td className="px-4 py-2 font-mono text-blue-400">
                                {item.originalValue !== null ? `${item.originalValue.toFixed(1)}°C` : '-'}
                              </td>
                              <td className="px-4 py-2 font-mono text-amber-400">
                                {item.supplementValue !== null ? `${item.supplementValue.toFixed(1)}°C` : '-'}
                              </td>
                              <td className={`px-4 py-2 font-mono ${
                                item.difference === null
                                  ? 'text-slate-500'
                                  : item.hasSignificantDiff
                                  ? 'text-pink-400'
                                  : 'text-slate-400'
                              }`}>
                                {item.difference !== null
                                  ? `${item.difference > 0 ? '+' : ''}${item.difference.toFixed(1)}°C`
                                  : '-'
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>请先在"数据录入"标签页添加补录数据并保存</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            设备: <span className="text-slate-300">{selectedDevice}</span>
            {' | '}
            操作人: <span className="text-slate-300">小赵</span>
          </div>
          <div className="flex items-center gap-3">
            {hasSupplement && activeTab === 'compare' && (
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg border border-slate-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                导出补录数据
              </button>
            )}
            {activeTab === 'input' && (
              <button
                onClick={handleSave}
                disabled={points.length === 0}
                className="inline-flex items-center gap-2 px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                保存补录
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
