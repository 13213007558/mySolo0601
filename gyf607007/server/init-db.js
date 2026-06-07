const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const exportsDir = path.join(__dirname, '..', 'exports');
const dbPath = path.join(dataDir, 'db.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(exportsDir)) {
  fs.mkdirSync(exportsDir, { recursive: true });
}

if (!fs.existsSync(dbPath)) {
  const initData = {
    children: [],
    records: [],
    record_pages: [],
    timeline_events: [],
    audits: [],
    exports: [],
    seqs: { children: 0, records: 0, record_pages: 0, timeline_events: 0, audits: 0, exports: 0 }
  };
  fs.writeFileSync(dbPath, JSON.stringify(initData, null, 2), 'utf8');
}

console.log('数据库初始化完成');
