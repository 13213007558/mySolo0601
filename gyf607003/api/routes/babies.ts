import { Router } from 'express';
import { getDb } from '../db/index.js';
import { applyPrivacyMask } from '../../shared/privacy.js';
import type { Baby, TimelineEvent, ExceptionRecord } from '../../shared/types.js';

const router = Router();

router.get('/:id', (req, res) => {
  const { currentUser } = req;
  const db = getDb();
  const row = db.prepare('SELECT * FROM babies WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;
  if (!row) return res.status(404).json({ error: '宝宝不存在' });
  const baby: Baby = {
    id: row.id as string,
    name: row.name as string,
    classId: row.class_id as string,
    className: row.class_name as string,
    parentPhone: row.parent_phone as string,
    parentIdCard: row.parent_id_card as string,
    homeAddress: row.home_address as string,
    status: row.status as Baby['status'],
  };
  res.json(applyPrivacyMask(baby, currentUser?.role || 'teacher'));
});

router.get('/:id/timeline', (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const events: TimelineEvent[] = [];

  const records = db.prepare('SELECT * FROM disinfection_records WHERE baby_id = ? ORDER BY operate_time DESC LIMIT 50').all(id) as Record<string, unknown>[];
  for (const r of records) {
    events.push({
      id: 'rec_' + (r.id as string),
      time: r.operate_time as string,
      type: (r.is_manual as number) === 1 ? 'manual' : r.status as TimelineEvent['type'] || 'disinfect',
      title: `${(r.is_manual as number) === 1 ? '[补录] ' : ''}${r.item_name as string}`,
      description: `状态: ${r.status as string}`,
      operatorName: r.operator_name as string,
    });
  }

  const exceptions = db.prepare('SELECT * FROM exception_records WHERE baby_id = ? ORDER BY create_time DESC').all(id) as Record<string, unknown>[];
  for (const e of exceptions) {
    events.push({
      id: 'ex_' + (e.id as string),
      time: e.create_time as string,
      type: (e.status as string) === 'resolved' ? 'resolve' : 'exception',
      title: `异常: ${e.type as string}`,
      description: e.reason as string,
      operatorName: (e.handler_name as string) || '系统',
    });
  }

  events.sort((a, b) => (a.time < b.time ? 1 : -1));
  res.json(events);
});

router.get('/:id/exceptions', (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM exception_records WHERE baby_id = ? ORDER BY create_time DESC').all(req.params.id) as Record<string, unknown>[];
  const result: ExceptionRecord[] = rows.map((r) => ({
    id: r.id as string,
    recordId: r.record_id as string,
    babyId: r.baby_id as string,
    babyName: r.baby_name as string,
    classId: r.class_id as string,
    type: r.type as ExceptionRecord['type'],
    reason: r.reason as string,
    status: r.status as ExceptionRecord['status'],
    handlerId: r.handler_id as string | undefined,
    handlerName: r.handler_name as string | undefined,
    handleMeasure: r.handle_measure as string | undefined,
    handleTime: r.handle_time as string | undefined,
    createTime: r.create_time as string,
    reviewedBy: r.reviewed_by as string | undefined,
    reviewedAt: r.reviewed_at as string | undefined,
    reviewComment: r.review_comment as string | undefined,
  }));
  res.json(result);
});

export default router;
