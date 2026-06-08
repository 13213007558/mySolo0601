import { Router, type Request, type Response } from 'express';
import type {
  CreateRecordInput,
  UpdateRecordInput,
  ApiResponse,
} from '../../shared/types.js';
import {
  getAllRecords,
  getAllRecordsIncludingInvalid,
  getRecordById,
  getStats,
  createRecord,
  updateRecord,
  supplementRecord,
  invalidateRecord,
} from '../lib/storage.js';

const router = Router();

router.get(
  '/records',
  (req: Request, res: Response<ApiResponse>) => {
    try {
      const includeInvalid = req.query.includeInvalid === 'true';
      const records = includeInvalid
        ? getAllRecordsIncludingInvalid()
        : getAllRecords();
      res.json({ success: true, data: records });
    } catch (err) {
      res
        .status(500)
        .json({ success: false, error: (err as Error).message });
    }
  },
);

router.get(
  '/records/stats',
  (_req: Request, res: Response<ApiResponse>) => {
    try {
      const stats = getStats();
      res.json({ success: true, data: stats });
    } catch (err) {
      res
        .status(500)
        .json({ success: false, error: (err as Error).message });
    }
  },
);

router.get(
  '/records/:id',
  (req: Request, res: Response<ApiResponse>) => {
    try {
      const result = getRecordById(req.params.id);
      if (!result) {
        res.status(404).json({ success: false, error: '记录不存在' });
        return;
      }
      res.json({ success: true, data: result });
    } catch (err) {
      res
        .status(500)
        .json({ success: false, error: (err as Error).message });
    }
  },
);

router.post(
  '/records',
  (req: Request, res: Response<ApiResponse>) => {
    try {
      const input = req.body as CreateRecordInput;
      const result = createRecord(input);
      if (!result.success) {
        res.status(400).json({ success: false, error: result.error });
        return;
      }
      res.status(201).json({ success: true, data: result.data });
    } catch (err) {
      res
        .status(500)
        .json({ success: false, error: (err as Error).message });
    }
  },
);

router.put(
  '/records/:id',
  (req: Request, res: Response<ApiResponse>) => {
    try {
      const input: UpdateRecordInput = { id: req.params.id, ...req.body };
      const result = updateRecord(input);
      if (!result.success) {
        res.status(400).json({ success: false, error: result.error });
        return;
      }
      res.json({ success: true, data: result.data });
    } catch (err) {
      res
        .status(500)
        .json({ success: false, error: (err as Error).message });
    }
  },
);

router.post(
  '/records/:id/supplement',
  (req: Request, res: Response<ApiResponse>) => {
    try {
      const input = req.body as CreateRecordInput;
      const result = supplementRecord(req.params.id, input);
      if (!result.success) {
        res.status(400).json({ success: false, error: result.error });
        return;
      }
      res.status(201).json({ success: true, data: result.data });
    } catch (err) {
      res
        .status(500)
        .json({ success: false, error: (err as Error).message });
    }
  },
);

router.post(
  '/records/:id/invalidate',
  (req: Request, res: Response<ApiResponse>) => {
    try {
      const { reason } = req.body as { reason?: string };
      if (!reason?.trim()) {
        res
          .status(400)
          .json({ success: false, error: '必须提供作废原因' });
        return;
      }
      const result = invalidateRecord(req.params.id, reason.trim());
      if (!result.success) {
        res.status(400).json({ success: false, error: result.error });
        return;
      }
      res.json({ success: true, data: result.data });
    } catch (err) {
      res
        .status(500)
        .json({ success: false, error: (err as Error).message });
    }
  },
);

export default router;
