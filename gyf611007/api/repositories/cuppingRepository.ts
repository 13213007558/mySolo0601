import { db } from "../db.js";
import type { Batch, BatchStatus, Sample, SampleStatus, Score, Certificate, StandardScores } from "../types.js";

export function getAllBatches(): Batch[] {
  return db.prepare("SELECT * FROM batches ORDER BY created_at DESC").all() as Batch[];
}

export function getBatchById(id: number): Batch | undefined {
  return db.prepare("SELECT * FROM batches WHERE id = ?").get(id) as Batch | undefined;
}

export function getBatchByCode(code: string): Batch | undefined {
  return db.prepare("SELECT * FROM batches WHERE batch_code = ?").get(code) as Batch | undefined;
}

export function createBatch(data: {
  batch_code: string;
  tea_name: string;
  origin: string;
  created_by: number;
}): Batch {
  const result = db
    .prepare(
      "INSERT INTO batches (batch_code, tea_name, origin, created_by) VALUES (?, ?, ?, ?)"
    )
    .run(data.batch_code, data.tea_name, data.origin, data.created_by);

  return getBatchById(result.lastInsertRowid as number)!;
}

export function updateBatchStatus(id: number, status: BatchStatus): void {
  db.prepare("UPDATE batches SET status = ? WHERE id = ?").run(status, id);
}

export function lockBatch(id: number): void {
  db.prepare("UPDATE batches SET status = 'locked', locked_at = datetime('now') WHERE id = ?").run(id);
}

export function downgradeBatch(id: number): void {
  db.prepare("UPDATE batches SET status = 'downgraded' WHERE id = ?").run(id);
}

export function getSamplesByBatchId(batchId: number): Sample[] {
  return db
    .prepare("SELECT * FROM samples WHERE batch_id = ? ORDER BY order_index ASC")
    .all(batchId) as Sample[];
}

export function getSampleById(id: number): Sample | undefined {
  return db.prepare("SELECT * FROM samples WHERE id = ?").get(id) as Sample | undefined;
}

export function addSample(batchId: number, sampleCode: string, orderIndex: number): Sample {
  const result = db
    .prepare(
      "INSERT INTO samples (batch_id, sample_code, order_index) VALUES (?, ?, ?)"
    )
    .run(batchId, sampleCode, orderIndex);

  return getSampleById(result.lastInsertRowid as number)!;
}

export function updateSampleStatus(id: number, status: SampleStatus): void {
  db.prepare("UPDATE samples SET status = ? WHERE id = ?").run(status, id);
}

export function verifySpoon(id: number): void {
  db.prepare("UPDATE samples SET spoon_verified = 1 WHERE id = ?").run(id);
}

export function updateSipResult(
  id: number,
  durationMs: number,
  avgVolumeDb: number,
  isValid: boolean,
  thresholdDb: number
): void {
  db.prepare(
    "UPDATE samples SET sip_duration_ms = ?, avg_volume_db = ?, sip_valid = ?, volume_threshold_db = ?, status = 'scored' WHERE id = ?"
  ).run(durationMs, avgVolumeDb, isValid ? 1 : 0, thresholdDb, id);
}

export function invalidateSample(id: number): number {
  const sample = getSampleById(id);
  if (!sample) return 0;
  const newCount = sample.invalidate_count + 1;
  db.prepare(
    "UPDATE samples SET invalidate_count = ?, status = 'pending', spoon_verified = 0, sip_duration_ms = NULL, avg_volume_db = NULL, sip_valid = NULL WHERE id = ?"
  ).run(newCount, id);
  return newCount;
}

export function getScoresBySampleId(sampleId: number): Score[] {
  return db
    .prepare("SELECT * FROM scores WHERE sample_id = ? ORDER BY created_at DESC")
    .all(sampleId) as Score[];
}

export function getScoreBySampleAndScorer(sampleId: number, scorerId: number): Score | undefined {
  return db
    .prepare("SELECT * FROM scores WHERE sample_id = ? AND scorer_id = ?")
    .get(sampleId, scorerId) as Score | undefined;
}

export function upsertScore(data: {
  sample_id: number;
  scorer_id: number;
  appearance: number;
  aroma: number;
  taste: number;
  leaf: number;
  total: number;
  deviation: number;
}): Score {
  const existing = getScoreBySampleAndScorer(data.sample_id, data.scorer_id);

  if (existing) {
    db.prepare(
      `UPDATE scores SET appearance = ?, aroma = ?, taste = ?, leaf = ?, total = ?, deviation = ?
       WHERE sample_id = ? AND scorer_id = ?`
    ).run(
      data.appearance,
      data.aroma,
      data.taste,
      data.leaf,
      data.total,
      data.deviation,
      data.sample_id,
      data.scorer_id
    );
    return getScoreBySampleAndScorer(data.sample_id, data.scorer_id)!;
  } else {
    const result = db.prepare(
      `INSERT INTO scores (sample_id, scorer_id, appearance, aroma, taste, leaf, total, deviation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      data.sample_id,
      data.scorer_id,
      data.appearance,
      data.aroma,
      data.taste,
      data.leaf,
      data.total,
      data.deviation
    );
    return db.prepare("SELECT * FROM scores WHERE id = ?").get(result.lastInsertRowid) as Score;
  }
}

export function getCertificateByBatchId(batchId: number): Certificate | undefined {
  return db
    .prepare("SELECT * FROM certificates WHERE batch_id = ? ORDER BY id DESC LIMIT 1")
    .get(batchId) as Certificate | undefined;
}

export function createCertificate(batchId: number, contentJson: string): Certificate {
  const result = db
    .prepare("INSERT INTO certificates (batch_id, content_json) VALUES (?, ?)")
    .run(batchId, contentJson);
  return db.prepare("SELECT * FROM certificates WHERE id = ?").get(result.lastInsertRowid) as Certificate;
}

export function signCertificate(certId: number, signerId: number): void {
  db.prepare(
    "UPDATE certificates SET signed_by = ?, signed_at = datetime('now') WHERE id = ?"
  ).run(signerId, certId);
}

export function getScoredSamplesCount(batchId: number): number {
  const row = db
    .prepare("SELECT COUNT(*) as count FROM samples WHERE batch_id = ? AND status = 'scored'")
    .get(batchId) as { count: number };
  return row.count;
}

export function getTotalSamplesCount(batchId: number): number {
  const row = db
    .prepare("SELECT COUNT(*) as count FROM samples WHERE batch_id = ?")
    .get(batchId) as { count: number };
  return row.count;
}

export function calculateStandardScores(batchId: number): StandardScores | null {
  const batch = getBatchById(batchId);
  if (!batch || !batch.standard_sample_id) return null;

  const scores = getScoresBySampleId(batch.standard_sample_id);
  if (scores.length === 0) return null;

  const sum = scores.reduce(
    (acc, s) => {
      acc.appearance += s.appearance;
      acc.aroma += s.aroma;
      acc.taste += s.taste;
      acc.leaf += s.leaf;
      return acc;
    },
    { appearance: 0, aroma: 0, taste: 0, leaf: 0 }
  );

  return {
    appearance: sum.appearance / scores.length,
    aroma: sum.aroma / scores.length,
    taste: sum.taste / scores.length,
    leaf: sum.leaf / scores.length,
  };
}
