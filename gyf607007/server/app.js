const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const services = require('./services');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/records', (req, res) => {
  try {
    const records = services.listRecords(req.query.status);
    res.json({ ok: true, data: records });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/records/:id', (req, res) => {
  try {
    const record = services.getRecordDetail(req.params.id);
    if (!record) {
      return res.status(404).json({ ok: false, error: '记录不存在' });
    }
    res.json({ ok: true, data: record });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/records/import', (req, res) => {
  try {
    const { items, operator } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ ok: false, error: 'items 必须是数组' });
    }
    const result = services.importBatch(items, operator || '夜班老师');
    res.json({ ok: true, data: result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/records/:id/submit', (req, res) => {
  try {
    const { operator, remark } = req.body;
    const record = services.submitForReview(
      parseInt(req.params.id),
      operator || '夜班老师',
      remark
    );
    res.json({ ok: true, data: record });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.post('/api/records/:id/return', (req, res) => {
  try {
    const { operator, remark } = req.body;
    const record = services.returnForSupplement(
      parseInt(req.params.id),
      operator || '复核老师',
      remark
    );
    res.json({ ok: true, data: record });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.post('/api/records/:id/archive', (req, res) => {
  try {
    const { operator, remark } = req.body;
    const record = services.closeAndArchive(
      parseInt(req.params.id),
      operator || '主管',
      remark
    );
    res.json({ ok: true, data: record });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.post('/api/records/:id/pages', (req, res) => {
  try {
    const { pages, operator } = req.body;
    if (!pages || !Array.isArray(pages)) {
      return res.status(400).json({ ok: false, error: 'pages 必须是数组' });
    }
    const result = services.addRecordPages(
      parseInt(req.params.id),
      pages,
      operator || '夜班老师'
    );
    res.json({ ok: true, data: result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.get('/api/audits', (req, res) => {
  try {
    const audits = services.listAudits(req.query.record_id);
    res.json({ ok: true, data: audits });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/exports', (req, res) => {
  try {
    const exports = services.listExports();
    res.json({ ok: true, data: exports });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/export', (req, res) => {
  try {
    const { record_ids, operator } = req.body;
    if (!record_ids || !Array.isArray(record_ids)) {
      return res.status(400).json({ ok: false, error: 'record_ids 必须是数组' });
    }
    const result = services.exportRecords(record_ids, operator || '主管');
    res.json({ ok: true, data: result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/exports/download/:fileName', (req, res) => {
  try {
    const fileName = req.params.fileName;
    const filePath = path.join(__dirname, '..', 'exports', fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ ok: false, error: '文件不存在' });
    }
    res.download(filePath, fileName);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`婴幼儿睡眠观察回访册夜班交接版 已启动: http://localhost:${PORT}`);
});
