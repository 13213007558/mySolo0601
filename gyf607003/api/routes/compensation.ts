import { Router } from 'express';
import { requireRole } from '../middleware/auth.js';
import {
  listCompensationTasks,
  getCompensationTaskById,
  updateCompensationTaskStatus,
} from '../services/audit.js';
import { compensationScheduler } from '../services/compensation.js';
import { getFailureSimulation, setFailureSimulation } from '../services/exceptions.js';

const router = Router();

router.get('/tasks', requireRole(['supervisor', 'admin']), (req, res) => {
  const { status } = req.query;
  const tasks = listCompensationTasks(status as 'pending' | 'processing' | 'success' | 'failed' | undefined);
  res.json({ success: true, data: tasks });
});

router.get('/tasks/:id', requireRole(['supervisor', 'admin']), (req, res) => {
  const task = getCompensationTaskById(req.params.id);
  if (!task) {
    res.status(404).json({ success: false, error: 'Compensation task not found' });
    return;
  }
  res.json({ success: true, data: task });
});

router.put('/tasks/:id/retry', requireRole(['supervisor', 'admin']), (req, res) => {
  updateCompensationTaskStatus(req.params.id, 'pending', { incrementRetry: false });
  res.json({ success: true, message: 'Task requeued for retry' });
});

router.get('/scheduler/status', requireRole(['supervisor', 'admin']), (_req, res) => {
  res.json({ success: true, data: compensationScheduler.getStatus() });
});

router.post('/scheduler/start', requireRole(['admin']), async (_req, res) => {
  if (compensationScheduler.isRunning()) {
    res.json({ success: true, message: 'Scheduler already running', data: compensationScheduler.getStatus() });
    return;
  }
  await compensationScheduler.start();
  res.json({ success: true, message: 'Scheduler started', data: compensationScheduler.getStatus() });
});

router.post('/scheduler/stop', requireRole(['admin']), (_req, res) => {
  if (!compensationScheduler.isRunning()) {
    res.json({ success: true, message: 'Scheduler already stopped', data: compensationScheduler.getStatus() });
    return;
  }
  compensationScheduler.stop();
  res.json({ success: true, message: 'Scheduler stopped', data: compensationScheduler.getStatus() });
});

router.get('/failure-simulation', requireRole(['admin']), (_req, res) => {
  res.json({ success: true, data: getFailureSimulation() });
});

router.post('/failure-simulation', requireRole(['admin']), (req, res) => {
  setFailureSimulation(req.body);
  res.json({ success: true, data: getFailureSimulation() });
});

export default router;
