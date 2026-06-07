import { FileWarning, Database, Stethoscope, Plus, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  state: 'empty' | 'dirty' | 'clean';
  dirtyCount?: number;
  emptyCount?: number;
  children: ReactNode;
  onAddClick?: () => void;
}

export default function TriStateContainer({ state, dirtyCount = 0, emptyCount = 0, children, onAddClick }: Props) {
  if (state === 'empty') {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-dissolve">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-medical-100 to-warm-100 flex items-center justify-center mb-6 shadow-soft">
          <Database className="w-12 h-12 text-medical-400" />
        </div>
        <h2 className="font-serif text-2xl font-semibold text-medical-800 mb-2">暂无晨检数据</h2>
        <p className="text-medical-500 mb-8 text-sm max-w-sm text-center">
          当前筛选条件下没有晨检记录，请尝试调整筛选条件或新增晨检记录。
        </p>
        <button
          onClick={onAddClick}
          className="px-6 py-3 rounded-xl bg-medical-500 text-white font-medium shadow-inset-medical hover:bg-medical-600 transition-all flex items-center gap-2 hover:shadow-card"
        >
          <Plus className="w-5 h-5" />
          新增晨检记录
        </button>
      </div>
    );
  }

  if (state === 'dirty' && dirtyCount > 0) {
    return (
      <div className="animate-dissolve">
        <div className="mb-5 rounded-2xl bg-gradient-to-r from-warm-50 to-warm-100 border border-warm-200 p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-warm-200 flex items-center justify-center flex-shrink-0">
            <FileWarning className="w-6 h-6 text-warm-700" />
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-base font-semibold text-warm-800 flex items-center gap-2">
              数据质量告警
              <span className="w-2 h-2 rounded-full bg-warm-500 animate-pulse-dot" />
            </h3>
            <p className="text-sm text-warm-700 mt-0.5">
              检测到 <strong className="text-warm-800">{dirtyCount}</strong> 条脏数据、
              <strong className="text-warm-800">{emptyCount}</strong> 条空数据，请及时复核修复，确保月底复盘数据口径一致。
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-warm-600" />
            <span className="text-xs font-medium text-warm-700">待清洗</span>
          </div>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="animate-dissolve">
      <div className="mb-5 rounded-2xl bg-gradient-to-r from-medical-50 to-medical-100/50 border border-medical-200 p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-medical-500 flex items-center justify-center flex-shrink-0 shadow-inset-medical">
          <Stethoscope className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-serif text-base font-semibold text-medical-800">晨检数据概览</h3>
          <p className="text-sm text-medical-600 mt-0.5">数据质量良好，可通过追溯链查看原始体温枪记录与请假条凭证。</p>
        </div>
      </div>
      {children}
    </div>
  );
}
