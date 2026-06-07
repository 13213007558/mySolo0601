import { Router, type Request, type Response } from 'express';
import { babies, morningChecks, thermometerLogs, leaveSlips } from '../data/mockData.js';

const router = Router();

router.get('/lookup', (req: Request, res: Response) => {
  const rowNo = Number(req.query.rowNo);
  if (!rowNo) {
    res.status(400).json({ success: false, error: '请提供导出行号 rowNo' });
    return;
  }
  const baby = babies.find((b) => b.exportRowNo === rowNo);
  if (!baby) {
    res.status(404).json({ success: false, error: '未找到对应导出行号的宝宝数据' });
    return;
  }
  const records = morningChecks.filter((r) => r.babyId === baby.id);
  res.json({ success: true, data: { baby, records } });
});

router.get('/thermometer/:id', (req: Request, res: Response) => {
  const log = thermometerLogs.find((t) => t.id === req.params.id);
  if (!log) {
    res.status(404).json({ success: false, error: '体温枪记录不存在' });
    return;
  }
  res.json({ success: true, data: log });
});

router.get('/leaves/:id', (req: Request, res: Response) => {
  const slip = leaveSlips.find((l) => l.id === req.params.id);
  if (!slip) {
    res.status(404).json({ success: false, error: '请假条不存在' });
    return;
  }
  res.json({ success: true, data: slip });
});

export default router;
