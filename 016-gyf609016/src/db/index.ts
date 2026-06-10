import Dexie, { type Table } from 'dexie';
import type { StoneRecord, PhotoAttachment, ReplacementRecord, OperationHistory } from '@/types';

class StoneDB extends Dexie {
  stones!: Table<StoneRecord, string>;
  photos!: Table<PhotoAttachment, string>;
  replacements!: Table<ReplacementRecord, string>;
  histories!: Table<OperationHistory, string>;

  constructor() {
    super('StoneColorReviewDB');
    this.version(1).stores({
      stones: 'id, batchNo, stoneNo, facadeZone, colorGrade, wallStatus, operator, createdAt',
      photos: 'id, stoneId, isMissing',
      replacements: 'id, stoneId, confirmResult',
      histories: 'id, stoneId, operator, operatedAt',
    });
  }
}

export const db = new StoneDB();

export async function clearAndSeedDatabase() {
  const count = await db.stones.count();
  if (count > 0) return;

  const { generateMockData } = await import('./mock-data');
  const data = generateMockData();

  await db.transaction('rw', [db.stones, db.photos, db.replacements, db.histories], async () => {
    await db.stones.bulkAdd(data.stones);
    await db.photos.bulkAdd(data.photos);
    await db.replacements.bulkAdd(data.replacements);
    await db.histories.bulkAdd(data.histories);
  });
}
