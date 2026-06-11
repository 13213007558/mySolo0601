import type { ThicknessStats, MeasurementPoint, GradingResult, Quadrant } from '@/types';

export function calcStats(points: MeasurementPoint[]): ThicknessStats {
  if (points.length === 0) {
    return { avg: 0, min: 0, max: 0, stdDev: 0, count: 0, thinCount: 0, coveredQuadrants: [] };
  }
  const thicknesses = points.map((p) => p.thickness);
  const avg = thicknesses.reduce((a, b) => a + b, 0) / thicknesses.length;
  const min = Math.min(...thicknesses);
  const max = Math.max(...thicknesses);
  const variance = thicknesses.reduce((sum, v) => sum + (v - avg) ** 2, 0) / thicknesses.length;
  const stdDev = Math.sqrt(variance);
  const thinCount = points.filter((p) => p.isThin).length;
  const coveredQuadrants = [...new Set(points.map((p) => p.quadrant))].sort() as Quadrant[];
  return { avg, min, max, stdDev, count: points.length, thinCount, coveredQuadrants };
}

export function isAnomalous(point: MeasurementPoint, stats: ThicknessStats): boolean {
  if (stats.count < 3) return false;
  return Math.abs(point.thickness - stats.avg) > 2 * stats.stdDev;
}

export function computeGrade(stats: ThicknessStats, requiredPoints: number = 8, requiredQuadrants: number = 3): GradingResult {
  if (stats.count < requiredPoints) {
    return { grade: null, canGrade: false, reason: `测点不足：需${requiredPoints}个，当前${stats.count}个` };
  }
  if (stats.coveredQuadrants.length < requiredQuadrants) {
    return { grade: null, canGrade: false, reason: `象限覆盖不足：需${requiredQuadrants}个象限，当前覆盖${stats.coveredQuadrants.length}个` };
  }
  let grade: GradingResult['grade'];
  if (stats.avg >= 2.0 && stats.thinCount === 0) {
    grade = 'AAA';
  } else if (stats.avg >= 1.8 && stats.thinCount <= 1) {
    grade = 'AA';
  } else if (stats.avg >= 1.5 && stats.thinCount <= 2) {
    grade = 'A';
  } else if (stats.avg >= 1.2) {
    grade = 'B';
  } else {
    grade = 'C';
  }
  return { grade, canGrade: true, reason: '' };
}

export function getQuadrant(x: number, y: number, cx: number, cy: number): Quadrant {
  if (x >= cx && y < cy) return 1;
  if (x < cx && y < cy) return 2;
  if (x < cx && y >= cy) return 3;
  return 4;
}
