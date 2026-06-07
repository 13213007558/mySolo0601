import { Router } from 'express';
import { getDb } from '../db/index.js';
import type { OverviewStats } from '../../shared/types.js';

const router = Router();

router.get('/overview', (_req, res) => {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);

  const totalRow = db.prepare(
    "SELECT COUNT(*) as cnt FROM disinfection_records WHERE date(operate_time) = ?",
  ).get(today) as { cnt: number };

  const pendingExceptionsRow = db.prepare(
    "SELECT COUNT(*) as cnt FROM exception_records WHERE status = 'pending'",
  ).get() as { cnt: number };

  const completedRow = db.prepare(
    "SELECT COUNT(*) as cnt FROM disinfection_records WHERE status IN ('disinfected','distributed','recycled') AND date(operate_time) = ?",
  ).get(today) as { cnt: number };

  const manualRow = db.prepare(
    "SELECT COUNT(*) as cnt FROM disinfection_records WHERE is_manual = 1 AND date(operate_time) = ?",
  ).get(today) as { cnt: number };

  const stats: OverviewStats = {
    totalToday: totalRow.cnt,
    pendingExceptions: pendingExceptionsRow.cnt,
    completed: completedRow.cnt,
    manualRecords: manualRow.cnt,
  };

  res.json(stats);
});

export default router;
