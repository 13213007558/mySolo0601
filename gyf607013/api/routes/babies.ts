import { Router, type Request, type Response } from 'express';
import { mockDb } from '../db/mockDb.js';
import { desensitizeBaby } from '../services/privacyService.js';

const router = Router();

router.get('/', (req: Request, res: Response): void => {
  const { classId } = req.query;
  const role = (req.userRole as import('../../src/types/index.js').UserRole) || 'staff';

  let babies = mockDb.getBabies();

  if (classId && typeof classId === 'string') {
    babies = babies.filter((b) => b.classId === classId);
  }

  const desensitized = babies.map((b) => desensitizeBaby(b, role));

  res.status(200).json({
    success: true,
    data: desensitized,
  });
});

router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const role = (req.userRole as import('../../src/types/index.js').UserRole) || 'staff';

  const baby = mockDb.findBabyById(id);
  if (!baby) {
    res.status(404).json({
      success: false,
      error: `宝宝不存在: ${id}`,
    });
    return;
  }

  const records = mockDb.getDisinfectionRecordsByBabyId(id);
  const followUps = mockDb.getFollowUpNotesByBabyId(id);
  const cls = mockDb.findClassById(baby.classId);

  records.sort(
    (a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime(),
  );
  followUps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.status(200).json({
    success: true,
    data: {
      ...desensitizeBaby(baby, role),
      className: cls?.name,
      disinfectionRecords: records,
      followUpNotes: followUps,
      stats: {
        totalRecords: records.length,
        completed: records.filter((r) => r.status === 'completed').length,
        pending: records.filter((r) => r.status === 'pending').length,
        exceptions: records.filter((r) => r.status === 'exception').length,
        boundaryAudits: records.filter((r) => r.isBoundaryAudit).length,
      },
    },
  });
});

export default router;
