import * as repo from "../repositories/cuppingRepository.js";
import {
  SIP_DURATION_THRESHOLD_MS,
  VOLUME_THRESHOLD_DB,
  MAX_INVALIDATE_COUNT,
  STANDARD_SCORES,
  DEVIATION_TOLERANCE,
  type StandardScores,
  type SipResult,
  type Sample,
} from "../types.js";

export function validateSipResult(
  result: SipResult,
  thresholdDb: number = VOLUME_THRESHOLD_DB
): { valid: boolean; reason?: string } {
  const volumeRatio = result.samples_above_threshold / result.total_samples;
  if (volumeRatio < 0.5) {
    return { valid: false, reason: "音量不足，啜饮力度不够" };
  }
  if (result.duration_ms >= SIP_DURATION_THRESHOLD_MS) {
    return { valid: false, reason: "啜饮超时，可能存在凑时长" };
  }
  if (result.duration_ms < 500) {
    return { valid: false, reason: "啜饮时长过短" };
  }
  return { valid: true };
}

export function getStandardScores(batchId: number): StandardScores {
  const batchStandards = repo.calculateStandardScores(batchId);
  return batchStandards || STANDARD_SCORES;
}

export function calculateDeviation(
  scores: { appearance: number; aroma: number; taste: number; leaf: number },
  standards: StandardScores
): number {
  const diffs = [
    scores.appearance - standards.appearance,
    scores.aroma - standards.aroma,
    scores.taste - standards.taste,
    scores.leaf - standards.leaf,
  ];
  const avgDeviation =
    diffs.reduce((sum, d) => sum + Math.abs(d), 0) / diffs.length;
  return Math.round(avgDeviation * 10) / 10;
}

export function calculateTotal(
  scores: { appearance: number; aroma: number; taste: number; leaf: number }
): number {
  return (
    Math.round(
      (scores.appearance * 0.2 +
        scores.aroma * 0.3 +
        scores.taste * 0.35 +
        scores.leaf * 0.15) *
        10
    ) / 10
  );
}

export function checkIfAllSamplesScored(batchId: number): boolean {
  const scored = repo.getScoredSamplesCount(batchId);
  const total = repo.getTotalSamplesCount(batchId);
  return total > 0 && scored >= total;
}

export function tryInvalidateSample(sampleId: number): {
  success: boolean;
  newCount: number;
  maxReached: boolean;
  shouldDowngradeBatch: boolean;
  batchId: number | null;
} {
  const sample = repo.getSampleById(sampleId);
  if (!sample) {
    return {
      success: false,
      newCount: 0,
      maxReached: false,
      shouldDowngradeBatch: false,
      batchId: null,
    };
  }

  const newCount = repo.invalidateSample(sampleId);
  const maxReached = newCount >= MAX_INVALIDATE_COUNT;

  const samples = repo.getSamplesByBatchId(sample.batch_id);
  const allMaxed = samples.every((s) => s.invalidate_count >= MAX_INVALIDATE_COUNT);
  const anyScored = samples.some((s) => s.status === "scored");

  const shouldDowngradeBatch = maxReached && !anyScored && allMaxed;

  if (shouldDowngradeBatch) {
    repo.downgradeBatch(sample.batch_id);
  }

  return {
    success: true,
    newCount,
    maxReached,
    shouldDowngradeBatch,
    batchId: sample.batch_id,
  };
}

export function generateCertificateContent(batchId: number): string {
  const batch = repo.getBatchById(batchId);
  if (!batch) return "{}";

  const samples = repo.getSamplesByBatchId(batchId);
  const standards = getStandardScores(batchId);

  const sampleDetails = samples.map((s) => {
    const scores = repo.getScoresBySampleId(s.id);
    const avgScores =
      scores.length > 0
        ? {
            appearance: scores.reduce((a, b) => a + b.appearance, 0) / scores.length,
            aroma: scores.reduce((a, b) => a + b.aroma, 0) / scores.length,
            taste: scores.reduce((a, b) => a + b.taste, 0) / scores.length,
            leaf: scores.reduce((a, b) => a + b.leaf, 0) / scores.length,
            total: scores.reduce((a, b) => a + b.total, 0) / scores.length,
            deviation: scores.reduce((a, b) => a + b.deviation, 0) / scores.length,
          }
        : null;

    return {
      sample_code: s.sample_code,
      status: s.status,
      sip_duration_ms: s.sip_duration_ms,
      avg_volume_db: s.avg_volume_db,
      invalidate_count: s.invalidate_count,
      scores: avgScores,
    };
  });

  const content = {
    batch_code: batch.batch_code,
    tea_name: batch.tea_name,
    origin: batch.origin,
    status: batch.status,
    standard_scores: standards,
    deviation_tolerance: DEVIATION_TOLERANCE,
    samples: sampleDetails,
    generated_at: new Date().toISOString(),
    batch_summary: {
      total_samples: samples.length,
      scored_samples: samples.filter((s) => s.status === "scored").length,
      invalid_samples: samples.filter((s) => s.invalidate_count >= MAX_INVALIDATE_COUNT).length,
    },
  };

  return JSON.stringify(content, null, 2);
}

export function getNextSampleToEvaluate(batchId: number): Sample | null {
  const samples = repo.getSamplesByBatchId(batchId);
  return (
    samples.find((s) => s.status === "pending" && s.invalidate_count < MAX_INVALIDATE_COUNT) ||
    null
  );
}
