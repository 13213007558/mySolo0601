const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const {
  STATUS_FLOW,
  createRecord,
  updateRecordStatus,
  addMaterial,
  queryRecords,
  getRecordById,
  getBadDataList,
  exportRecords
} = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

function broadcastUpdate(type, data) {
  io.emit(type, data);
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.get('/api/status-flow', (req, res) => {
  res.json(STATUS_FLOW);
});

app.get('/api/records', (req, res) => {
  const filters = {
    status: req.query.status,
    keyword: req.query.keyword,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    handler: req.query.handler
  };
  const records = queryRecords(filters);
  res.json({ data: records, total: records.length });
});

app.get('/api/records/:id', (req, res) => {
  const record = getRecordById(req.params.id);
  if (!record) {
    return res.status(404).json({ error: '记录不存在' });
  }
  res.json(record);
});

app.post('/api/records', (req, res) => {
  const result = createRecord(req.body);
  if (result.error) {
    return res.status(400).json(result);
  }
  broadcastUpdate('record:created', result);
  res.status(201).json(result);
});

app.post('/api/records/:id/status', (req, res) => {
  const { status, operator, reason } = req.body;
  if (!status || !operator) {
    return res.status(400).json({ error: '状态和操作人必填' });
  }
  const result = updateRecordStatus(req.params.id, status, operator, reason);
  if (result.error) {
    return res.status(400).json(result);
  }
  broadcastUpdate('record:updated', result);
  res.json(result);
});

app.post('/api/records/:id/materials', (req, res) => {
  const { content, operator } = req.body;
  if (!content || !operator) {
    return res.status(400).json({ error: '材料内容和操作人必填' });
  }
  const result = addMaterial(req.params.id, content, operator);
  if (result.error) {
    return res.status(400).json(result);
  }
  broadcastUpdate('record:updated', result);
  res.json(result);
});

app.get('/api/bad-data', (req, res) => {
  res.json({ data: getBadDataList() });
});

app.get('/api/export', (req, res) => {
  const filters = {
    status: req.query.status,
    keyword: req.query.keyword,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    handler: req.query.handler
  };
  const data = exportRecords(filters);

  const headers = ['ID', '婴幼儿姓名', '桌号', '奶类型', '奶量(ml)', '温度', '状态', '原因', '处理人', '录入人', '创建时间', '更新时间', '特殊说明'];
  const rows = data.map(r => [
    r.id,
    r.childName,
    r.tableNumber,
    r.milkType,
    r.amount,
    r.temperature,
    r.status,
    r.reason,
    r.handler,
    r.createdBy,
    r.createdAt,
    r.updatedAt,
    r.specialInstructions
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const dateStr = new Date().toISOString().slice(0, 10);
  const fileNameCn = `奶量交接记录_${dateStr}.csv`;
  const encodedName = encodeURIComponent(fileNameCn);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="milk_records_${dateStr}.csv"; filename*=UTF-8''${encodedName}`);
  const csvWithBom = '\uFEFF' + csv;
  res.send(csvWithBom);
});

io.on('connection', (socket) => {
  console.log('客户端连接:', socket.id);
  socket.on('disconnect', () => {
    console.log('客户端断开:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`奶量交接追踪台后端服务运行在 http://localhost:${PORT}`);
});
