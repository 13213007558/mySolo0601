import type { Alarm, DuplicateSiteInfo } from '@/types';

export const detectDuplicateSites = (
  newAlarms: Alarm[],
  existingAlarms: Alarm[]
): { conflicts: DuplicateSiteInfo[]; safeToAdd: Alarm[] } => {
  const existingSiteMap = new Map<string, Alarm>();
  existingAlarms.forEach((alarm) => {
    existingSiteMap.set(alarm.siteName, alarm);
  });

  const conflicts: DuplicateSiteInfo[] = [];
  const safeToAdd: Alarm[] = [];

  newAlarms.forEach((alarm) => {
    const existing = existingSiteMap.get(alarm.siteName);
    if (existing && existing.id !== alarm.id) {
      conflicts.push({ alarm, existingAlarm: existing });
    } else {
      safeToAdd.push(alarm);
    }
  });

  return { conflicts, safeToAdd };
};

export const resolveDuplicate = (
  newAlarm: Alarm,
  existingAlarm: Alarm,
  strategy: 'keep-existing' | 'replace' | 'keep-both'
): Alarm | Alarm[] | null => {
  switch (strategy) {
    case 'keep-existing':
      return existingAlarm;
    case 'replace':
      return { ...newAlarm, id: existingAlarm.id };
    case 'keep-both':
      return [existingAlarm, newAlarm];
    default:
      return null;
  }
};
