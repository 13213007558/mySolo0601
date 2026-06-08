import { Router, Request, Response } from 'express';
import { getAllUsers, getUserById, getUsersByRole } from '../services/userService';
import { auditMiddleware } from '../middleware/audit';
import { UserRole } from '../../shared/types';

const router = Router();

router.get('/', 
  auditMiddleware('update', 'user'),
  (req: Request, res: Response) => {
    try {
      const { role } = req.query;
      let users;
      if (role) {
        users = getUsersByRole(role as UserRole);
      } else {
        users = getAllUsers();
      }
      res.json({ success: true, data: users });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

router.get('/:id', 
  auditMiddleware('update', 'user'),
  (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = getUserById(id);
      if (!user) {
        return res.status(404).json({ success: false, error: '用户不存在' });
      }
      res.json({ success: true, data: user });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

export default router;
