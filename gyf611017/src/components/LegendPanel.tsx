import React from 'react';
import { useStoneStore, usePlotStore } from '@/store/useStoneStore';
import { INCLUSION_TYPES, getInclusionConfig } from '@/config/inclusionTypes';
import { InclusionIcon } from './InclusionIcon';
import { Palette, CheckCircle } from 'lucide-react';

interface LegendPanelProps {
  className?: string;
}

export const LegendPanel: React.FC<LegendPanelProps> = ({ className = '' }) => {
  const { getCurrentStone } = useStoneStore();
  const { currentInclusionType, setCurrentInclusionType } = usePlotStore();
  const stone = getCurrentStone();
  const isReadOnly = stone?.status === 'submitted';

  const getTypeCount = (type: string) => {
    if (!stone) return 0;
    return stone.inclusions.filter(inc => inc.type === type).length;
  };

  const getRequiredForType = (type: string): number => {
    if (!stone?.report?.clarityCharacteristics) return 0;
    const typeMap: Record<string, string> = {
      crystal: 'Crystal',
      feather: 'Feather',
      cloud: 'Cloud',
      needle: 'Needle',
      cavity: 'Cavity',
      chip: 'Chip',
      cleavage: 'Cleavage',
      grain_center: 'Grain Center',
    };
    const englishName = typeMap[type] || '';
    const count = stone.report.clarityCharacteristics.filter(c => c.toLowerCase() === englishName.toLowerCase()).length;
    return count > 0 ? 1 : 0;
  };

  return (
    <div className={`bs-card p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Palette size={18} className="text-diamond-gold" />
          <h3 className="font-display text-lg font-semibold text-diamond-cream">内含物图例</h3>
        </div>
        {!isReadOnly && (
          <span className="text-xs text-slate-400">点击选择当前类型</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {INCLUSION_TYPES.map((cfg) => {
          const count = getTypeCount(cfg.type);
          const required = getRequiredForType(cfg.type);
          const isFulfilled = count >= required;
          const isSelected = currentInclusionType === cfg.type;

          return (
            <button
              key={cfg.type}
              type="button"
              disabled={isReadOnly}
              onClick={() => setCurrentInclusionType(cfg.type)}
              className={`
                relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 text-left
                ${isReadOnly ? 'cursor-default opacity-75' : 'cursor-pointer hover:-translate-y-0.5'}
                ${isSelected && !isReadOnly
                  ? 'border-diamond-gold bg-diamond-gold/10 shadow-lg shadow-diamond-gold/20'
                  : 'border-slate-700/50 bg-slate-800/40 hover:border-slate-600'
                }
              `}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${cfg.color}15`, border: `1.5px solid ${cfg.color}40` }}
              >
                <InclusionIcon type={cfg.type} size={22} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-sm font-semibold truncate ${isSelected ? 'text-diamond-gold' : 'text-diamond-cream'}`}>
                    {cfg.name}
                  </span>
                  {isFulfilled && required > 0 && (
                    <CheckCircle size={12} className="text-emerald-400 flex-shrink-0" />
                  )}
                </div>
                <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">
                  {cfg.nameEn}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span
                    className={`text-xs font-bold ${count > 0 ? '' : 'text-slate-600'}`}
                    style={{ color: count > 0 ? cfg.color : undefined }}
                  >
                    {count}
                  </span>
                  {required > 0 && (
                    <>
                      <span className="text-slate-600 text-xs">/</span>
                      <span className="text-xs text-slate-500">{required}需</span>
                    </>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700/50">
        <div className="text-xs text-slate-400 mb-2 font-medium">操作提示</div>
        <ul className="space-y-1.5 text-xs text-slate-500">
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-diamond-gold mt-1.5 flex-shrink-0" />
            左键点击画布空白处放置标记
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-diamond-gold mt-1.5 flex-shrink-0" />
            选中后拖拽可调整标记位置
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-diamond-gold mt-1.5 flex-shrink-0" />
            右键点击标记可删除
          </li>
        </ul>
      </div>
    </div>
  );
};

export { getInclusionConfig };
