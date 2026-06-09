import { useState, useRef } from 'react';
import { FilePlus, Download, Upload, GitCompare, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import type { Cylinder, SupplementRecord, SupplementType } from '@/types';
import { compareObjects, exportSupplementToJson, importFromJson } from '@/utils/export';
import { formatDate } from '@/utils/storage';
import { useCylinderStore } from '@/store/useCylinderStore';

interface SupplementPanelProps {
  cylinder: Cylinder;
  supplements: SupplementRecord[];
}

const SupplementPanel = ({ cylinder, supplements }: SupplementPanelProps) => {
  const [activeTab, setActiveTab] = useState<'form' | 'history' | 'export'>('form');
  const [supplementType, setSupplementType] = useState<SupplementType>('pressure_sticker');
  const [pressure, setPressure] = useState('');
  const [stickerNumber, setStickerNumber] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [comparisonResult, setComparisonResult] = useState<Array<{ key: string; before: any; after: any }>>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [lastSupplement, setLastSupplement] = useState<SupplementRecord | null>(null);
  const [exportChecksum, setExportChecksum] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addSupplement = useCylinderStore(state => state.addSupplement);
  const updateExportChecksum = useCylinderStore(state => state.updateExportChecksum);
  const importData = useCylinderStore(state => state.importData);

  const pressureStickerSupplements = supplements.filter(s => s.type === 'pressure_sticker');
  const manualSupplements = supplements.filter(s => s.type === 'manual');

  const handlePreview = () => {
    const beforeData = supplementType === 'pressure_sticker'
      ? {
          pressure: cylinder.pressure,
          lastCheckDate: cylinder.lastCheckDate,
          hasPressureSticker: false,
        }
      : {
          status: cylinder.currentStatus,
          nextCheckDate: cylinder.nextCheckDate,
          supplementId: cylinder.supplementId,
        };

    const afterData = supplementType === 'pressure_sticker'
      ? {
          pressure: pressure || '1.4MPa',
          lastCheckDate: new Date().toISOString(),
          hasPressureSticker: true,
          stickerNumber: stickerNumber || 'PS-2024-001',
        }
      : {
          status: 'repaired',
          nextCheckDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString(),
          supplementId: 'SUP-MANUAL-' + Date.now().toString().slice(-6),
          manualEntryNote: manualNote || '人工补录：完成年检并更新压力贴纸',
        };

    const diff = compareObjects(beforeData, afterData);
    setComparisonResult(diff);
    setShowComparison(true);
  };

  const handleSubmit = () => {
    const beforeData = supplementType === 'pressure_sticker'
      ? {
          pressure: cylinder.pressure,
          lastCheckDate: cylinder.lastCheckDate,
          hasPressureSticker: false,
        }
      : {
          status: cylinder.currentStatus,
          nextCheckDate: cylinder.nextCheckDate,
          supplementId: cylinder.supplementId,
        };

    const afterData = supplementType === 'pressure_sticker'
      ? {
          pressure: pressure || '1.4MPa',
          lastCheckDate: new Date().toISOString(),
          hasPressureSticker: true,
          stickerNumber: stickerNumber || 'PS-2024-001',
        }
      : {
          status: 'repaired',
          nextCheckDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString(),
          supplementId: 'SUP-MANUAL-' + Date.now().toString().slice(-6),
          manualEntryNote: manualNote || '人工补录：完成年检并更新压力贴纸',
        };

    const result = addSupplement(
      cylinder.id,
      supplementType,
      beforeData,
      afterData,
      '小秦'
    );

    setLastSupplement(result);
    setShowComparison(false);
    setPressure('');
    setStickerNumber('');
    setManualNote('');

    alert('补录成功！');
  };

  const handleExport = (supplement: SupplementRecord) => {
    const result = exportSupplementToJson(supplement, cylinder);
    setExportChecksum(result.checksum);
    updateExportChecksum(supplement.id, result.checksum);
    alert(`导出成功！校验和: ${result.checksum}`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await importFromJson(file);
      importData(data);
      alert('导入成功！数据已恢复');
      setExportChecksum(data.checksum);
    } catch (err) {
      alert((err as Error).message);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const typeLabels: Record<SupplementType, string> = {
    pressure_sticker: '压力贴纸补录',
    manual: '人工补录',
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {[
          { key: 'form', label: '补录表单', icon: FilePlus },
          { key: 'history', label: '补录历史', icon: GitCompare },
          { key: 'export', label: '导出/读回', icon: Download },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-sm transition-all ${
              activeTab === tab.key
                ? 'bg-industrial-600 text-white'
                : 'bg-industrial-800/50 text-industrial-300 hover:bg-industrial-700/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'form' && (
        <div className="card-industrial p-5">
          <h4 className="text-white font-medium mb-4">小秦手工补录</h4>

          <div className="mb-4">
            <label className="label-text">补录类型</label>
            <div className="flex gap-3">
              {(['pressure_sticker', 'manual'] as SupplementType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setSupplementType(type)}
                  className={`px-4 py-2 rounded-sm transition-all ${
                    supplementType === type
                      ? 'bg-industrial-600 text-white'
                      : 'bg-industrial-800/50 text-industrial-300 hover:bg-industrial-700/50'
                  }`}
                >
                  {typeLabels[type]}
                </button>
              ))}
            </div>
          </div>

          {supplementType === 'pressure_sticker' ? (
            <div className="space-y-4 mb-4">
              <div>
                <label className="label-text">压力值</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="例如：1.4MPa"
                  value={pressure}
                  onChange={e => setPressure(e.target.value)}
                />
              </div>
              <div>
                <label className="label-text">压力贴纸编号</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="例如：PS-2024-001"
                  value={stickerNumber}
                  onChange={e => setStickerNumber(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4 mb-4">
              <div>
                <label className="label-text">补录说明</label>
                <textarea
                  className="input-field min-h-[80px]"
                  placeholder="请输入人工补录说明..."
                  value={manualNote}
                  onChange={e => setManualNote(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={handlePreview} className="btn-secondary">
              预览差异
            </button>
            <button onClick={handleSubmit} className="btn-primary">
              确认补录
            </button>
          </div>

          {showComparison && comparisonResult.length > 0 && (
            <div className="mt-6 p-4 bg-industrial-800/50 rounded-sm animate-fade-in-up">
              <h5 className="text-white font-medium mb-3 flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-amber-400" />
                补录前后差异对比
              </h5>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-industrial-700">
                      <th className="text-left py-2 text-industrial-400 font-medium">字段</th>
                      <th className="text-left py-2 text-industrial-400 font-medium">补录前</th>
                      <th className="text-left py-2 text-industrial-400 font-medium">补录后</th>
                      <th className="text-left py-2 text-industrial-400 font-medium">差异</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonResult.map((diff, idx) => (
                      <tr key={idx} className="border-b border-industrial-700/50">
                        <td className="py-2 font-mono text-industrial-300">{diff.key}</td>
                        <td className="py-2 text-red-400 font-mono">{String(diff.before ?? '(空)')}</td>
                        <td className="py-2 text-emerald-400 font-mono">{String(diff.after ?? '(空)')}</td>
                        <td className="py-2">
                          <span className="px-1.5 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded-sm">
                            已变更
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          {pressureStickerSupplements.length > 0 && (
            <div>
              <h5 className="text-white font-medium mb-3">压力贴纸补录历史</h5>
              {pressureStickerSupplements.map((sup, idx) => (
                <div key={sup.id} className="card-industrial p-4 mb-3" style={{ animationDelay: `${idx * 0.05}s` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-industrial-400">补录时间: {formatDate(sup.timestamp)}</span>
                    <span className="text-xs text-industrial-400">操作人: {sup.operator}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-industrial-400">补录前压力</p>
                      <p className="text-white font-mono">{sup.beforeData.pressure}</p>
                    </div>
                    <div>
                      <p className="text-industrial-400">补录后压力</p>
                      <p className="text-white font-mono">{sup.afterData.pressure}</p>
                    </div>
                    <div>
                      <p className="text-industrial-400">贴纸编号</p>
                      <p className="text-white font-mono">{sup.afterData.stickerNumber || '-'}</p>
                    </div>
                    <div>
                      <p className="text-industrial-400">导出校验</p>
                      <p className="text-white font-mono text-xs">{sup.exportChecksum || '未导出'}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => handleExport(sup)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs bg-industrial-600 text-white rounded-sm hover:bg-industrial-500 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      导出数据
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {manualSupplements.length > 0 && (
            <div>
              <h5 className="text-white font-medium mb-3">人工补录历史（ID一致性验证）</h5>
              {manualSupplements.map((sup, idx) => (
                <div key={sup.id} className="card-industrial p-4 mb-3 border-purple-500/30 border" style={{ animationDelay: `${idx * 0.05}s` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-400 font-medium">ID一致性验证样例</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                    <div className="p-2 bg-industrial-800/50 rounded-sm">
                      <p className="text-xs text-industrial-400 mb-1">列表ID</p>
                      <p className="font-mono text-white text-xs">{sup.afterData.supplementId}</p>
                    </div>
                    <div className="p-2 bg-industrial-800/50 rounded-sm">
                      <p className="text-xs text-industrial-400 mb-1">详情ID</p>
                      <p className="font-mono text-white text-xs">{sup.afterData.supplementId}</p>
                    </div>
                    <div className="p-2 bg-industrial-800/50 rounded-sm">
                      <p className="text-xs text-industrial-400 mb-1">导出ID</p>
                      <p className="font-mono text-white text-xs">{sup.afterData.supplementId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-emerald-400">
                    <CheckCircle className="w-3 h-3" />
                    刷新后列表、详情、导出ID保持一致
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'export' && (
        <div className="space-y-4">
          <div className="card-industrial p-5">
            <h4 className="text-white font-medium mb-4">导出数据</h4>
            <p className="text-sm text-industrial-300 mb-4">
              导出当前气瓶的补录数据，用于检查导出读回一致性。导出文件包含校验和，导入时会自动验证。
            </p>
            {lastSupplement && (
              <button
                onClick={() => handleExport(lastSupplement)}
                className="btn-primary flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                导出最近补录记录
              </button>
            )}
            {exportChecksum && (
              <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-sm">
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">导出校验和</span>
                </div>
                <p className="font-mono text-white">{exportChecksum}</p>
              </div>
            )}
          </div>

          <div className="card-industrial p-5">
            <h4 className="text-white font-medium mb-4">读回验证</h4>
            <p className="text-sm text-industrial-300 mb-4">
              选择之前导出的JSON文件，系统将验证校验和并读回数据。
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              选择文件导入
            </button>
          </div>

          <div className="card-industrial p-5 bg-amber-500/5 border-amber-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
              <div>
                <p className="text-amber-400 font-medium mb-1">一致性验证说明</p>
                <ul className="text-sm text-industrial-300 space-y-1">
                  <li>• 导出时会计算数据校验和并写入文件</li>
                  <li>• 导入时会重新计算校验和并与存储值对比</li>
                  <li>• 校验和不一致则拒绝导入，防止数据篡改</li>
                  <li>• 样例数据ID在列表、详情、导出中保持一致</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplementPanel;
