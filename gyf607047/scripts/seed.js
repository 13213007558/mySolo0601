const fs = require('fs');
const path = require('path');
const { initDb, queryOne, queryAll, run, lastInsertId, now, saveDb } = require('../db');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function makePlaceholderPng(filePath, label) {
  const png = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x64, 0x00, 0x00, 0x00, 0x64,
    0x08, 0x02, 0x00, 0x00, 0x00, 0xFF, 0x80, 0x8C,
    0x68, 0x00, 0x00, 0x00, 0x1C, 0x49, 0x44, 0x41,
    0x54, 0x78, 0x9C, 0xED, 0xC1, 0x01, 0x01, 0x00,
    0x00, 0x00, 0x82, 0x20, 0xFF, 0xAF, 0x6E, 0x48,
    0x40, 0x01, 0x00, 0x00, 0x6C, 0x0B, 0x00, 0x01,
    0x38, 0x2B, 0xC9, 0x90, 0x00, 0x00, 0x00, 0x00,
    0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82,
  ]);
  fs.writeFileSync(filePath, png);
}

function writeAudit(observationId, action, fromStatus, toStatus, operator, remark, snapshot) {
  run(
    `INSERT INTO audit_log (observation_id, action, from_status, to_status, operator, remark, snapshot_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [observationId, action, fromStatus || null, toStatus || null, operator, remark || null, snapshot ? JSON.stringify(snapshot) : null, now()]
  );
}

function createObs(data) {
  const ts = now();
  run(
    `INSERT INTO observations (baby_name, room_no, nurse_name, sleep_start, sleep_end, sleep_quality, position, notes, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.baby_name, data.room_no, data.nurse_name, data.sleep_start, data.sleep_end, data.sleep_quality, data.position, data.notes, data.status || 'DRAFT', ts, ts]
  );
  const id = lastInsertId();
  const obs = queryOne('SELECT * FROM observations WHERE id = ?', [id]);
  writeAudit(id, 'CREATE', null, data.status || 'DRAFT', data.nurse_name, '创建睡眠观察记录', obs);
  return id;
}

function addPhoto(obsId, description, filename) {
  const filePath = path.join(UPLOAD_DIR, filename);
  makePlaceholderPng(filePath, description);
  const relativePath = `/uploads/${filename}`;
  run(
    `INSERT INTO photos (observation_id, file_path, description, uploaded_at) VALUES (?, ?, ?, ?)`,
    [obsId, relativePath, description, now()]
  );
  const photoId = lastInsertId();
  const photo = queryOne('SELECT * FROM photos WHERE id = ?', [photoId]);
  const obs = queryOne('SELECT * FROM observations WHERE id = ?', [obsId]);
  writeAudit(obsId, 'UPLOAD_PHOTO', obs.status, obs.status, obs.nurse_name, `上传照片：${description}`, photo);
}

function setStatus(obsId, status, operator, remark) {
  const obs = queryOne('SELECT * FROM observations WHERE id = ?', [obsId]);
  const ts = now();
  run(`UPDATE observations SET status=?, updated_at=? WHERE id=?`, [status, ts, obsId]);
  const actionMap = { REVIEW: 'SUBMIT', DRAFT: 'REJECT', ARCHIVED: 'ARCHIVE' };
  writeAudit(obsId, actionMap[status] || 'UPDATE', obs.status, status, operator, remark, queryOne('SELECT * FROM observations WHERE id = ?', [obsId]));
}

function addCorrection(obsId, reason, rejectedBy) {
  const ts = now();
  run(
    `INSERT INTO corrections (observation_id, reject_reason, rejected_by, rejected_at) VALUES (?, ?, ?, ?)`,
    [obsId, reason, rejectedBy, ts]
  );
}

function doCorrect(obsId, content, correctedBy) {
  const lastC = queryOne(`SELECT * FROM corrections WHERE observation_id = ? ORDER BY rejected_at DESC LIMIT 1`, [obsId]);
  if (lastC) {
    const ts = now();
    run(`UPDATE corrections SET correction_content=?, corrected_by=?, corrected_at=? WHERE id=?`, [content, correctedBy, ts, lastC.id]);
    const obs = queryOne('SELECT * FROM observations WHERE id = ?', [obsId]);
    writeAudit(obsId, 'CORRECT', obs.status, obs.status, correctedBy, `整改补充：${content}`, obs);
  }
}

async function seed() {
  await initDb();

  const count = queryOne('SELECT COUNT(*) AS c FROM observations').c;
  if (count > 0) {
    console.log(`⚠️  数据库已有 ${count} 条记录，跳过导入。如需重新导入请删除 data/app.db 文件。`);
    return;
  }

  console.log('🌱 开始导入样例数据...');

  const id1 = createObs({
    baby_name: '小宝',
    room_no: '301',
    nurse_name: '张护理',
    sleep_start: '2026-06-07T21:30:00',
    sleep_end: '2026-06-08T05:45:00',
    sleep_quality: '良',
    position: '仰睡',
    notes: '夜醒一次，轻拍后继续入睡',
    status: 'DRAFT',
  });
  addPhoto(id1, '入睡时仰睡姿势正常', `${id1}-sleep1.png`);
  addPhoto(id1, '面部红润呼吸平稳', `${id1}-sleep2.png`);
  console.log(`  ✅ 记录 #${id1}（小宝·草稿）创建完成，含2张照片`);

  const id2 = createObs({
    baby_name: '安安',
    room_no: '205',
    nurse_name: '李护理',
    sleep_start: '2026-06-07T22:15:00',
    sleep_end: '2026-06-08T06:20:00',
    sleep_quality: '优',
    position: '侧睡',
    notes: '整夜安稳，未醒',
    status: 'REVIEW',
  });
  addPhoto(id2, '侧睡姿势良好', `${id2}-sleep1.png`);
  writeAudit(id2, 'SUBMIT', 'DRAFT', 'REVIEW', '李护理', '提交复核', queryOne('SELECT * FROM observations WHERE id = ?', [id2]));
  console.log(`  ✅ 记录 #${id2}（安安·复核中）创建完成`);

  const id3 = createObs({
    baby_name: '乐乐',
    room_no: '108',
    nurse_name: '王护理',
    sleep_start: '2026-06-07T20:00:00',
    sleep_end: '2026-06-08T04:30:00',
    sleep_quality: '中',
    position: '仰睡',
    notes: '哭闹两次，喂奶后入睡',
    status: 'DRAFT',
  });
  addPhoto(id3, '首次入睡记录', `${id3}-sleep1.png`);
  writeAudit(id3, 'SUBMIT', 'DRAFT', 'REVIEW', '王护理', '提交复核', queryOne('SELECT * FROM observations WHERE id = ?', [id3]));
  setStatus(id3, 'DRAFT', '陈主管', '退回补充：未说明哭闹原因和处理措施详情');
  addCorrection(id3, '未说明哭闹原因和处理措施详情', '陈主管');
  doCorrect(id3, '已补充：第一次哭闹系尿布湿更换后入睡；第二次哭闹系饿，喂奶30ml后入睡，过程约10分钟', '王护理');
  console.log(`  ✅ 记录 #${id3}（乐乐·退回已整改）创建完成，含退回和整改记录`);

  const id4 = createObs({
    baby_name: '糖糖',
    room_no: '402',
    nurse_name: '赵护理',
    sleep_start: '2026-06-06T21:00:00',
    sleep_end: '2026-06-07T06:00:00',
    sleep_quality: '良',
    position: '仰睡',
    notes: '睡眠安稳，偶有惊跳反射，安抚后继续入睡',
    status: 'ARCHIVED',
  });
  addPhoto(id4, '入睡照片', `${id4}-sleep1.png`);
  addPhoto(id4, '晨起照片状态良好', `${id4}-sleep2.png`);
  writeAudit(id4, 'SUBMIT', 'DRAFT', 'REVIEW', '赵护理', '提交复核', queryOne('SELECT * FROM observations WHERE id = ?', [id4]));
  setStatus(id4, 'ARCHIVED', '陈主管', '审核通过，关闭归档');
  console.log(`  ✅ 记录 #${id4}（糖糖·已归档）创建完成，含完整流程`);

  const id5 = createObs({
    baby_name: '星星',
    room_no: '303',
    nurse_name: '孙护理',
    sleep_start: '2026-06-07T23:45:00',
    sleep_end: null,
    sleep_quality: null,
    position: '侧睡',
    notes: '刚哄睡，持续观察中',
    status: 'DRAFT',
  });
  addPhoto(id5, '刚哄睡侧卧位', `${id5}-sleep1.png`);
  console.log(`  ✅ 记录 #${id5}（星星·睡眠中）创建完成，未结束`);

  saveDb();
  console.log('\n🎉 样例数据导入完成！');
  console.log(`   共导入 ${queryOne('SELECT COUNT(*) AS c FROM observations').c} 条观察记录`);
  console.log(`   共导入 ${queryOne('SELECT COUNT(*) AS c FROM audit_log').c} 条审计日志`);
  console.log(`   共导入 ${queryOne('SELECT COUNT(*) AS c FROM photos').c} 张照片`);
  console.log(`   共导入 ${queryOne('SELECT COUNT(*) AS c FROM corrections').c} 条整改记录`);
  console.log('\n🚀 执行 npm start 启动服务');
}

seed().catch(err => { console.error('导入失败：', err); process.exit(1); });
