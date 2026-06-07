import express, { type Request, type Response } from 'express';
import { store } from '../store.js';
import type { DataStatus, Baby } from '../../shared/types.js';

const router = express.Router();

function computeDataStatus(babies: Baby[]): DataStatus {
  if (babies.length === 0) return 'empty';
  const hasDirty = babies.some(b => !b.phoneValid || b.temperatures.length === 0);
  return hasDirty ? 'dirty' : 'normal';
}

router.get('/', (req: Request, res: Response) => {
  const babies = store.getAllBabies();
  res.json({
    success: true,
    data: babies,
    status: computeDataStatus(babies),
  });
});

router.get('/:id', (req: Request, res: Response) => {
  const baby = store.getBabyById(req.params.id);
  if (!baby) {
    res.status(404).json({ success: false, error: '宝宝不存在' });
    return;
  }
  store.addAudit({
    action: 'view',
    targetType: 'baby',
    targetId: baby.id,
    operator: '赵顾问',
  });
  res.json({ success: true, data: baby });
});

router.post('/:id/notes', (req: Request, res: Response) => {
  const { content, operator } = req.body;
  if (!content || !content.trim()) {
    res.status(400).json({ success: false, error: '备注内容不能为空' });
    return;
  }
  const note = store.addNoteToBaby(req.params.id, content.trim(), operator || '赵顾问');
  if (!note) {
    res.status(404).json({ success: false, error: '宝宝不存在' });
    return;
  }
  res.json({ success: true, data: note });
});

router.post('/', (req: Request, res: Response) => {
  const { name, phone, room, className } = req.body;
  if (!name || !name.trim()) {
    res.status(400).json({ success: false, error: '姓名不能为空' });
    return;
  }
  const cleanPhone = (phone || '').replace(/[\s\-]/g, '');
  const phoneValid = /^1[3-9]\d{9}$/.test(cleanPhone);
  const baby = store.addBaby({
    name: name.trim(),
    phone: phone || '',
    phoneValid,
    room: room || '三楼婴儿房A',
    className: className || '向日葵班',
    checkStatus: 'reviewed',
    temperatures: [],
    leaves: [],
    notes: [],
    isManual: true,
  });
  res.json({ success: true, data: baby });
});

router.post('/import', (req: Request, res: Response) => {
  const { rows } = req.body;
  if (!Array.isArray(rows)) {
    res.status(400).json({ success: false, error: '数据格式错误' });
    return;
  }
  const result = store.importFromRows(rows);
  const babies = store.getAllBabies();
  res.json({
    success: true,
    data: {
      ...result,
      status: computeDataStatus(babies),
    },
  });
});

router.post('/export/audit', (req: Request, res: Response) => {
  const { operator } = req.body;
  store.logExport(operator || '赵顾问');
  res.json({ success: true, message: '导出审计已记录' });
});

export default router;
