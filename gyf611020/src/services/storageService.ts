import { db } from '../db';
import {
  AnnotationLayer,
  CaptureRecord,
  CaptureWithBlob,
  Manuscript,
} from '../types';

const genId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

export const storageService = {
  async saveCapture(
    record: Partial<CaptureRecord> & Omit<CaptureRecord, 'id' | 'imageBlobKey'>,
    imageBlob: Blob
  ): Promise<string> {
    const id = (record as CaptureRecord).id || genId();
    const blobKey = `img_${id}`;
    await db.imageBlobs.put({ id: blobKey, blob: imageBlob });
    const fullRecord: CaptureRecord = { ...(record as CaptureRecord), id, imageBlobKey: blobKey };
    if (!(record as CaptureRecord).id) {
      await db.captures.add(fullRecord);
    } else {
      await db.captures.put(fullRecord);
    }
    return id;
  },

  async getCapture(
    id: string
  ): Promise<{ record: CaptureRecord; blob: Blob; url: string } | null> {
    const record = await db.captures.get(id);
    if (!record) return null;
    const blobEntity = await db.imageBlobs.get(record.imageBlobKey);
    if (!blobEntity) return { record, blob: new Blob(), url: '' };
    const url = URL.createObjectURL(blobEntity.blob);
    return { record, blob: blobEntity.blob, url };
  },

  async saveAnnotations(layer: AnnotationLayer): Promise<void> {
    layer.updatedAt = Date.now();
    await db.annotations.put(layer);
  },

  async getAnnotations(captureId: string): Promise<AnnotationLayer | null> {
    return (await db.annotations.get(captureId)) ?? null;
  },

  async listManuscripts(): Promise<Manuscript[]> {
    return db.manuscripts.orderBy('createdAt').reverse().toArray();
  },

  async getManuscript(id: string): Promise<Manuscript | undefined> {
    return db.manuscripts.get(id);
  },

  async listCaptures(
    filters?: Partial<CaptureRecord>
  ): Promise<CaptureWithBlob[]> {
    let query = db.captures.orderBy('capturedAt').reverse();
    const records = await query.toArray();
    let filtered = records;
    if (filters) {
      filtered = records.filter((r) => {
        for (const key of Object.keys(filters) as Array<keyof CaptureRecord>) {
          if ((filters[key] !== undefined) && (r[key] as unknown) !== filters[key]) {
            return false;
          }
        }
        return true;
      });
    }
    return filtered;
  },

  async listCapturesByManuscript(manuscriptId: string, pageNum?: number): Promise<CaptureWithBlob[]> {
    let query = db.captures.where('manuscriptId').equals(manuscriptId);
    if (pageNum !== undefined) {
      query = query.and((r) => r.pageNum === pageNum);
    }
    const records = await query.sortBy('capturedAt');
    return records.reverse();
  },

  async compareVersions(
    manuscriptId: string,
    pageNum: number
  ): Promise<CaptureWithBlob[]> {
    return this.listCapturesByManuscript(manuscriptId, pageNum);
  },

  async getNextVersion(manuscriptId: string, pageNum: number): Promise<number> {
    const records = await db.captures
      .where('[manuscriptId+pageNum]')
      .equals([manuscriptId, pageNum])
      .sortBy('capturedAt');
    if (records.length === 0) return 1;
    return Math.max(...records.map((r) => r.version)) + 1;
  },

  async deleteCapture(id: string): Promise<void> {
    const record = await db.captures.get(id);
    if (record) {
      await db.imageBlobs.delete(record.imageBlobKey);
    }
    await db.captures.delete(id);
    await db.annotations.delete(id);
  },
};

export { genId };
