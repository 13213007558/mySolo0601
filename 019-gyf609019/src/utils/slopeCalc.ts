import type { MeasurePoint, Zone, SlopeResult, RiskLevel } from '@/types';

export function calculateSlopes(
  points: MeasurePoint[],
  zone: Zone
): SlopeResult[] {
  const results: SlopeResult[] = [];
  const pointMap = new Map<string, MeasurePoint>();
  points.forEach((p) => pointMap.set(`${p.row}-${p.col}`, p));

  for (let row = 0; row < zone.gridRows; row++) {
    for (let col = 0; col < zone.gridCols; col++) {
      const current = pointMap.get(`${row}-${col}`);
      if (!current || current.elevationMm === null) continue;

      if (col + 1 < zone.gridCols) {
        const right = pointMap.get(`${row}-${col + 1}`);
        if (right && right.elevationMm !== null) {
          const diff = Math.abs(current.elevationMm - right.elevationMm);
          const slopePercent = (diff / zone.gridSpacingMm) * 100;
          const riskLevel = getRiskLevel(slopePercent, zone.minSlopePercent);
          results.push({
            fromPoint: current.label,
            toPoint: right.label,
            slopePercent: Math.round(slopePercent * 100) / 100,
            direction: 'horizontal',
            riskLevel,
            involvesSupplemented: current.isSupplemented || right.isSupplemented,
          });
        }
      }

      if (row + 1 < zone.gridRows) {
        const below = pointMap.get(`${row + 1}-${col}`);
        if (below && below.elevationMm !== null) {
          const diff = Math.abs(current.elevationMm - below.elevationMm);
          const slopePercent = (diff / zone.gridSpacingMm) * 100;
          const riskLevel = getRiskLevel(slopePercent, zone.minSlopePercent);
          results.push({
            fromPoint: current.label,
            toPoint: below.label,
            slopePercent: Math.round(slopePercent * 100) / 100,
            direction: 'vertical',
            riskLevel,
            involvesSupplemented: current.isSupplemented || below.isSupplemented,
          });
        }
      }
    }
  }

  return results;
}

function getRiskLevel(slopePercent: number, minSlope: number): RiskLevel {
  if (slopePercent >= minSlope) return 'safe';
  if (slopePercent >= minSlope * 0.5) return 'warning';
  return 'critical';
}

export function getOverallRisk(slopes: SlopeResult[]): RiskLevel {
  if (slopes.some((s) => s.riskLevel === 'critical')) return 'critical';
  if (slopes.some((s) => s.riskLevel === 'warning')) return 'warning';
  if (slopes.length === 0) return 'warning';
  return 'safe';
}

export function getRiskLabel(level: RiskLevel): string {
  switch (level) {
    case 'safe': return '合格';
    case 'warning': return '偏低';
    case 'critical': return '严重不足';
  }
}

export function getDrainageArrow(direction: string): string {
  switch (direction) {
    case 'N': return '↑';
    case 'S': return '↓';
    case 'E': return '→';
    case 'W': return '←';
    case 'NE': return '↗';
    case 'NW': return '↖';
    case 'SE': return '↘';
    case 'SW': return '↙';
    default: return '→';
  }
}

export function getDrainageLabel(direction: string): string {
  switch (direction) {
    case 'N': return '北';
    case 'S': return '南';
    case 'E': return '东';
    case 'W': return '西';
    case 'NE': return '东北';
    case 'NW': return '西北';
    case 'SE': return '东南';
    case 'SW': return '西南';
    default: return direction;
  }
}

export function convertElevation(valueMm: number, unit: 'mm' | 'cm'): string {
  if (unit === 'cm') {
    return (valueMm / 10).toFixed(1);
  }
  return valueMm.toString();
}

export function getUnitLabel(unit: 'mm' | 'cm'): string {
  return unit === 'mm' ? '毫米' : '厘米';
}
