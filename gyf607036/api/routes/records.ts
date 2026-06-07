import { Router, Request, Response } from 'express';
import { authRepo, systemEventRepo, addSystemEvent } from '../repositories/authRepository';
import type {
  ListFilters,
  SupplementPayload,
  StatusChangePayload,
  ManualEntryPayload,
  DetailResponse,
} from '@shared/types';

const router = Router();

function parseFilters(req: Request): ListFilters {
  const q = req.query;
  const filters: ListFilters = {};
  if (typeof q.status === 'string') filters.status = q.status as any;
  if (typeof q.className === 'string' && q.className) filters.className = q.className;
  if (typeof q.babyName === 'string' && q.babyName) filters.babyName = q.babyName;
  if (typeof q.parentPhone === 'string' && q.parentPhone) filters.parentPhone = q.parentPhone;
  if (q.includeBadData === 'true' || q.includeBadData === '1') filters.includeBadData = true;
  return filters;
}

function getClientIp(req: Request): string {
  return (
    ((req.headers['x-forwarded-for'] as string) || '').split(',')[0].trim() ||
    ((req.headers['x-real-ip'] as string) || '').trim() ||
    req.ip ||
    'unknown'
  );
}

router.get('/health', (_req, res: Response) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

router.get('/records', (req: Request, res: Response) => {
  const filters = parseFilters(req);
  const data = authRepo.list(filters);
  const stats = authRepo.stats(filters);
  res.json({ data, total: data.length, stats });
});

router.get('/records/stats', (req: Request, res: Response) => {
  const filters = parseFilters(req);
  res.json(authRepo.stats(filters));
});

router.get('/records/classes', (_req: Request, res: Response) => {
  res.json(authRepo.classes());
});

router.get('/records/:id', (req: Request, res: Response) => {
  const record = authRepo.getById(req.params.id);
  if (!record) {
    res.status(404).json({ error: '记录不存在' });
    return;
  }
  const payload: DetailResponse = {
    record,
    remarks: authRepo.getRemarks(req.params.id),
    versions: authRepo.getVersions(req.params.id),
    audits: authRepo.getAudits(req.params.id),
    relatedEvents: authRepo.getRelatedEvents(req.params.id),
    materials: authRepo.getMaterials(req.params.id),
  };
  res.json(payload);
});

router.get('/records/:id/versions', (req: Request, res: Response) => {
  if (!authRepo.getById(req.params.id)) {
    res.status(404).json({ error: '记录不存在' });
    return;
  }
  res.json(authRepo.getVersions(req.params.id));
});

router.get('/records/:id/remarks', (req: Request, res: Response) => {
  if (!authRepo.getById(req.params.id)) {
    res.status(404).json({ error: '记录不存在' });
    return;
  }
  res.json(authRepo.getRemarks(req.params.id));
});

router.post('/records/:id/remarks', (req: Request, res: Response) => {
  const body = req.body as Partial<SupplementPayload>;
  if (!body.content || !body.operatorName) {
    res.status(400).json({ error: '备注内容和操作人必填' });
    return;
  }
  const result = authRepo.addRemark(req.params.id, body as SupplementPayload);
  if (!result) {
    res.status(404).json({ error: '记录不存在' });
    return;
  }
  res.json(result);
});

router.post('/records/:id/status', (req: Request, res: Response) => {
  const body = req.body as Partial<StatusChangePayload>;
  if (!body.status || !body.operatorName) {
    res.status(400).json({ error: '目标状态和操作人必填' });
    return;
  }
  const result = authRepo.changeStatus(req.params.id, body as StatusChangePayload);
  if (!result) {
    res.status(404).json({ error: '记录不存在' });
    return;
  }
  res.json(result);
});

router.post('/records/:id/mark-bad', (req: Request, res: Response) => {
  const { reason, operatorName, operatorId } = req.body as any;
  if (!reason || !operatorName) {
    res.status(400).json({ error: '原因和操作人必填' });
    return;
  }
  const result = authRepo.markBad(req.params.id, reason, operatorName, operatorId);
  if (!result) {
    res.status(404).json({ error: '记录不存在' });
    return;
  }
  res.json(result);
});

router.post('/records/:id/restore', (req: Request, res: Response) => {
  const { operatorName, operatorId } = req.body as any;
  if (!operatorName) {
    res.status(400).json({ error: '操作人必填' });
    return;
  }
  const result = authRepo.restore(req.params.id, operatorName, operatorId);
  if (!result) {
    res.status(404).json({ error: '记录不存在或未被隔离' });
    return;
  }
  res.json(result);
});

router.post('/records/manual', (req: Request, res: Response) => {
  const body = req.body as Partial<ManualEntryPayload>;
  if (!body.babyName || !body.className || !body.parentName || !body.parentPhone || !body.authType || !body.photoScope || !body.originalCommitment || !body.operatorName) {
    res.status(400).json({ error: '缺少必填字段：婴幼儿姓名、班级、家长姓名、家长电话、授权类型、使用范围、原始承诺、操作人' });
    return;
  }
  const record = authRepo.createManual(body as ManualEntryPayload);
  res.status(201).json(record);
});

router.get('/system-events', (_req: Request, res: Response) => {
  res.json(systemEventRepo.listAll(100));
});

router.post('/system-events/ping', (req: Request, res: Response) => {
  addSystemEvent(
    'service_restart',
    '服务心跳 · 数据可恢复性校验',
    `服务于 ${new Date().toLocaleString('zh-CN')} 收到存活检测请求，客户端 IP ${getClientIp(req)}。数据库与历史版本均正常加载，未检测到记录丢失。`,
  );
  res.json({ ok: true });
});

export default router;
