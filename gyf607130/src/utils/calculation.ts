import { ForecastRecord } from '../types';

export const calculateDeviation = (forecast: number, actual: number): number => {
  if (forecast === 0) return 0;
  return Number(((actual - forecast) / forecast * 100).toFixed(2));
};

export const formatNumber = (num: number | undefined | null, decimals: number = 2): string => {
  if (num === undefined || num === null) return '--';
  return num.toFixed(decimals);
};

export const formatDeviation = (rate: number): { text: string; color: string } => {
  const absRate = Math.abs(rate);
  let color = 'text-green-600';
  if (absRate > 5) color = 'text-red-600';
  else if (absRate > 3) color = 'text-orange-600';
  
  const prefix = rate > 0 ? '+' : '';
  return { text: `${prefix}${rate.toFixed(2)}%`, color };
};

export const getSafeValue = <T>(value: T | undefined | null, defaultValue: T): T => {
  return value ?? defaultValue;
};

export const displayValue = (value: string | undefined | null): string => {
  return value && value.trim() !== '' ? value : '--';
};

export const filterNormalRecords = (records: ForecastRecord[]): ForecastRecord[] => {
  return records.filter(r => !r.hasStatusConflict && !r.isAbnormal);
};

export const hasStatusConflict = (createdBy: string, updatedBy?: string): boolean => {
  return !!updatedBy && createdBy !== updatedBy;
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
