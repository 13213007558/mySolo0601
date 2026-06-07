import { Router, type Request, type Response } from 'express';
import {
  records,
  filterRecords,
  findById,
  addRecord,
  updateRecord,
  addException,
  getStats,
} from '../store/index.js';
import type { RecordFilters, UserRole } from '../../shared/types';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const f: RecordFilters = {
    status: req.query.status as any,
    dataSource: req.query.dataSource as any,
    operator: req.query.operator as string,
    search: req.query.search as string,
    dateFrom: req.query.dateFrom as string,
    dateTo: req.query.dateTo as string,
  };
  const list = filterRecords(f).map((r) => ({
    id: r.id,
    infantName: r.infantName,
    infantAge: r.infantAge,
    guardianName: r.guardianName,
    courseName: r.courseName,
    originalDate: r.originalDate,
    newDate: r.newDate,
    sourceFile: r.sourceFile,
    operator: r.operator,
    status: r.status,
    dataSource: r.dataSource,
    latestNote: r.latestNote,
    reviewCount: r.reviewCount,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    hasException: r.exceptions.length > 0,
    changeHistoryCount: r.changeHistory.length,
  }));
  res.json({ success: true, data: list, total: list.length });
});

router.get('/stats', (_req: Request, res: Response) => {
  res.json({ success: true, data: getStats() });
});

router.get('/:id', (req: Request, res: Response) => {
  const rec = findById(req.params.id);
  if (!rec) return res.status(404).json({ success: false, error: '未找到该记录' });
  res.json({ success: true, data: rec });
});

router.get('/:id/history', (req: Request, res: Response) => {
  const rec = findById(req.params.id);
  if (!rec) return res.status(404).json({ success: false, error: '未找到该记录' });
  res.json({ success: true, data: rec.changeHistory });
});

router.post('/', (req: Request, res: Response) => {
  const body = req.body as any;
  const rec = addRecord({
    infantName: body.infantName,
    infantAge: Number(body.infantAge),
    guardianName: body.guardianName,
    guardianPhone: body.guardianPhone,
    courseName: body.courseName,
    originalDate: body.originalDate,
    newDate: body.newDate,
    sourceFile: body.sourceFile,
    operator: body.operator || '张护士',
    operatorRole: (body.operatorRole as UserRole) || 'nurse',
    status: body.status || 'pending',
    dataSource: body.dataSource || 'normal',
    latestNote: body.latestNote || '',
  });
  res.status(201).json({ success: true, data: rec });
});

router.post('/supplement', (req: Request, res: Response) => {
  const body = req.body as any;
  const rec = addRecord({
    infantName: body.infantName,
    infantAge: Number(body.infantAge),
    guardianName: body.guardianName,
    guardianPhone: body.guardianPhone,
    courseName: body.courseName,
    originalDate: body.originalDate,
    newDate: body.newDate,
    sourceFile: body.sourceFile || '手工补录-' + new Date().toISOString().slice(0, 10) + '.xlsx',
    operator: body.operator || '张护士',
    operatorRole: (body.operatorRole as UserRole) || 'nurse',
    status: 'supplemented',
    dataSource: 'supplement',
    latestNote: body.latestNote || '手工补录记录',
  });
  res.status(201).json({ success: true, data: rec });
});

router.put('/:id', (req: Request, res: Response) => {
  const body = req.body as any;
  const meta = {
    operator: body.operator || '张护士',
    operatorRole: (body.operatorRole as UserRole) || 'nurse',
    note: body.note || '更新记录',
  };
  const patch: any = {};
  const allowed = [
    'infantName', 'infantAge', 'guardianName', 'guardianPhone',
    'courseName', 'originalDate', 'newDate', 'sourceFile',
    'status', 'latestNote',
  ];
  for (const k of allowed) if (body[k] !== undefined) patch[k] = body[k];
  const rec = updateRecord(req.params.id, patch, meta);
  if (!rec) return res.status(404).json({ success: false, error: '未找到该记录' });
  res.json({ success: true, data: rec });
});

router.post('/:id/review', (req: Request, res: Response) => {
  const body = req.body as any;
  const meta = {
    operator: body.operator || '王园长',
    operatorRole: 'director' as UserRole,
    note: body.note || '复核通过',
  };
  const rec = updateRecord(req.params.id, { status: 'reviewed' }, meta);
  if (!rec) return res.status(404).json({ success: false, error: '未找到该记录' });
  res.json({ success: true, data: rec });
});

router.post('/:id/note', (req: Request, res: Response) => {
  const body = req.body as any;
  const meta = {
    operator: body.operator || '张护士',
    operatorRole: (body.operatorRole as UserRole) || 'nurse',
    note: '添加人工说明',
  };
  const rec = updateRecord(req.params.id, { latestNote: body.latestNote }, meta);
  if (!rec) return res.status(404).json({ success: false, error: '未找到该记录' });
  res.json({ success: true, data: rec });
});

router.post('/:id/exception', (req: Request, res: Response) => {
  const body = req.body as any;
  const evt = addException(req.params.id, {
    type: body.type,
    title: body.title,
    reason: body.reason,
    recoveryNote: body.recoveryNote,
    operator: body.operator || '王园长',
  });
  if (!evt) return res.status(404).json({ success: false, error: '未找到该记录' });
  res.status(201).json({ success: true, data: evt });
});

router.get('/operators/list', (_req: Request, res: Response) => {
  const set = new Set(records.map((r) => r.operator));
  res.json({ success: true, data: Array.from(set) });
});

export default router;
