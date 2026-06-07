import { Router } from 'express';
import { getDb } from '../db/index.js';
import { applyPrivacyMaskToList } from '../../shared/privacy.js';
import type { ClassInfo, Baby } from '../../shared/types.js';

const router = Router();

router.get('/', (_req, res) => {
  const db = getDb();
  const classes = db.prepare('SELECT * FROM classes').all() as { id: string; name: string; capacity: number }[];
  const result: ClassInfo[] = classes.map((c) => {
    const babyRow = db.prepare('SELECT COUNT(*) as cnt FROM babies WHERE class_id = ?').get(c.id) as { cnt: number };
    const exRow = db.prepare("SELECT COUNT(*) as cnt FROM exception_records WHERE class_id = ? AND status = 'pending'").get(c.id) as { cnt: number };
    const totalRow = db.prepare('SELECT COUNT(*) as cnt FROM disinfection_records WHERE class_id = ?').get(c.id) as { cnt: number };
    const doneRow = db.prepare("SELECT COUNT(*) as cnt FROM disinfection_records WHERE class_id = ? AND status IN ('disinfected','distributed','recycled')").get(c.id) as { cnt: number };
    return {
      id: c.id,
      name: c.name,
      capacity: c.capacity,
      babyCount: babyRow.cnt,
      exceptionCount: exRow.cnt,
      completedRate: totalRow.cnt === 0 ? 0 : Math.round((doneRow.cnt / totalRow.cnt) * 100),
    };
  });
  res.json(result);
});

router.get('/:id/babies', (req, res) => {
  const { currentUser } = req;
  const db = getDb();
  const { id } = req.params;
  const rows = db.prepare('SELECT * FROM babies WHERE class_id = ? ORDER BY name').all(id) as Record<string, unknown>[];
  const babies = rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    classId: r.class_id as string,
    className: r.class_name as string,
    parentPhone: r.parent_phone as string,
    parentIdCard: r.parent_id_card as string,
    homeAddress: r.home_address as string,
    status: r.status as Baby['status'],
  })) as Baby[];
  const masked = applyPrivacyMaskToList(babies, currentUser?.role || 'teacher');
  res.json(masked);
});

export default router;
