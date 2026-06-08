import express from 'express';
import {
  getAllRecords,
  getRecordById,
  getBadRecords,
  checkThreeDayIngredients,
  manualOverride,
  updateStatus,
  supplementRecord,
  createRecord,
  generateExportSummary
} from './store.js';
import { STATUS } from './sampleData.js';

const router = express.Router();

router.get('/records', (req, res) => {
  const includeBad = req.query.includeBad === 'true';
  res.json(getAllRecords(includeBad));
});

router.get('/records/bad', (req, res) => {
  res.json(getBadRecords());
});

router.get('/records/:id', (req, res) => {
  const record = getRecordById(req.params.id);
  if (!record) {
    return res.status(404).json({ error: '记录不存在' });
  }
  res.json(record);
});

router.post('/records', (req, res) => {
  const record = createRecord(req.body);
  req.io.emit('records:update', { type: 'create', record });
  res.status(201).json(record);
});

router.post('/records/:id/check-ingredients', (req, res) => {
  const { operator } = req.body;
  const record = checkThreeDayIngredients(req.params.id, operator || '店长');
  if (!record) return res.status(404).json({ error: '记录不存在或已被隔离' });
  req.io.emit('records:update', { type: 'update', record });
  res.json(record);
});

router.post('/records/:id/manual-override', (req, res) => {
  const { operator, remark } = req.body;
  const record = manualOverride(req.params.id, operator || '店长', remark);
  if (!record) return res.status(404).json({ error: '记录不存在或已被隔离' });
  req.io.emit('records:update', { type: 'update', record });
  res.json(record);
});

router.post('/records/:id/status', (req, res) => {
  const { status, operator, remark } = req.body;
  if (!Object.values(STATUS).includes(status)) {
    return res.status(400).json({ error: '无效的状态值' });
  }
  const record = updateStatus(req.params.id, status, operator || '操作员', remark);
  if (!record) return res.status(404).json({ error: '记录不存在或已被隔离' });
  req.io.emit('records:update', { type: 'update', record });
  res.json(record);
});

router.post('/records/:id/supplement', (req, res) => {
  const { operator, supplementData } = req.body;
  const record = supplementRecord(req.params.id, operator || '服务员', supplementData || {});
  if (!record) return res.status(404).json({ error: '记录不存在或已被隔离' });
  req.io.emit('records:update', { type: 'update', record });
  res.json(record);
});

router.post('/export', (req, res) => {
  const { ids } = req.body;
  const summary = generateExportSummary(ids || getAllRecords().map(r => r.id));
  res.json(summary);
});

export default router;
