import Dexie from 'dexie';
import type { Zone, MeasurePoint, Evidence, Suggestion, SuggestionVersion } from '@/types';

class RoofSlopeDB extends Dexie {
  zones!: Dexie.Table<Zone, string>;
  measurePoints!: Dexie.Table<MeasurePoint, string>;
  evidences!: Dexie.Table<Evidence, string>;
  suggestions!: Dexie.Table<Suggestion, string>;
  suggestionVersions!: Dexie.Table<SuggestionVersion, string>;

  constructor() {
    super('RoofSlopeDB');
    this.version(1).stores({
      zones: 'id, name',
      measurePoints: 'id, zoneId, [zoneId+row+col]',
      evidences: 'id, zoneId',
      suggestions: 'id, zoneId',
      suggestionVersions: 'id, suggestionId, versionNumber',
    });
  }
}

export const db = new RoofSlopeDB();

export async function isDatabaseSeeded(): Promise<boolean> {
  const count = await db.zones.count();
  return count > 0;
}

export async function clearDatabase(): Promise<void> {
  await db.delete();
}

export async function getZones(): Promise<Zone[]> {
  return db.zones.toArray();
}

export async function getMeasurePointsByZone(zoneId: string): Promise<MeasurePoint[]> {
  return db.measurePoints.where('zoneId').equals(zoneId).toArray();
}

export async function getEvidencesByZone(zoneId: string): Promise<Evidence[]> {
  return db.evidences.where('zoneId').equals(zoneId).toArray();
}

export async function getSuggestionByZone(zoneId: string): Promise<Suggestion | undefined> {
  return db.suggestions.where('zoneId').equals(zoneId).first();
}

export async function getSuggestionVersions(suggestionId: string): Promise<SuggestionVersion[]> {
  return db.suggestionVersions
    .where('suggestionId')
    .equals(suggestionId)
    .sortBy('versionNumber');
}

export async function updateMeasurePoint(id: string, elevationMm: number | null): Promise<void> {
  await db.measurePoints.update(id, { elevationMm });
}

export async function addSuggestionVersion(
  suggestionId: string,
  content: string,
  changeNote: string
): Promise<SuggestionVersion> {
  const versions = await getSuggestionVersions(suggestionId);
  const nextVersion = versions.length > 0 ? versions[versions.length - 1].versionNumber + 1 : 1;

  const newVersion: SuggestionVersion = {
    id: `sv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    suggestionId,
    content,
    versionNumber: nextVersion,
    createdAt: new Date().toISOString(),
    changeNote,
  };

  await db.suggestionVersions.add(newVersion);
  await db.suggestions.update(suggestionId, {
    currentContent: content,
    updatedAt: newVersion.createdAt,
  });

  return newVersion;
}

export async function seedDatabase(): Promise<void> {
  const seeded = await isDatabaseSeeded();
  if (seeded) return;

  const { seedData } = await import('./seed');
  await db.transaction('rw', [db.zones, db.measurePoints, db.evidences, db.suggestions, db.suggestionVersions], async () => {
    await db.zones.bulkAdd(seedData.zones);
    await db.measurePoints.bulkAdd(seedData.measurePoints);
    await db.evidences.bulkAdd(seedData.evidences);
    await db.suggestions.bulkAdd(seedData.suggestions);
    await db.suggestionVersions.bulkAdd(seedData.suggestionVersions);
  });
}
