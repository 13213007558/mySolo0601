import { Router } from 'express';
import { getDb } from '../db/index.js';
import { createManualRecord } from '../services/exceptions.js';
import type { DisinfectionRecord } from '../../shared/types.js';

const router = Router();

function mapRecord(row: Record<string, unknown>): DisinfectionRecord {
  return {
    id: row.id as string,
    babyId: row.baby_id as string,
    babyName: row.baby_name as string,
    classId: row.class_id as string,
    itemType: row.item_type as DisinfectionRecord['itemType'],
    itemName: row.item_name as string,
    status: row.status as DisinfectionRecord['status'],
    operatorId: row.operator_id as string,
    operatorName: row.operator_name as string,
    operateTime: row.operate_time as string,
    isManual: (row.is_manual as number) === 1,
    remark: row.remark as string | undefined,
  };
}

router.get('/', (req, res) => {
  const db = getDb();
  const { classId, status, babyId } = req.query as Record<string, string>;
  const args: unknown[] = [];
  let sql = 'SELECT * FROM disinfection_records WHERE 1=1';
  if (classId) { sql += ' AND class_id = ?'; args.push(classId); }
  if (status) { sql += ' AND status = ?'; args.push(status); }
  if (babyId) { sql += ' AND baby_id = ?'; args.push(babyId); }
  sql += ' ORDER BY operate_time DESC LIMIT 200';
  const rows = db.prepare(sql).all(...args) as Record<string, unknown>[];
  res.json(rows.map(mapRecord));
});

router.post('/', (req, res) => {
  const { currentUser } = req;
  if (!currentUser) return res.status(401).json({ error: '未登录' });
  const payload = req.body as {
    babyId: string; babyName: string; classId: string; itemType: string; itemName: string;
    status: string; operatorId: string; operatorName: string; remark?: string; isManual?: boolean;
  };
  if (payload.isManual) {
    const result = createManualRecord(payload, currentUser);
    return res.status(201).json(result);
  }
  res.status(400).json({ error: '仅支持手工补录' });
});

export default router;
