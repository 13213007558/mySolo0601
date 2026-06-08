import { Router, Request, Response } from 'express';
import { getBabyById, getBabiesByClassId, getAllBabies } from '../services/babyService';
import { getSupplyRecords } from '../services/supplyRecordService';
import { auditMiddleware } from '../middleware/audit';

const router = Router();

router.get('/', 
  auditMiddleware('update', 'baby'),
  (req: Request, res: Response) => {
    try {
      const { classId } = req.query;
      let babies;
      if (classId) {
        babies = getBabiesByClassId(classId as string);
      } else {
        babies = getAllBabies();
      }
      res.json({ success: true, data: babies });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

router.get('/:id', 
  auditMiddleware('update', 'baby'),
  (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const baby = getBabyById(id);
      if (!baby) {
        return res.status(404).json({ success: false, error: '宝宝不存在' });
      }
      
      const records = getSupplyRecords({ babyId: id });
      
      res.json({
        success: true,
        data: {
          ...baby,
          records
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

router.get('/:id/records', 
  auditMiddleware('update', 'baby'),
  (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.query;
      
      const records = getSupplyRecords({
        babyId: id,
        status: status as any
      });
      
      res.json({ success: true, data: records });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

export default router;
