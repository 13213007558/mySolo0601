const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const RECORDS_FILE = path.join(DATA_DIR, 'records.json');
const VERSIONS_FILE = path.join(DATA_DIR, 'versions.json');
const ANOMALIES_FILE = path.join(DATA_DIR, 'anomalies.json');

app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadJSON(filePath, defaultValue) {
  ensureDataDir();
  if (!fs.existsSync(filePath)) {
    return defaultValue;
  }
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    console.error(`读取文件失败 ${filePath}:`, e);
    return defaultValue;
  }
}

function saveJSON(filePath, data) {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

function detectAnomalies(record) {
  const anomalies = [];
  
  if (record.photoCount !== undefined && record.photoCount !== null) {
    const countStr = String(record.photoCount);
    if (countStr.includes('张') || countStr.includes('个') || countStr.includes('组')) {
      anomalies.push({
        field: 'photoCount',
        type: 'unit_mixed',
        value: record.photoCount,
        reason: `照片数量包含非数字单位"${countStr.match(/[^\d]/g)?.join('') || ''}"，系统已自动提取数字部分`
      });
    }
    const numVal = parseInt(countStr.replace(/[^\d]/g, ''));
    if (!isNaN(numVal) && (numVal === 0 || numVal >= 100)) {
      anomalies.push({
        field: 'photoCount',
        type: 'boundary_value',
        value: record.photoCount,
        reason: `照片数量${numVal}张处于边界值范围（0或≥100），请确认是否为真实数据`
      });
    }
  }

  if (record.babyAgeDays !== undefined && record.babyAgeDays !== null) {
    const ageStr = String(record.babyAgeDays);
    if (ageStr.includes('天') || ageStr.includes('月') || ageStr.includes('岁')) {
      anomalies.push({
        field: 'babyAgeDays',
        type: 'unit_mixed',
        value: record.babyAgeDays,
        reason: `婴儿年龄包含非数字单位"${ageStr.match(/[^\d]/g)?.join('') || ''}"，请统一使用"天"为单位`
      });
    }
    const numVal = parseInt(ageStr.replace(/[^\d]/g, ''));
    if (!isNaN(numVal) && (numVal <= 0 || numVal > 60)) {
      anomalies.push({
        field: 'babyAgeDays',
        type: 'boundary_value',
        value: record.babyAgeDays,
        reason: `婴儿年龄${numVal}天处于异常范围（≤0或>60天），月子中心正常范围应为1-60天`
      });
    }
  }

  return anomalies;
}

function cleanRecordForStorage(record) {
  const cleaned = { ...record };
  if (cleaned.photoCount !== undefined) {
    const num = parseInt(String(cleaned.photoCount).replace(/[^\d]/g, ''));
    if (!isNaN(num)) {
      cleaned.photoCount = num;
    }
  }
  if (cleaned.babyAgeDays !== undefined) {
    const num = parseInt(String(cleaned.babyAgeDays).replace(/[^\d]/g, ''));
    if (!isNaN(num)) {
      cleaned.babyAgeDays = num;
    }
  }
  return cleaned;
}

app.get('/api/records', (req, res) => {
  const records = loadJSON(RECORDS_FILE, []);
  res.json({
    total: records.length,
    authorized: records.filter(r => r.status === 'authorized').length,
    revoked: records.filter(r => r.status === 'revoked').length,
    pending: records.filter(r => r.status === 'pending').length,
    records: records.map(r => ({
      id: r.id,
      babyName: r.babyName,
      guardianName: r.guardianName,
      roomNo: r.roomNo,
      status: r.status,
      photoCount: r.photoCount,
      babyAgeDays: r.babyAgeDays,
      photoDescription: r.photoDescription,
      rectification: r.rectification,
      isLateRecord: r.isLateRecord,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      latestVersion: r.latestVersion
    }))
  });
});

app.get('/api/records/:id', (req, res) => {
  const records = loadJSON(RECORDS_FILE, []);
  const record = records.find(r => r.id === req.params.id);
  if (!record) {
    return res.status(404).json({ error: '记录不存在' });
  }

  const versions = loadJSON(VERSIONS_FILE, []);
  const anomalies = loadJSON(ANOMALIES_FILE, []);

  const recordVersions = versions
    .filter(v => v.recordId === record.id)
    .sort((a, b) => b.versionNo - a.versionNo);

  const recordAnomalies = anomalies.filter(a => a.recordId === record.id);

  res.json({
    record,
    versions: recordVersions,
    anomalies: recordAnomalies
  });
});

app.post('/api/records', (req, res) => {
  const records = loadJSON(RECORDS_FILE, []);
  const versions = loadJSON(VERSIONS_FILE, []);
  const anomalies = loadJSON(ANOMALIES_FILE, []);

  const detected = detectAnomalies(req.body);
  const cleaned = cleanRecordForStorage(req.body);

  const newId = generateId();
  const now = new Date().toISOString();
  const versionNo = 1;

  const newRecord = {
    id: newId,
    babyName: cleaned.babyName || '',
    guardianName: cleaned.guardianName || '',
    roomNo: cleaned.roomNo || '',
    status: cleaned.status || 'pending',
    photoCount: cleaned.photoCount || 0,
    babyAgeDays: cleaned.babyAgeDays || null,
    photoDescription: cleaned.photoDescription || '',
    rectification: cleaned.rectification || '',
    operatorName: cleaned.operatorName || '',
    isLateRecord: cleaned.isLateRecord || false,
    remark: cleaned.remark || '',
    createdAt: now,
    updatedAt: now,
    latestVersion: versionNo
  };

  const newVersion = {
    id: generateId(),
    recordId: newId,
    versionNo: versionNo,
    operationType: cleaned.isLateRecord ? 'late_create' : 'create',
    operatorName: cleaned.operatorName || '',
    remark: cleaned.remark || '',
    snapshot: JSON.parse(JSON.stringify(newRecord)),
    createdAt: now
  };

  records.push(newRecord);
  versions.push(newVersion);

  detected.forEach(a => {
    anomalies.push({
      id: generateId(),
      recordId: newId,
      versionId: newVersion.id,
      versionNo: versionNo,
      ...a,
      createdAt: now
    });
  });

  saveJSON(RECORDS_FILE, records);
  saveJSON(VERSIONS_FILE, versions);
  saveJSON(ANOMALIES_FILE, anomalies);

  res.json({ id: newId, versionNo, anomalies: detected });
});

app.put('/api/records/:id', (req, res) => {
  const records = loadJSON(RECORDS_FILE, []);
  const versions = loadJSON(VERSIONS_FILE, []);
  const anomalies = loadJSON(ANOMALIES_FILE, []);

  const recordIndex = records.findIndex(r => r.id === req.params.id);
  if (recordIndex === -1) {
    return res.status(404).json({ error: '记录不存在' });
  }

  const existingRecord = records[recordIndex];
  const detected = detectAnomalies(req.body);
  const cleaned = cleanRecordForStorage(req.body);

  const currentMaxVersion = versions
    .filter(v => v.recordId === existingRecord.id)
    .reduce((max, v) => Math.max(max, v.versionNo), 0);
  const newVersionNo = currentMaxVersion + 1;
  const now = new Date().toISOString();

  const updatedRecord = {
    ...existingRecord,
    babyName: cleaned.babyName !== undefined ? cleaned.babyName : existingRecord.babyName,
    guardianName: cleaned.guardianName !== undefined ? cleaned.guardianName : existingRecord.guardianName,
    roomNo: cleaned.roomNo !== undefined ? cleaned.roomNo : existingRecord.roomNo,
    status: cleaned.status !== undefined ? cleaned.status : existingRecord.status,
    photoCount: cleaned.photoCount !== undefined ? cleaned.photoCount : existingRecord.photoCount,
    babyAgeDays: cleaned.babyAgeDays !== undefined ? cleaned.babyAgeDays : existingRecord.babyAgeDays,
    photoDescription: cleaned.photoDescription !== undefined ? cleaned.photoDescription : existingRecord.photoDescription,
    rectification: cleaned.rectification !== undefined ? cleaned.rectification : existingRecord.rectification,
    operatorName: cleaned.operatorName !== undefined ? cleaned.operatorName : existingRecord.operatorName,
    isLateRecord: cleaned.isLateRecord !== undefined ? cleaned.isLateRecord : existingRecord.isLateRecord,
    remark: cleaned.remark !== undefined ? cleaned.remark : existingRecord.remark,
    updatedAt: now,
    latestVersion: newVersionNo
  };

  const newVersion = {
    id: generateId(),
    recordId: existingRecord.id,
    versionNo: newVersionNo,
    operationType: cleaned.isLateRecord ? 'late_supplement' : 'update',
    operatorName: cleaned.operatorName || '',
    remark: cleaned.remark || '',
    snapshot: JSON.parse(JSON.stringify(updatedRecord)),
    previousStatus: existingRecord.status,
    newStatus: updatedRecord.status,
    createdAt: now
  };

  records[recordIndex] = updatedRecord;
  versions.push(newVersion);

  detected.forEach(a => {
    anomalies.push({
      id: generateId(),
      recordId: existingRecord.id,
      versionId: newVersion.id,
      versionNo: newVersionNo,
      ...a,
      createdAt: now
    });
  });

  saveJSON(RECORDS_FILE, records);
  saveJSON(VERSIONS_FILE, versions);
  saveJSON(ANOMALIES_FILE, anomalies);

  res.json({ id: existingRecord.id, versionNo: newVersionNo, anomalies: detected });
});

app.get('/api/versions/:recordId', (req, res) => {
  const versions = loadJSON(VERSIONS_FILE, []);
  const recordVersions = versions
    .filter(v => v.recordId === req.params.recordId)
    .sort((a, b) => b.versionNo - a.versionNo);
  res.json(recordVersions);
});

app.get('/api/anomalies/:recordId', (req, res) => {
  const anomalies = loadJSON(ANOMALIES_FILE, []);
  const recordAnomalies = anomalies
    .filter(a => a.recordId === req.params.recordId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(recordAnomalies);
});

function initSampleData() {
  const records = loadJSON(RECORDS_FILE, null);
  if (records && records.length > 0) return;

  const now = new Date();
  const minusDays = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();

  const sampleRecords = [
    {
      id: 'REC001',
      babyName: '李小宝',
      guardianName: '王丽华',
      roomNo: '301-A',
      status: 'authorized',
      photoCount: 15,
      babyAgeDays: 12,
      photoDescription: '新生儿抚触、游泳、首次亲子合影共15张',
      rectification: '',
      operatorName: '张护士',
      isLateRecord: false,
      remark: '首次授权，手续齐全',
      createdAt: minusDays(10),
      updatedAt: minusDays(10),
      latestVersion: 1
    },
    {
      id: 'REC002',
      babyName: '王甜甜',
      guardianName: '李明远',
      roomNo: '205-B',
      status: 'revoked',
      photoCount: 8,
      babyAgeDays: 5,
      photoDescription: '喂奶、换尿布、沐浴照共8张',
      rectification: '已撤回所有照片使用授权，已删除云存储中所有照片，护理记录已归档',
      operatorName: '李主管',
      isLateRecord: false,
      remark: '家属主动要求撤回',
      createdAt: minusDays(7),
      updatedAt: minusDays(2),
      latestVersion: 2
    },
    {
      id: 'REC003',
      babyName: '陈豆豆',
      guardianName: '赵雅琴',
      roomNo: '402-A',
      status: 'pending',
      photoCount: 25,
      babyAgeDays: 20,
      photoDescription: '日常护理、早教互动、满月照筹备共25张',
      rectification: '',
      operatorName: '王护士',
      isLateRecord: false,
      remark: '等待家属签字确认',
      createdAt: minusDays(3),
      updatedAt: minusDays(3),
      latestVersion: 1
    },
    {
      id: 'REC004',
      babyName: '赵乐乐',
      guardianName: '孙建国',
      roomNo: '308-C',
      status: 'authorized',
      photoCount: 100,
      babyAgeDays: 30,
      photoDescription: '含单位混用和边界值异常的样例记录：满月纪念照全套',
      rectification: '',
      operatorName: '周护士',
      isLateRecord: false,
      remark: '用于展示异常数据检测',
      createdAt: minusDays(1),
      updatedAt: minusDays(1),
      latestVersion: 1
    },
    {
      id: 'REC005',
      babyName: '刘一一',
      guardianName: '周美玲',
      roomNo: '203-A',
      status: 'authorized',
      photoCount: 12,
      babyAgeDays: 8,
      photoDescription: '【补录】因出院结算时遗漏，7天后手工补录该记录。原始照片拍摄于住院第3-5天，含抚触5张、游泳4张、亲子3张，共12张。',
      rectification: '',
      operatorName: '吴护士长',
      isLateRecord: true,
      remark: '手工补录：原记录因系统故障未入库，家属已补充签字确认',
      createdAt: minusDays(5),
      updatedAt: new Date().toISOString(),
      latestVersion: 2
    }
  ];

  const sampleVersions = [
    {
      id: 'VER001',
      recordId: 'REC001',
      versionNo: 1,
      operationType: 'create',
      operatorName: '张护士',
      remark: '首次授权，手续齐全',
      snapshot: JSON.parse(JSON.stringify(sampleRecords[0])),
      createdAt: minusDays(10)
    },
    {
      id: 'VER002',
      recordId: 'REC002',
      versionNo: 1,
      operationType: 'create',
      operatorName: '李护士',
      remark: '初始录入，状态为authorized',
      snapshot: { ...sampleRecords[1], status: 'authorized', latestVersion: 1, updatedAt: minusDays(7) },
      createdAt: minusDays(7)
    },
    {
      id: 'VER003',
      recordId: 'REC002',
      versionNo: 2,
      operationType: 'update',
      operatorName: '李主管',
      remark: '家属主动要求撤回，已执行撤回流程',
      snapshot: JSON.parse(JSON.stringify(sampleRecords[1])),
      previousStatus: 'authorized',
      newStatus: 'revoked',
      createdAt: minusDays(2)
    },
    {
      id: 'VER004',
      recordId: 'REC003',
      versionNo: 1,
      operationType: 'create',
      operatorName: '王护士',
      remark: '等待家属签字确认',
      snapshot: JSON.parse(JSON.stringify(sampleRecords[2])),
      createdAt: minusDays(3)
    },
    {
      id: 'VER005',
      recordId: 'REC004',
      versionNo: 1,
      operationType: 'create',
      operatorName: '周护士',
      remark: '用于展示异常数据检测',
      snapshot: JSON.parse(JSON.stringify(sampleRecords[3])),
      createdAt: minusDays(1)
    },
    {
      id: 'VER006',
      recordId: 'REC005',
      versionNo: 1,
      operationType: 'create',
      operatorName: '王护士',
      remark: '住院期间首次录入',
      snapshot: {
        ...sampleRecords[4],
        status: 'pending',
        photoDescription: '日常护理照',
        rectification: '',
        isLateRecord: false,
        remark: '住院期间录入，未完成',
        latestVersion: 1,
        updatedAt: minusDays(5)
      },
      createdAt: minusDays(5)
    },
    {
      id: 'VER007',
      recordId: 'REC005',
      versionNo: 2,
      operationType: 'late_supplement',
      operatorName: '吴护士长',
      remark: '手工补录：原记录因系统故障未入库，家属已补充签字确认',
      snapshot: JSON.parse(JSON.stringify(sampleRecords[4])),
      previousStatus: 'pending',
      newStatus: 'authorized',
      createdAt: new Date().toISOString()
    }
  ];

  const sampleAnomalies = [
    {
      id: 'ANO001',
      recordId: 'REC004',
      versionId: 'VER005',
      versionNo: 1,
      field: 'photoCount',
      type: 'boundary_value',
      value: 100,
      reason: '照片数量100张处于边界值范围（0或≥100），请确认是否为真实数据',
      createdAt: minusDays(1)
    },
    {
      id: 'ANO002',
      recordId: 'REC005',
      versionId: 'VER007',
      versionNo: 2,
      field: 'babyAgeDays',
      type: 'unit_mixed',
      value: '8天',
      reason: '婴儿年龄包含非数字单位"天"，请统一使用"天"为单位，系统已自动提取数字部分',
      createdAt: new Date().toISOString()
    }
  ];

  saveJSON(RECORDS_FILE, sampleRecords);
  saveJSON(VERSIONS_FILE, sampleVersions);
  saveJSON(ANOMALIES_FILE, sampleAnomalies);
  console.log('已初始化样例数据');
}

ensureDataDir();
initSampleData();

app.listen(PORT, () => {
  console.log(`婴幼儿照片授权授权库月子护理版 服务已启动`);
  console.log(`访问地址: http://localhost:${PORT}`);
});
