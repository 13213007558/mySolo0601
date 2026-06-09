import type { DiffResult } from '@/utils/diff';
import { Plus, Minus, ArrowRightLeft } from 'lucide-react';

interface DiffViewerProps {
  diffs: DiffResult[];
  title?: string;
}

export const DiffViewer = ({ diffs, title = '差异对比' }: DiffViewerProps) => {
  if (diffs.length === 0) {
    return (
      <div className="p-4 bg-industrial-bg rounded text-center text-industrial-textMuted">
        暂无差异
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-sm font-medium text-industrial-text mb-3">{title}</h4>
      <div className="space-y-2">
        {diffs.map((diff, index) => (
          <div
            key={`${diff.field}-${index}`}
            className={`p-3 rounded border text-sm animate-fadeIn ${
              diff.type === 'added'
                ? 'bg-green-900/20 border-green-700/50'
                : diff.type === 'removed'
                ? 'bg-red-900/20 border-red-700/50'
                : 'bg-yellow-900/20 border-yellow-700/50'
            }`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="flex items-center gap-2 mb-1">
              {diff.type === 'added' && <Plus className="w-4 h-4 text-green-400" />}
              {diff.type === 'removed' && <Minus className="w-4 h-4 text-red-400" />}
              {diff.type === 'modified' && <ArrowRightLeft className="w-4 h-4 text-yellow-400" />}
              <span className="font-medium text-industrial-text">{diff.field}</span>
            </div>
            <div className="pl-6">
              {diff.type === 'added' && (
                <span className="text-green-400">+ "{diff.newValue}"</span>
              )}
              {diff.type === 'removed' && (
                <span className="text-red-400 line-through">- "{diff.oldValue}"</span>
              )}
              {diff.type === 'modified' && (
                <div className="space-y-1">
                  <div className="text-red-400 line-through">- "{diff.oldValue}"</div>
                  <div className="text-green-400">+ "{diff.newValue}"</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
