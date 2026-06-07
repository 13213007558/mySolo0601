const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, 'data');
const RECORDS_FILE = path.join(DATA_DIR, 'records.json');
const AUDIT_FILE = path.join(DATA_DIR, 'audit.json');
const BAD_DATA_FILE = path.join(DATA_DIR, 'bad_data.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(RECORDS_FILE)) {
    fs.writeFileSync(RECORDS_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(AUDIT_FILE)) {
    fs.writeFileSync(AUDIT_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(BAD_DATA_FILE)) {
    fs.writeFileSync(BAD_DATA_FILE, JSON.stringify([], null, 2));
  }
}

function readJSON(filePath) {
  ensureDataDir();
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    return [];
  }
}

function writeJSON(filePath, data) {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

const STATUS_FLOW = {
  PENDING: '待接单',
  ACCEPTED: '已接单',
  PREPARING: '冲奶中',
  READY: '奶已备好',
  DELIVERED: '已送达',
  CLOSED: '已完成',
  REJECTED: '已驳回',
  CANCELLED: '已取消'
};

const ROLES = ['服务员', '厨房', '后场', '财务', '店长'];

function createRecord(data) {
  const records = readJSON(RECORDS_FILE);
  const record = {
    id: uuidv4(),
    childName: data.childName || '',
    tableNumber: data.tableNumber || '',
    parentContact: data.parentContact || '',
    milkType: data.milkType || '配方奶',
    amount: Number(data.amount) || 0,
    temperature: data.temperature || '40℃',
    specialInstructions: data.specialInstructions || '',
    source: data.source || '现场',
    status: 'PENDING',
    handler: null,
    createdBy: data.createdBy || '系统录入',
    rejectReason: null,
    closeReason: null,
    materials: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (!record.childName || record.amount <= 0) {
    const badDataList = readJSON(BAD_DATA_FILE);
    badDataList.push({
      id: uuidv4(),
      rawData: data,
      reason: !record.childName ? '缺少婴幼儿姓名' : '奶量数据异常',
      reportedBy: data.createdBy || '系统',
      reportedAt: new Date().toISOString()
    });
    writeJSON(BAD_DATA_FILE, badDataList);
    return { error: '数据校验失败，已移入坏数据区', isBadData: true };
  }

  records.unshift(record);
  writeJSON(RECORDS_FILE, records);

  addAuditLog({
    recordId: record.id,
    action: '创建记录',
    operator: data.createdBy || '系统录入',
    detail: `创建奶量记录：${record.childName} ${record.amount}ml`
  });

  return record;
}

function updateRecordStatus(id, status, operator, reason) {
  const records = readJSON(RECORDS_FILE);
  const idx = records.findIndex(r => r.id === id);
  if (idx === -1) return { error: '记录不存在' };

  const oldStatus = records[idx].status;
  records[idx].status = status;
  records[idx].handler = operator;
  records[idx].updatedAt = new Date().toISOString();

  if (status === 'REJECTED' && reason) {
    records[idx].rejectReason = reason;
  }
  if (status === 'CLOSED' && reason) {
    records[idx].closeReason = reason;
  }

  writeJSON(RECORDS_FILE, records);

  addAuditLog({
    recordId: id,
    action: '状态变更',
    operator,
    detail: `状态从 ${STATUS_FLOW[oldStatus] || oldStatus} 变更为 ${STATUS_FLOW[status] || status}${reason ? `，原因：${reason}` : ''}`
  });

  return records[idx];
}

function addMaterial(id, material, operator) {
  const records = readJSON(RECORDS_FILE);
  const idx = records.findIndex(r => r.id === id);
  if (idx === -1) return { error: '记录不存在' };

  const isClosed = records[idx].status === 'CLOSED' || records[idx].status === 'CANCELLED';

  records[idx].materials.push({
    id: uuidv4(),
    content: material,
    addedBy: operator,
    addedAt: new Date().toISOString(),
    isAfterClose: isClosed
  });
  records[idx].updatedAt = new Date().toISOString();

  writeJSON(RECORDS_FILE, records);

  addAuditLog({
    recordId: id,
    action: isClosed ? '已关闭后追加材料' : '追加材料',
    operator,
    detail: material
  });

  return records[idx];
}

function addAuditLog(log) {
  const logs = readJSON(AUDIT_FILE);
  logs.unshift({
    id: uuidv4(),
    recordId: log.recordId,
    action: log.action,
    operator: log.operator || '系统',
    detail: log.detail,
    timestamp: new Date().toISOString()
  });
  writeJSON(AUDIT_FILE, logs);
}

function queryRecords(filters = {}) {
  let records = readJSON(RECORDS_FILE);

  if (filters.status) {
    records = records.filter(r => r.status === filters.status);
  }
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase();
    records = records.filter(r =>
      r.childName.toLowerCase().includes(kw) ||
      (r.tableNumber && r.tableNumber.toLowerCase().includes(kw)) ||
      (r.parentContact && r.parentContact.toLowerCase().includes(kw))
    );
  }
  if (filters.startDate) {
    records = records.filter(r => r.createdAt >= filters.startDate);
  }
  if (filters.endDate) {
    records = records.filter(r => r.createdAt <= filters.endDate + 'T23:59:59.999Z');
  }
  if (filters.handler) {
    records = records.filter(r => r.handler === filters.handler);
  }

  return records;
}

function getRecordById(id) {
  const records = readJSON(RECORDS_FILE);
  const record = records.find(r => r.id === id);
  if (!record) return null;

  const audits = readJSON(AUDIT_FILE).filter(a => a.recordId === id);
  const handlerIssue = audits.some(a => a.operator === '系统' || !a.operator)
    ? '存在未记录处理人的操作，请查看审计日志详情'
    : null;
  const closedWithMaterials = (record.status === 'CLOSED' || record.status === 'CANCELLED') &&
    record.materials.some(m => m.isAfterClose)
    ? '该记录已关闭后仍有材料追加'
    : null;

  return {
    ...record,
    audits,
    issues: [handlerIssue, closedWithMaterials].filter(Boolean)
  };
}

function getBadDataList() {
  return readJSON(BAD_DATA_FILE);
}

function exportRecords(filters = {}) {
  const records = queryRecords(filters);
  return records.map(r => ({
    id: r.id,
    childName: r.childName,
    tableNumber: r.tableNumber,
    milkType: r.milkType,
    amount: r.amount,
    temperature: r.temperature,
    status: STATUS_FLOW[r.status] || r.status,
    reason: r.rejectReason || r.closeReason || '',
    handler: r.handler || '未指定',
    createdBy: r.createdBy,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    specialInstructions: r.specialInstructions
  }));
}

function seedDemoData() {
  const records = readJSON(RECORDS_FILE);
  if (records.length > 0) return;

  const demoData = [
    { childName: '小明', tableNumber: 'A3', amount: 180, milkType: '配方奶', temperature: '40℃', source: '家长群', parentContact: '13800138001', createdBy: '张服务员' },
    { childName: '小红', tableNumber: 'B1', amount: 150, milkType: '母乳', temperature: '37℃', source: '现场', specialInstructions: '不要太烫', createdBy: '李服务员' },
    { childName: '豆豆', tableNumber: 'C5', amount: 210, milkType: '配方奶', temperature: '40℃', source: '纸质交接单', createdBy: '王服务员' },
    { childName: '果果', tableNumber: 'A2', amount: 120, milkType: '配方奶', temperature: '42℃', source: '家长群', parentContact: '13900139002', createdBy: '张服务员' }
  ];

  demoData.forEach((d, i) => {
    const record = createRecord(d);
    if (!record.error) {
      setTimeout(() => {
        if (i === 0) updateRecordStatus(record.id, 'ACCEPTED', '厨房-刘师傅');
        if (i === 1) {
          updateRecordStatus(record.id, 'ACCEPTED', '厨房-陈师傅');
          updateRecordStatus(record.id, 'PREPARING', '厨房-陈师傅');
        }
        if (i === 2) {
          updateRecordStatus(record.id, 'ACCEPTED', '厨房-刘师傅');
          updateRecordStatus(record.id, 'PREPARING', '厨房-刘师傅');
          updateRecordStatus(record.id, 'READY', '厨房-刘师傅');
        }
      }, 100);
    }
  });
}

ensureDataDir();
seedDemoData();

module.exports = {
  STATUS_FLOW,
  ROLES,
  createRecord,
  updateRecordStatus,
  addMaterial,
  queryRecords,
  getRecordById,
  getBadDataList,
  exportRecords,
  addAuditLog
};
