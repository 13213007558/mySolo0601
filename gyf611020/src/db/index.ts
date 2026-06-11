import Dexie, { Table } from 'dexie';
import {
  Manuscript,
  CaptureRecord,
  AnnotationLayer,
  ImageBlobEntity,
} from '../types';

export class ManuscriptDB extends Dexie {
  manuscripts!: Table<Manuscript, string>;
  captures!: Table<CaptureRecord, string>;
  annotations!: Table<AnnotationLayer, string>;
  imageBlobs!: Table<ImageBlobEntity, string>;

  constructor() {
    super('manuscript-side-light');
    this.version(1).stores({
      manuscripts: 'id, code, createdAt',
      captures:
        'id, manuscriptId, pageNum, [manuscriptId+pageNum], capturedAt, needsRetake',
      annotations: 'captureId, updatedAt',
      imageBlobs: 'id',
    });
  }
}

export const db = new ManuscriptDB();

export const seedMockData = async (): Promise<void> => {
  const existing = await db.manuscripts.count();
  if (existing > 0) return;
  await db.manuscripts.bulkAdd([
    {
      id: 'm1',
      code: 'GB-00123',
      title: '永乐大典·卷之二千三百四十七',
      totalPages: 42,
      createdAt: Date.now() - 86400000 * 30,
    },
    {
      id: 'm2',
      code: 'GB-00456',
      title: '敦煌遗书·S.1234 维摩诘经',
      totalPages: 18,
      createdAt: Date.now() - 86400000 * 15,
    },
    {
      id: 'm3',
      code: 'GB-00789',
      title: '宋版文选·卷三十一',
      totalPages: 26,
      createdAt: Date.now() - 86400000 * 7,
    },
  ]);
};
