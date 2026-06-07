import { Router, type Request, type Response } from 'express';
import { babies, reviews, toExportRows } from '../data/mockData.js';
import type { MorningReview, AuditLog, ApiResponse, ExportRow, Baby } from '../../shared/types.js';

const router = Router();

router.get('/export', (_req: Request, res: Response<ApiResponse<ExportRow[]>>) => {
  res.json({ success: true, data: toExportRows() });
});

router.get('/babies', (_req: Request, res: Response<ApiResponse<Baby[]>>) => {
  res.json({ success: true, data: babies });
});

router.get('/', (_req: Request, res: Response<ApiResponse<MorningReview[]>>) => {
  res.json({ success: true, data: reviews });
});

router.get('/:id', (req: Request, res: Response<ApiResponse<MorningReview>>) => {
  const r = reviews.find((x) => x.id === req.params.id);
  if (!r) return res.status(404).json({ success: false, error: '未找到复核记录' });
  res.json({ success: true, data: r });
});

router.post(
  '/:id/advance',
  (req: Request<{ id: string }, ApiResponse<MorningReview>, { stage: MorningReview['reviewStage']; operator: string }>,
    res: Response,
  ) => {
    const r = reviews.find((x) => x.id === req.params.id);
    if (!r) return res.status(404).json({ success: false, error: '未找到复核记录' });
    const snapshotBefore = JSON.parse(JSON.stringify(r)) as MorningReview;
    r.reviewStage = req.body.stage;
    r.updatedAt = new Date().toISOString();
    const audit: AuditLog = {
      id: 'a' + Date.now(),
      reviewId: r.id,
      action: 'status_changed',
      operator: req.body.operator,
      operatorRole: r.reviewStage === 'kitchen' ? 'kitchen' : r.reviewStage === 'manager' ? 'manager' : 'waiter',
      timestamp: new Date().toISOString(),
      note: `流程推进至：${r.reviewStage}`,
      snapshotBefore,
      snapshotAfter: JSON.parse(JSON.stringify(r)),
    };
    r.auditLogs.push(audit);
    res.json({ success: true, data: r });
  },
);

router.post(
  '/:id/supplement',
  (
    req: Request<
      { id: string },
      ApiResponse<MorningReview>,
      { temperature?: number; leaveReason?: string; operator: string; operatorRole: AuditLog['operatorRole'] }
    >,
    res: Response,
  ) => {
    const r = reviews.find((x) => x.id === req.params.id);
    if (!r) return res.status(404).json({ success: false, error: '未找到复核记录' });
    const snapshotBefore = JSON.parse(JSON.stringify(r)) as MorningReview;

    if (req.body.temperature != null) {
      r.thermometerRecords.push({
        id: 't' + Date.now(),
        reviewId: r.id,
        temperature: req.body.temperature,
        measuredAt: new Date().toISOString(),
        deviceId: 'MANUAL',
        status: 'normal',
      });
      r.temperatureStatus = 'normal';
    }
    if (req.body.leaveReason) {
      r.leaveRequests.push({
        id: 'l' + Date.now(),
        reviewId: r.id,
        reason: req.body.leaveReason,
        submittedAt: new Date().toISOString(),
        status: 'normal',
      });
      r.leaveStatus = 'normal';
    }
    if (r.temperatureStatus === 'normal' && r.leaveStatus === 'normal') {
      r.overallStatus = 'normal';
      r.status = 'supplemented';
    }
    r.wasManuallySupplemented = true;
    r.hasPhotoMissing = r.thermometerRecords.some((t) => !t.photoUrl) || r.leaveRequests.some((l) => !l.photoUrl);
    r.updatedAt = new Date().toISOString();

    const audit: AuditLog = {
      id: 'a' + Date.now(),
      reviewId: r.id,
      action: 'manual_supplement',
      operator: req.body.operator,
      operatorRole: req.body.operatorRole,
      timestamp: new Date().toISOString(),
      note: '手工补录晨检数据',
      snapshotBefore,
      snapshotAfter: JSON.parse(JSON.stringify(r)),
    };
    r.auditLogs.push(audit);

    res.json({ success: true, data: r });
  },
);

router.post(
  '/:id/submit-partial',
  (
    req: Request<{ id: string }, ApiResponse<MorningReview>, { operator: string; note: string }>,
    res: Response,
  ) => {
    const r = reviews.find((x) => x.id === req.params.id);
    if (!r) return res.status(404).json({ success: false, error: '未找到复核记录' });
    r.hasPhotoMissing = true;
    r.reviewStage = 'kitchen';
    r.status = 'passed';
    r.updatedAt = new Date().toISOString();

    const audit: AuditLog = {
      id: 'a' + Date.now(),
      reviewId: r.id,
      action: 'photo_missing',
      operator: req.body.operator,
      operatorRole: 'waiter',
      timestamp: new Date().toISOString(),
      note: req.body.note || '照片缺失但允许部分成功提交',
    };
    r.auditLogs.push(audit);

    res.json({ success: true, data: r });
  },
);

router.get(
  '/:id/audit',
  (req: Request, res: Response<ApiResponse<AuditLog[]>>) => {
    const r = reviews.find((x) => x.id === req.params.id);
    if (!r) return res.status(404).json({ success: false, error: '未找到复核记录' });
    res.json({ success: true, data: r.auditLogs });
  },
);

export default router;
