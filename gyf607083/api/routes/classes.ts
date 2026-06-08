import { Router, Request, Response } from 'express';
import { getAllClassesWithStats, getClassById, getClassStats } from '../services/classService';
import { getBabiesByClassId } from '../services/babyService';
import { auditMiddleware } from '../middleware/audit';

const router = Router();

router.get('/', 
  auditMiddleware('update', 'class'),
  (req: Request, res: Response) => {
    try {
      const classes = getAllClassesWithStats();
      res.json({ success: true, data: classes });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

router.get('/:id', 
  auditMiddleware('update', 'class'),
  (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const classData = getClassById(id);
      if (!classData) {
        return res.status(404).json({ success: false, error: '班级不存在' });
      }
      
      const stats = getClassStats(id);
      const babies = getBabiesByClassId(id);
      
      res.json({
        success: true,
        data: {
          ...classData,
          ...stats,
          babies
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

router.get('/:id/stats', 
  auditMiddleware('update', 'class'),
  (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const stats = getClassStats(id);
      if (!stats) {
        return res.status(404).json({ success: false, error: '班级不存在' });
      }
      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

export default router;
