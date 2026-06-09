import { useMemo } from 'react';
import type { OilTempRecord, SupplementRecord, SupplementPoint } from '@/types';
import { useOilTempStore } from '@/store/useOilTempStore';
import { parseTimeToMinutes } from '@/utils/hash';

interface ComparisonResult {
  time: string;
  originalValue: number | null;
  supplementValue: number | null;
  difference: number | null;
  percentage: number | null;
  hasSignificantDiff: boolean;
}

export function useSupplementComparison(supplementId: string | null) {
  const { records, supplementRecords, selectedDevice } = useOilTempStore();

  const supplement = useMemo(() => {
    if (!supplementId) return null;
    return supplementRecords.find(s => s.id === supplementId) || null;
  }, [supplementId, supplementRecords]);

  const deviceRecords = useMemo(() => {
    return records.filter(
      r => r.deviceName === selectedDevice && r.measurePoint === '顶层油温'
    );
  }, [records, selectedDevice]);

  const comparisonData = useMemo((): ComparisonResult[] => {
    if (!supplement) return [];

    const recordMap = new Map<string, number>();
    deviceRecords.forEach(r => {
      recordMap.set(r.timestamp, r.temperature);
    });

    const results: ComparisonResult[] = [];
    const allTimes = new Set<string>();

    supplement.points.forEach(p => allTimes.add(p.time));
    deviceRecords.forEach(r => allTimes.add(r.timestamp));

    const sortedTimes = Array.from(allTimes).sort(
      (a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b)
    );

    sortedTimes.forEach(time => {
      const originalValue = recordMap.get(time) ?? null;
      const supplementPoint = supplement.points.find(p => p.time === time);
      const supplementValue = supplementPoint?.temperature ?? null;

      let difference: number | null = null;
      let percentage: number | null = null;
      let hasSignificantDiff = false;

      if (originalValue !== null && supplementValue !== null) {
        difference = Math.round((supplementValue - originalValue) * 10) / 10;
        percentage = originalValue > 0
          ? Math.round((difference / originalValue) * 1000) / 10
          : null;
        hasSignificantDiff = Math.abs(difference) >= 2;
      }

      results.push({
        time,
        originalValue,
        supplementValue,
        difference,
        percentage,
        hasSignificantDiff,
      });
    });

    return results;
  }, [supplement, deviceRecords]);

  const statistics = useMemo(() => {
    if (!supplement || comparisonData.length === 0) {
      return {
        totalPoints: 0,
        matchedPoints: 0,
        significantDiffs: 0,
        avgDifference: 0,
        maxDifference: 0,
        minDifference: 0,
      };
    }

    const matched = comparisonData.filter(
      d => d.originalValue !== null && d.supplementValue !== null
    );
    const significantDiffs = comparisonData.filter(d => d.hasSignificantDiff);
    const differences = matched
      .map(d => d.difference)
      .filter((d): d is number => d !== null);

    return {
      totalPoints: comparisonData.length,
      matchedPoints: matched.length,
      significantDiffs: significantDiffs.length,
      avgDifference: differences.length > 0
        ? Math.round((differences.reduce((a, b) => a + b, 0) / differences.length) * 10) / 10
        : 0,
      maxDifference: differences.length > 0 ? Math.max(...differences) : 0,
      minDifference: differences.length > 0 ? Math.min(...differences) : 0,
    };
  }, [supplement, comparisonData]);

  const getOriginalPoints = useMemo((): SupplementPoint[] => {
    return deviceRecords
      .map(r => ({
        time: r.timestamp,
        temperature: r.temperature,
      }))
      .sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));
  }, [deviceRecords]);

  return {
    supplement,
    deviceRecords,
    comparisonData,
    statistics,
    getOriginalPoints,
    hasSupplement: supplement !== null,
  };
}
