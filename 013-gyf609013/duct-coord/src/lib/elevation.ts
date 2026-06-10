import type { ElevationUnit } from './types';

export function mmToM(mm: number): number {
  return mm / 1000;
}

export function mToMm(m: number): number {
  return Math.round(m * 1000);
}

export function formatElevation(mm: number, unit: ElevationUnit = 'mm'): string {
  if (unit === 'm') {
    const m = mmToM(mm);
    return m >= 0 ? `+${m.toFixed(3)}m` : `${m.toFixed(3)}m`;
  }
  return mm >= 0 ? `+${mm}mm` : `${mm}mm`;
}

export function formatElevationDiff(oldMm: number, newMm: number, unit: ElevationUnit = 'mm'): string {
  const diff = newMm - oldMm;
  if (diff === 0) return '无变化';
  if (unit === 'm') {
    const dm = diff / 1000;
    return dm > 0 ? `↑${dm.toFixed(3)}m` : `↓${Math.abs(dm).toFixed(3)}m`;
  }
  return diff > 0 ? `↑${diff}mm` : `↓${Math.abs(diff)}mm`;
}

export function parseElevationInput(value: string): number | null {
  const cleaned = value.replace(/[+\s]/g, '').replace(/m$/i, '');
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;
  if (/m$/i.test(value.trim())) {
    return mToMm(num);
  }
  return Math.round(num);
}

export function validateElevation(mm: number, floorRef: string): { valid: boolean; warning?: string } {
  if (!floorRef || floorRef.trim() === '') {
    return { valid: false, warning: '楼层参考为空，无法验证标高' };
  }
  const floorMatch = floorRef.match(/([BF])(\d+)/i);
  if (!floorMatch) {
    return { valid: true, warning: '楼层格式非标准，标高未做范围校验' };
  }
  const isBasement = floorMatch[1].toUpperCase() === 'B';
  const floorNum = parseInt(floorMatch[2]);

  if (isBasement) {
    const expectedMax = floorNum * (-3000);
    if (mm > 0) {
      return { valid: true, warning: `地下${floorNum}层标高为正值(${formatElevation(mm)})，请确认` };
    }
  } else {
    const expectedMin = (floorNum - 1) * 3000;
    if (mm < expectedMin - 2000) {
      return { valid: true, warning: `地上${floorNum}层标高${formatElevation(mm)}偏低，请确认` };
    }
    if (mm < 0) {
      return { valid: true, warning: `地上楼层标高为负值(${formatElevation(mm)})，请确认` };
    }
  }
  return { valid: true };
}
