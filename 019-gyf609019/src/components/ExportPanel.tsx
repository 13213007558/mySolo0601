import { useAppStore } from '@/store/useAppStore';
import { generateExportHtml, downloadHtml } from '@/utils/exportUtils';
import { X, FileDown, Eye } from 'lucide-react';
import { useState } from 'react';

export default function ExportPanel() {
  const { showExportPanel, setShowExportPanel, zones, selectedZoneId, measurePoints, slopes, evidences, suggestion, suggestionVersions, filterRiskLevels } = useAppStore();
  const [preview, setPreview] = useState<string | null>(null);

  if (!showExportPanel) return null;

  const zone = zones.find((z) => z.id === selectedZoneId);
  if (!zone) return null;

  const handleExport = () => {
    const html = generateExportHtml({
      zone,
      points: measurePoints,
      slopes,
      evidences,
      suggestion,
      versions: suggestionVersions,
      filteredRiskLevels: filterRiskLevels,
    });
    downloadHtml(html, `找坡排查摘要-${zone.name}-${new Date().toLocaleDateString('zh-CN')}.html`);
    setShowExportPanel(false);
  };

  const handlePreview = () => {
    const html = generateExportHtml({
      zone,
      points: measurePoints,
      slopes,
      evidences,
      suggestion,
      versions: suggestionVersions,
      filteredRiskLevels: filterRiskLevels,
    });
    setPreview(html);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-slide-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-steel-200">
          <h2 className="text-base font-bold text-navy-500">导出排查摘要</h2>
          <button
            onClick={() => { setShowExportPanel(false); setPreview(null); }}
            className="text-steel-400 hover:text-navy-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="bg-steel-50 rounded-lg p-4 text-sm text-navy-700">
            <div className="font-semibold mb-2">导出内容包含：</div>
            <ul className="space-y-1 text-steel-600 text-xs">
              <li>• 分区：{zone.name}</li>
              <li>• 测点数量：{measurePoints.length} 个（含 {measurePoints.filter((p) => p.elevationMm === null).length} 个未录入）</li>
              <li>• 坡度分析：{slopes.length} 条{filterRiskLevels.length > 0 ? `（筛选：${filterRiskLevels.join('、')}）` : '（全部）'}</li>
              <li>• 雨后证据：{evidences.length} 条</li>
              <li>• 返工建议：{suggestion ? `v${suggestionVersions.length}` : '无'}</li>
              {filterRiskLevels.length > 0 && (
                <li className="text-warning font-medium">⚠ 当前筛选条件已生效，仅导出匹配项</li>
              )}
            </ul>
          </div>

          <div className="bg-amber-50 rounded-lg p-3 text-xs text-amber-700 border border-amber-200">
            提示：导出文档中测点编号可点击跳转到对应位置，方便项目经理回溯原始数据。筛选条件变化时导出内容自动更新。
          </div>

          {preview && (
            <div className="border border-steel-200 rounded-lg overflow-hidden">
              <div className="bg-steel-50 px-3 py-1.5 text-xs text-steel-400 border-b border-steel-200">预览</div>
              <iframe
                srcDoc={preview}
                className="w-full h-48"
                title="导出预览"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-steel-200 bg-steel-50 rounded-b-2xl">
          <button
            onClick={handlePreview}
            className="flex items-center gap-1.5 text-sm text-steel-600 hover:text-navy-500 px-4 py-2 rounded-lg border border-steel-200 hover:border-navy-300 transition-colors"
          >
            <Eye className="w-4 h-4" />
            预览
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 text-sm bg-amber-500 text-navy-900 font-semibold px-5 py-2 rounded-lg hover:bg-amber-600 transition-colors shadow-md"
          >
            <FileDown className="w-4 h-4" />
            下载 HTML
          </button>
        </div>
      </div>
    </div>
  );
}
