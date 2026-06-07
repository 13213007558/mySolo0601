import type { Baby, AuthRecord, BabySummary, Stats, CreateRecordBody } from '../../shared/types';
import { loadBabies, loadRecords, saveRecords } from '../storage/jsonStore';
import { randomUUID } from 'node:crypto';

export function getAllBabySummaries(): BabySummary[] {
  const babies = loadBabies();
  const records = loadRecords();

  return babies.map((baby) => {
    const babyRecords = records
      .filter((r) => r.babyId === baby.id)
      .sort((a, b) => b.version - a.version);

    const latestRecord = babyRecords[0] ?? null;
    const hasAnomaly = babyRecords.some(
      (r) => r.affectsSummary === false || !!r.anomalyReason
    );

    return {
      baby,
      latestRecord,
      versionCount: babyRecords.length,
      hasAnomaly,
    };
  });
}

export function getBabyDetail(babyId: string) {
  const babies = loadBabies();
  const records = loadRecords();
  const baby = babies.find((b) => b.id === babyId);
  if (!baby) return null;
  const babyRecords = records
    .filter((r) => r.babyId === babyId)
    .sort((a, b) => b.version - a.version);
  return { baby, records: babyRecords };
}

export function getStats(): Stats {
  const summaries = getAllBabySummaries();
  const byClassMap = new Map<string, { total: number; normal: number }>();

  let normal = 0;
  let anomaly = 0;
  let missing = 0;

  for (const s of summaries) {
    const className = s.baby.className;
    if (!byClassMap.has(className)) {
      byClassMap.set(className, { total: 0, normal: 0 });
    }
    const cls = byClassMap.get(className)!;
    cls.total += 1;

    const lr = s.latestRecord;
    if (!lr || lr.affectsSummary === false) {
      missing += 1;
      continue;
    }
    if (s.hasAnomaly) {
      anomaly += 1;
      continue;
    }
    if (lr.status === 'authorized' || lr.status === 'revoked' || lr.status === 'pending') {
      normal += 1;
      cls.normal += 1;
    } else if (lr.status === 'missing') {
      missing += 1;
    }
  }

  return {
    total: summaries.length,
    normal,
    anomaly,
    missing,
    byClass: Array.from(byClassMap.entries()).map(([className, v]) => ({ className, ...v })),
  };
}

export function createRecord(body: CreateRecordBody): { record: AuthRecord; created: boolean } {
  const records = loadRecords();
  const existingRecords = records.filter((r) => r.babyId === body.babyId);

  if (body.recordedAt) {
    const duplicate = existingRecords.find(
      (r) => r.recordedAt === body.recordedAt && r.source === body.source
    );
    if (duplicate) {
      return { record: duplicate, created: false };
    }
  }

  const maxVersion = existingRecords.reduce((m, r) => Math.max(m, r.version), 0);

  const affectsSummary = body.status !== 'missing' && !body.anomalyReason && body.photoPresent;

  const newRecord: AuthRecord = {
    id: randomUUID(),
    babyId: body.babyId,
    version: maxVersion + 1,
    status: body.status,
    source: body.source,
    operatorName: body.operatorName,
    remark: body.remark,
    photoPresent: body.photoPresent,
    anomalyReason: body.anomalyReason,
    affectsSummary,
    recordedAt: body.recordedAt ?? Date.now(),
    createdAt: Date.now(),
  };

  records.push(newRecord);
  saveRecords(records);
  return { record: newRecord, created: true };
}
