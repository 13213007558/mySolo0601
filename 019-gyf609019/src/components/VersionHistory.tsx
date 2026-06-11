import { useAppStore } from '@/store/useAppStore';
import { GitCompare, X } from 'lucide-react';

export default function VersionHistory() {
  const {
    suggestionVersions,
    comparingVersions,
    compareVersionA,
    compareVersionB,
    setComparingVersions,
    setCompareVersions,
  } = useAppStore();

  if (suggestionVersions.length === 0) return null;

  const handleSelectForCompare = (version: typeof suggestionVersions[0]) => {
    if (!compareVersionA) {
      setCompareVersions(version, null);
    } else if (!compareVersionB) {
      setCompareVersions(compareVersionA, version);
    } else {
      setCompareVersions(version, null);
    }
  };

  const getDiffLines = (a: string, b: string) => {
    const linesA = a.split('\n');
    const linesB = b.split('\n');
    const maxLen = Math.max(linesA.length, linesB.length);
    const result: { lineA: string; lineB: string; changed: boolean }[] = [];
    for (let i = 0; i < maxLen; i++) {
      const lineA = linesA[i] || '';
      const lineB = linesB[i] || '';
      result.push({ lineA, lineB, changed: lineA !== lineB });
    }
    return result;
  };

  return (
    <div className="border-t border-steel-200">
      <div className="px-5 py-3 border-b border-steel-100 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-steel-500 uppercase tracking-wider">版本历史</h3>
        {comparingVersions && (
          <button
            onClick={() => { setComparingVersions(false); setCompareVersions(null, null); }}
            className="flex items-center gap-1 text-xs text-steel-500 hover:text-navy-500"
          >
            <X className="w-3 h-3" />
            退出比较
          </button>
        )}
      </div>

      <div className="p-5">
        {comparingVersions && compareVersionA && compareVersionB ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-steel-500 mb-3">
              <GitCompare className="w-4 h-4" />
              <span>v{compareVersionA.versionNumber} → v{compareVersionB.versionNumber} 差异对比</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs font-semibold text-steel-400 mb-1">
                  v{compareVersionA.versionNumber} · {new Date(compareVersionA.createdAt).toLocaleDateString('zh-CN')}
                </div>
                <div className="bg-steel-50 rounded-lg p-3 text-xs text-navy-700 whitespace-pre-wrap border border-steel-100">
                  {compareVersionA.content}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-steel-400 mb-1">
                  v{compareVersionB.versionNumber} · {new Date(compareVersionB.createdAt).toLocaleDateString('zh-CN')}
                </div>
                <div className="bg-steel-50 rounded-lg p-3 text-xs text-navy-700 whitespace-pre-wrap border border-steel-100">
                  {compareVersionB.content}
                </div>
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xs font-semibold text-steel-400 mb-2">变更明细</div>
              <div className="space-y-0.5 font-mono text-xs">
                {getDiffLines(compareVersionA.content, compareVersionB.content).map((line, i) => (
                  <div key={i} className={`flex gap-2 ${line.changed ? 'bg-amber-50' : ''}`}>
                    <span className="w-6 text-right text-steel-300 select-none">{i + 1}</span>
                    <span className={line.changed ? 'text-navy-700 font-medium' : 'text-steel-400'}>{line.lineA}</span>
                    <span className="text-steel-300">→</span>
                    <span className={line.changed ? 'text-navy-700 font-medium' : 'text-steel-400'}>{line.lineB}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {comparingVersions && (
              <div className="text-xs text-amber-600 bg-amber-50 rounded px-3 py-1.5 mb-2">
                请选择两个版本进行比较（已选：{compareVersionA ? `v${compareVersionA.versionNumber}` : '无'}）
              </div>
            )}
            <div className="relative">
              <div className="absolute left-[11px] top-3 bottom-3 w-px bg-steel-200" />
              {suggestionVersions.slice().reverse().map((v, idx) => {
                const isSelected = compareVersionA?.id === v.id || compareVersionB?.id === v.id;
                return (
                  <div key={v.id} className="flex items-start gap-3 relative">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 mt-0.5 ${
                      isSelected ? 'bg-navy-500 border-navy-500' : 'bg-white border-steel-300'
                    }`}>
                      <span className={`text-[9px] font-bold ${isSelected ? 'text-white' : 'text-steel-400'}`}>
                        v{v.versionNumber}
                      </span>
                    </div>
                    <div
                      className={`flex-1 rounded-lg border p-3 cursor-pointer transition-all mb-2 ${
                        isSelected ? 'border-navy-400 bg-navy-50' : 'border-steel-100 bg-steel-50 hover:border-steel-300'
                      } ${comparingVersions ? 'hover:shadow-sm' : ''}`}
                      onClick={() => comparingVersions && handleSelectForCompare(v)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-navy-600">v{v.versionNumber}</span>
                        <span className="text-xs text-steel-400">
                          {new Date(v.createdAt).toLocaleString('zh-CN')}
                        </span>
                        <span className="text-xs text-steel-400">·</span>
                        <span className="text-xs text-steel-500">{v.changeNote}</span>
                      </div>
                      <p className="text-xs text-navy-600 line-clamp-2 whitespace-pre-wrap">{v.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
