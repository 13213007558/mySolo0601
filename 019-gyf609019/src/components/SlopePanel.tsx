import { useAppStore } from '@/store/useAppStore';
import { getRiskLabel, getDrainageArrow, getDrainageLabel, getOverallRisk } from '@/utils/slopeCalc';
import { ArrowRight, ArrowDown, AlertTriangle, CheckCircle2, XCircle, Compass } from 'lucide-react';

export default function SlopePanel() {
  const { zones, selectedZoneId, slopes, filterRiskLevels } = useAppStore();
  const zone = zones.find((z) => z.id === selectedZoneId);
  if (!zone) return null;

  const filteredSlopes = filterRiskLevels.length > 0
    ? slopes.filter((s) => filterRiskLevels.includes(s.riskLevel))
    : slopes;

  const overallRisk = getOverallRisk(slopes);

  const riskIcon = (level: string) => {
    switch (level) {
      case 'safe': return <CheckCircle2 className="w-4 h-4 text-safe" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'critical': return <XCircle className="w-4 h-4 text-critical" />;
      default: return null;
    }
  };

  const riskBg = (level: string) => {
    switch (level) {
      case 'safe': return 'bg-safe/5 border-safe/20';
      case 'warning': return 'bg-warning/5 border-warning/20';
      case 'critical': return 'bg-critical/5 border-critical/20';
      default: return 'bg-steel-50 border-steel-200';
    }
  };

  const stats = {
    critical: slopes.filter((s) => s.riskLevel === 'critical').length,
    warning: slopes.filter((s) => s.riskLevel === 'warning').length,
    safe: slopes.filter((s) => s.riskLevel === 'safe').length,
    total: slopes.length,
  };

  return (
    <div className="bg-white rounded-xl border border-steel-200 shadow-sm">
      <div className="px-5 py-3 border-b border-steel-200">
        <h2 className="text-sm font-semibold text-navy-500 uppercase tracking-wider">排水坡度分析</h2>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-steel-100">
          <div className="flex items-center gap-2 bg-navy-50 rounded-lg px-3 py-2">
            <Compass className="w-4 h-4 text-navy-400" />
            <span className="text-xs text-navy-400">排水方向</span>
            <span className="text-lg font-bold text-navy-600">{getDrainageArrow(zone.drainageDirection)}</span>
            <span className="text-sm text-navy-500">{getDrainageLabel(zone.drainageDirection)}</span>
          </div>
          <div className="flex items-center gap-2 bg-steel-50 rounded-lg px-3 py-2">
            <span className="text-xs text-steel-400">最低坡度</span>
            <span className="font-mono text-lg font-bold text-navy-600">{zone.minSlopePercent}%</span>
          </div>
          <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
            overallRisk === 'safe' ? 'bg-safe/10' : overallRisk === 'warning' ? 'bg-warning/10' : 'bg-critical/10'
          }`}>
            <span className="text-xs text-steel-500">综合风险</span>
            <span className={`text-sm font-bold ${
              overallRisk === 'safe' ? 'text-safe' : overallRisk === 'warning' ? 'text-warning' : 'text-critical'
            }`}>
              {getRiskLabel(overallRisk)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 rounded-lg bg-critical/5">
            <div className="font-mono text-xl font-bold text-critical">{stats.critical}</div>
            <div className="text-xs text-steel-400">严重不足</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-warning/5">
            <div className="font-mono text-xl font-bold text-warning">{stats.warning}</div>
            <div className="text-xs text-steel-400">偏低</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-safe/5">
            <div className="font-mono text-xl font-bold text-safe">{stats.safe}</div>
            <div className="text-xs text-steel-400">合格</div>
          </div>
        </div>

        <div className="space-y-2 max-h-[320px] overflow-y-auto scrollbar-thin">
          {filteredSlopes.length === 0 && (
            <div className="text-center text-steel-400 text-sm py-4">无匹配坡度数据</div>
          )}
          {filteredSlopes.map((slope, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${riskBg(slope.riskLevel)}`}
            >
              {riskIcon(slope.riskLevel)}
              <div className="flex items-center gap-1 text-sm">
                <span className="font-mono font-semibold text-navy-600">{slope.fromPoint}</span>
                {slope.direction === 'horizontal' ? (
                  <ArrowRight className="w-4 h-4 text-steel-400" />
                ) : (
                  <ArrowDown className="w-4 h-4 text-steel-400" />
                )}
                <span className="font-mono font-semibold text-navy-600">{slope.toPoint}</span>
              </div>
              <div className="flex-1" />
              <span className="font-mono text-sm font-bold text-navy-700">{slope.slopePercent}%</span>
              <span className={`text-xs font-medium ${
                slope.riskLevel === 'safe' ? 'text-safe' : slope.riskLevel === 'warning' ? 'text-warning' : 'text-critical'
              }`}>
                {getRiskLabel(slope.riskLevel)}
              </span>
              {slope.involvesSupplemented && (
                <span className="text-[10px] bg-warning/20 text-warning px-1.5 py-0.5 rounded font-medium">含补录</span>
              )}
              {slope.riskLevel !== 'safe' && (
                <span className="text-[10px] text-steel-400">
                  需≥{zone.minSlopePercent}%
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
