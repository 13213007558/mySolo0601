import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  createMilkRecordSchema,
  updateMilkRecordSchema,
  reviewRecordSchema,
  feedbackSchema,
  filterSchema,
  RecordStatus,
  RecordSource,
} from '../utils/validation';
import { detectSuspiciousRecord, isolateSuspiciousRecord } from '../utils/suspicious';
import { exportToCsv } from '../utils/export';

const router = Router();
const prisma = new PrismaClient();

router.get('/children', async (req: Request, res: Response) => {
  try {
    const children = await prisma.child.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(children);
  } catch (error) {
    res.status(500).json({ error: '获取孩子列表失败' });
  }
});

router.get('/records', async (req: Request, res: Response) => {
  try {
    const params = filterSchema.parse(req.query);
    const where: any = {};

    if (params.startDate) {
      where.recordDate = { ...where.recordDate, gte: new Date(params.startDate) };
    }
    if (params.endDate) {
      const endDate = new Date(params.endDate);
      endDate.setHours(23, 59, 59, 999);
      where.recordDate = { ...where.recordDate, lte: endDate };
    }
    if (params.childId) {
      where.childId = params.childId;
    }
    if (params.status) {
      where.status = params.status;
    }
    if (params.source) {
      where.source = params.source;
    }

    const total = await prisma.milkRecord.count({ where });
    const records = await prisma.milkRecord.findMany({
      where,
      include: { child: true, feedback: true },
      orderBy: { recordDate: 'desc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    });

    res.json({
      data: records,
      total,
      page: params.page,
      pageSize: params.pageSize,
    });
  } catch (error) {
    res.status(400).json({ error: '参数错误', details: error });
  }
});

router.get('/records/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const record = await prisma.milkRecord.findUnique({
      where: { id },
      include: {
        child: true,
        histories: { orderBy: { operatedAt: 'desc' } },
        reviews: { orderBy: { reviewedAt: 'desc' } },
        feedback: true,
      },
    });

    if (!record) {
      return res.status(404).json({ error: '记录不存在' });
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({ error: '获取记录详情失败' });
  }
});

router.post('/records', async (req: Request, res: Response) => {
  try {
    const body = createMilkRecordSchema.parse(req.body);
    const child = await prisma.child.findUnique({ where: { id: body.childId } });
    
    if (!child) {
      return res.status(400).json({ error: '孩子信息不存在' });
    }

    const { isSuspicious, reason } = await detectSuspiciousRecord(
      body.childId,
      body.amount,
      body.source,
      body.parentMessage,
      body.paperNote
    );

    const recordDate = new Date(body.recordDate);

    const record = await prisma.milkRecord.create({
      data: {
        childId: body.childId,
        recordDate,
        amount: body.amount,
        source: body.source,
        parentMessage: body.parentMessage,
        paperNote: body.paperNote,
        status: isSuspicious ? RecordStatus.SUSPICIOUS : RecordStatus.PENDING,
        reason: isSuspicious ? reason : null,
      },
      include: { child: true },
    });

    if (isSuspicious) {
      await isolateSuspiciousRecord(
        record.id,
        body.childId,
        child.name,
        recordDate,
        body.amount,
        body.source,
        reason,
        body.parentMessage,
        body.paperNote
      );
    }

    await prisma.milkRecordHistory.create({
      data: {
        recordId: record.id,
        oldStatus: RecordStatus.PENDING,
        newStatus: record.status,
        changeNote: isSuspicious ? `系统检测：${reason}` : '新建记录',
        operator: body.operator,
      },
    });

    res.json(record);
  } catch (error) {
    res.status(400).json({ error: '创建记录失败', details: error });
  }
});

router.put('/records/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const body = updateMilkRecordSchema.parse(req.body);

    const existing = await prisma.milkRecord.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: '记录不存在' });
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.amount !== undefined) {
      updateData.amount = body.amount;
    }
    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status !== RecordStatus.PENDING) {
        updateData.handledBy = body.operator;
        updateData.handledAt = new Date();
      }
    }
    if (body.reason !== undefined) {
      updateData.reason = body.reason;
    }

    const updated = await prisma.milkRecord.update({
      where: { id },
      data: updateData,
      include: { child: true },
    });

    await prisma.milkRecordHistory.create({
      data: {
        recordId: id,
        oldStatus: existing.status,
        newStatus: updated.status,
        oldAmount: existing.amount,
        newAmount: updated.amount,
        oldReason: existing.reason,
        newReason: updated.reason,
        changeNote: body.changeNote,
        operator: body.operator,
      },
    });

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: '更新记录失败', details: error });
  }
});

router.post('/records/:id/review', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const body = reviewRecordSchema.parse(req.body);

    const existing = await prisma.milkRecord.findUnique({
      where: { id },
      include: { child: true },
    });
    if (!existing) {
      return res.status(404).json({ error: '记录不存在' });
    }

    const updateData: any = {
      status: body.newStatus,
      reason: body.newReason,
      handledBy: body.reviewer,
      handledAt: new Date(),
    };

    if (body.newAmount !== undefined) {
      updateData.amount = body.newAmount;
    }

    const reviewed = await prisma.milkRecord.update({
      where: { id },
      data: updateData,
      include: { child: true },
    });

    await prisma.milkRecordHistory.create({
      data: {
        recordId: id,
        oldStatus: existing.status,
        newStatus: reviewed.status,
        oldAmount: existing.amount,
        newAmount: reviewed.amount,
        oldReason: existing.reason,
        newReason: reviewed.reason,
        changeNote: `复核：${body.reviewNote}`,
        operator: body.reviewer,
      },
    });

    await prisma.reviewRecord.create({
      data: {
        recordId: id,
        reviewNote: body.reviewNote,
        reviewer: body.reviewer,
      },
    });

    if (body.newStatus !== RecordStatus.SUSPICIOUS) {
      await prisma.suspiciousRecord.updateMany({
        where: { originalId: id, handled: false },
        data: {
          handled: true,
          handledNote: body.reviewNote,
          handledBy: body.reviewer,
          handledAt: new Date(),
        },
      });
    }

    res.json(reviewed);
  } catch (error) {
    res.status(400).json({ error: '复核失败', details: error });
  }
});

router.get('/records/export/csv', async (req: Request, res: Response) => {
  try {
    const params = filterSchema.parse(req.query);
    const where: any = {};

    if (params.startDate) {
      where.recordDate = { ...where.recordDate, gte: new Date(params.startDate) };
    }
    if (params.endDate) {
      const endDate = new Date(params.endDate);
      endDate.setHours(23, 59, 59, 999);
      where.recordDate = { ...where.recordDate, lte: endDate };
    }
    if (params.childId) {
      where.childId = params.childId;
    }
    if (params.status) {
      where.status = params.status;
    }
    if (params.source) {
      where.source = params.source;
    }

    const records = await prisma.milkRecord.findMany({
      where,
      include: { child: true },
      orderBy: { recordDate: 'desc' },
    });

    const filePath = await exportToCsv(records);
    res.download(filePath);
  } catch (error) {
    res.status(400).json({ error: '导出失败', details: error });
  }
});

router.post('/feedback', async (req: Request, res: Response) => {
  try {
    const body = feedbackSchema.parse(req.body);

    const record = await prisma.milkRecord.findUnique({ where: { id: body.recordId } });
    if (!record) {
      return res.status(404).json({ error: '奶量记录不存在' });
    }

    const existing = await prisma.therapyFeedback.findUnique({
      where: { recordId: body.recordId },
    });

    let feedback;
    if (existing) {
      feedback = await prisma.therapyFeedback.update({
        where: { id: existing.id },
        data: {
          content: body.content,
          therapist: body.therapist,
        },
      });
    } else {
      feedback = await prisma.therapyFeedback.create({
        data: {
          recordId: body.recordId,
          childId: body.childId,
          content: body.content,
          therapist: body.therapist,
        },
      });
    }

    res.json(feedback);
  } catch (error) {
    res.status(400).json({ error: '保存反馈失败', details: error });
  }
});

router.get('/feedback/:recordId', async (req: Request, res: Response) => {
  try {
    const recordId = parseInt(req.params.recordId);
    const feedback = await prisma.therapyFeedback.findUnique({
      where: { recordId },
    });
    res.json(feedback || null);
  } catch (error) {
    res.status(500).json({ error: '获取反馈失败' });
  }
});

router.get('/suspicious', async (req: Request, res: Response) => {
  try {
    const records = await prisma.suspiciousRecord.findMany({
      orderBy: { detectedAt: 'desc' },
    });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: '获取可疑记录失败' });
  }
});

router.post('/suspicious/:id/handle', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { handledNote, handledBy, action, newAmount, newReason } = req.body;

    const suspicious = await prisma.suspiciousRecord.findUnique({ where: { id } });
    if (!suspicious) {
      return res.status(404).json({ error: '可疑记录不存在' });
    }

    if (action === 'confirm' && suspicious.originalId) {
      await prisma.milkRecord.update({
        where: { id: suspicious.originalId },
        data: {
          status: RecordStatus.CONFIRMED,
          amount: newAmount || suspicious.amount,
          reason: newReason || '人工复核确认有效',
          handledBy,
          handledAt: new Date(),
        },
      });

      await prisma.milkRecordHistory.create({
        data: {
          recordId: suspicious.originalId,
          oldStatus: RecordStatus.SUSPICIOUS,
          newStatus: RecordStatus.CONFIRMED,
          oldAmount: suspicious.amount,
          newAmount: newAmount || suspicious.amount,
          oldReason: suspicious.suspiciousReason,
          newReason: newReason || '人工复核确认有效',
          changeNote: `可疑记录处理：${handledNote}`,
          operator: handledBy,
        },
      });
    } else if (action === 'reject' && suspicious.originalId) {
      await prisma.milkRecord.update({
        where: { id: suspicious.originalId },
        data: {
          status: RecordStatus.REJECTED,
          reason: newReason || '人工复核判定无效',
          handledBy,
          handledAt: new Date(),
        },
      });

      await prisma.milkRecordHistory.create({
        data: {
          recordId: suspicious.originalId,
          oldStatus: RecordStatus.SUSPICIOUS,
          newStatus: RecordStatus.REJECTED,
          oldReason: suspicious.suspiciousReason,
          newReason: newReason || '人工复核判定无效',
          changeNote: `可疑记录处理：${handledNote}`,
          operator: handledBy,
        },
      });
    }

    const handled = await prisma.suspiciousRecord.update({
      where: { id },
      data: {
        handled: true,
        handledNote,
        handledBy,
        handledAt: new Date(),
      },
    });

    res.json(handled);
  } catch (error) {
    res.status(400).json({ error: '处理可疑记录失败', details: error });
  }
});

router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    const total = await prisma.milkRecord.count();
    const pending = await prisma.milkRecord.count({ where: { status: RecordStatus.PENDING } });
    const confirmed = await prisma.milkRecord.count({ where: { status: RecordStatus.CONFIRMED } });
    const reviewed = await prisma.milkRecord.count({ where: { status: RecordStatus.REVIEWED } });
    const suspicious = await prisma.milkRecord.count({ where: { status: RecordStatus.SUSPICIOUS } });
    const rejected = await prisma.milkRecord.count({ where: { status: RecordStatus.REJECTED } });

    res.json({ total, pending, confirmed, reviewed, suspicious, rejected });
  } catch (error) {
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

export default router;
