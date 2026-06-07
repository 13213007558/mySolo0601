import { Router, type Request, type Response } from 'express';
import { mockDb } from '../db/mockDb.js';

const router = Router();

router.get('/', (req: Request, res: Response): void => {
  const classes = mockDb.getClasses();

  const enriched = classes.map((cls) => {
    const babies = mockDb.getBabiesByClassId(cls.id);
    const records = mockDb.getDisinfectionRecordsByClassId(cls.id);
    const completed = records.filter((r) => r.status === 'completed').length;
    const exceptions = records.filter((r) => r.status === 'exception').length;
    const total = records.length || 1;

    return {
      ...cls,
      babyCount: babies.length,
      completionRate: Number((completed / total).toFixed(2)),
      exceptionCount: exceptions,
    };
  });

  res.status(200).json({
    success: true,
    data: enriched,
  });
});

router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const cls = mockDb.findClassById(id);

  if (!cls) {
    res.status(404).json({
      success: false,
      error: `班级不存在: ${id}`,
    });
    return;
  }

  const babies = mockDb.getBabiesByClassId(id);
  const records = mockDb.getDisinfectionRecordsByClassId(id);
  const completed = records.filter((r) => r.status === 'completed').length;
  const exceptions = records.filter((r) => r.status === 'exception').length;
  const total = records.length || 1;

  res.status(200).json({
    success: true,
    data: {
      ...cls,
      babyCount: babies.length,
      completionRate: Number((completed / total).toFixed(2)),
      exceptionCount: exceptions,
      babies,
      records,
    },
  });
});

export default router;
