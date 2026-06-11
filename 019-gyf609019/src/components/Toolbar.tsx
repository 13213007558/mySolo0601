import { useAppStore } from '@/store/useAppStore';
import { Download, Filter, Ruler, Building2 } from 'lucide-react';
import { getUnitLabel } from '@/utils/slopeCalc';
import type { RiskLevel } from '@/types';

const riskOptions: { level: RiskLevel; label: string; color: string }[] = [
  { level: 'critical', label: '严重不足', color: 'bg-critical/10 text-critical border-critical/30' },
  { level: 'warning', label: '偏低', color: 'bg-warning/10 text-warning border-warning/30' },
  { level: 'safe', label: '合格', color: 'bg-safe/10 text-safe border-safe/30' },
];

export default function Toolbar() {
  const { zones, selectedZoneId, selectZone, unitMode, toggleUnit, filterRiskLevels, setFilterRiskLevels, setShowExportPanel } = useAppStore();

  const toggleRiskFilter = (level: RiskLevel) => {
    if (filterRiskLevels.includes(level)) {
      setFilterRiskLevels(filterRiskLevels.filter((l) => l !== level));
    } else {
      setFilterRiskLevels([...filterRiskLevels, level]);
    }
  };

  return (
    <header className="bg-navy-500 text-white shadow-lg">
      <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-amber-400" />
          <h1 className="text-lg font-bold tracking-wide">屋面找坡排查</h1>
        </div>

        <div className="h-6 w-px bg-navy-300/30" />

        <div className="flex items-center gap-2">
          <label className="text-xs text-navy-200 uppercase tracking-wider">分区</label>
          <select
            value={selectedZoneId || ''}
            onChange={(e) => selectZone(e.target.value)}
            className="bg-navy-600 border border-navy-400 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50"
          >
            {zones.map((z) => (
              <option key={z.id} value={z.id}>{z.name}</option>
            ))}
          </select>
        </div>

        <div className="h-6 w-px bg-navy-300/30" />

        <button
          onClick={toggleUnit}
          className="flex items-center gap-2 bg-navy-600 border border-navy-400 rounded-lg px-3 py-1.5 text-sm hover:bg-navy-700 transition-colors"
        >
          <Ruler className="w-4 h-4 text-amber-400" />
          <span>{getUnitLabel(unitMode)}</span>
          <span className="text-navy-300 text-xs">切换</span>
        </button>

        <div className="h-6 w-px bg-navy-300/30" />

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-navy-300" />
          <span className="text-xs text-navy-200 uppercase tracking-wider">风险</span>
          <div className="flex gap-1">
            {riskOptions.map((opt) => {
              const active = filterRiskLevels.includes(opt.level);
              return (
                <button
                  key={opt.level}
                  onClick={() => toggleRiskFilter(opt.level)}
                  className={`px-2 py-0.5 rounded text-xs border transition-all ${active ? opt.color : 'border-navy-400 text-navy-300 bg-navy-600'}`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1" />

        <button
          onClick={() => setShowExportPanel(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-navy-900 font-semibold rounded-lg px-4 py-1.5 text-sm transition-colors shadow-md"
        >
          <Download className="w-4 h-4" />
          导出摘要
        </button>
      </div>
    </header>
  );
}
