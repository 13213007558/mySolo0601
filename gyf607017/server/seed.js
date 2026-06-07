const { initDB, getDB } = require('./db');

initDB();
const db = getDB();

const children = [
  { name: '张小宝', gender: '男', birth_date: '2025-03-15', guardian: '张爸爸', phone: '13800000001', address: '朝阳区幸福路1号' },
  { name: '李乐乐', gender: '女', birth_date: '2025-01-20', guardian: '李妈妈', phone: '13800000002', address: '海淀区学园路2号' },
  { name: '王朵朵', gender: '女', birth_date: '2024-11-08', guardian: '王奶奶', phone: '13800000003', address: '西城区和睦路3号' },
  { name: '赵阳阳', gender: '男', birth_date: '2024-09-01', guardian: '赵爸爸', phone: '13800000004', address: '东城区广场路4号' }
];

function addAudit(recordId, action, oldValue, newValue, operator, remark) {
  db.prepare(`
    INSERT INTO audits (record_id, action, old_value, new_value, operator, remark)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(recordId, action,
    oldValue ? JSON.stringify(oldValue) : null,
    newValue ? JSON.stringify(newValue) : null,
    operator, remark
  );
}

function addTimeline(recordId, eventType, eventDetail, operator) {
  db.prepare(`
    INSERT INTO timeline_events (record_id, event_type, event_detail, operator)
    VALUES (?, ?, ?, ?)
  `).run(recordId, eventType, eventDetail, operator);
}

console.log('🌱 开始导入样例数据...');

const insertChild = db.prepare(`
  INSERT INTO children (name, gender, birth_date, guardian, phone, address)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const childIds = [];
children.forEach(c => {
  const info = insertChild.run(c.name, c.gender, c.birth_date, c.guardian, c.phone, c.address);
  childIds.push(info.lastInsertRowid);
  console.log(`  + 儿童: ${c.name}`);
});

const now = new Date();
function daysAgo(d) {
  const dt = new Date(now);
  dt.setDate(dt.getDate() - d);
  return dt.toISOString().split('T')[0];
}

const records = [
  { child_idx: 0, record_date: daysAgo(0), sleep_start: '13:00', sleep_end: '15:30', sleep_duration: 2.5,
    sleep_quality: '良好', environment: '安静', notes: '午睡正常', photo_missing: 0, status: 'closed',
    created_by: '护士小陈', timeline: ['create', 'submit', 'approve', 'close'] },
  { child_idx: 1, record_date: daysAgo(0), sleep_start: '12:45', sleep_end: '15:00', sleep_duration: 2.25,
    sleep_quality: '一般', environment: '较吵', notes: '中途醒了一次', photo_missing: 1, status: 'approved',
    created_by: '护士小李', timeline: ['create_partial', 'submit', 'approve'], is_abnormal: true },
  { child_idx: 2, record_date: daysAgo(1), sleep_start: '13:15', sleep_end: '16:00', sleep_duration: 2.75,
    sleep_quality: '良好', environment: '安静', notes: '', photo_missing: 0, status: 'pending',
    created_by: '护士小陈', timeline: ['create', 'submit'] },
  { child_idx: 3, record_date: daysAgo(1), sleep_start: '13:00', sleep_end: '14:30', sleep_duration: 1.5,
    sleep_quality: '较差', environment: '吵闹', notes: '睡眠不足，需要观察', photo_missing: 0, status: 'rejected',
    created_by: '护士小李', timeline: ['create', 'submit', 'reject'] },
  { child_idx: 0, record_date: daysAgo(2), sleep_start: '12:30', sleep_end: '15:00', sleep_duration: 2.5,
    sleep_quality: '良好', environment: '安静', notes: '', photo_missing: 0, status: 'closed',
    created_by: '护士小陈', timeline: ['create', 'submit', 'approve', 'close'] },
  { child_idx: 1, record_date: daysAgo(2), sleep_start: '13:30', sleep_end: '15:45', sleep_duration: 2.25,
    sleep_quality: '良好', environment: '安静', notes: '', photo_missing: 0, status: 'approved',
    created_by: '护士小王', timeline: ['create', 'submit', 'approve_with_update'] },
];

const insertRecord = db.prepare(`
  INSERT INTO records (child_id, record_date, sleep_start, sleep_end,
    sleep_duration, sleep_quality, environment, notes, photo_path,
    photo_missing, status, created_by)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

records.forEach((r, idx) => {
  const childId = childIds[r.child_idx];
  const info = insertRecord.run(childId, r.record_date, r.sleep_start, r.sleep_end,
    r.sleep_duration, r.sleep_quality, r.environment, r.notes, null,
    r.photo_missing, r.status, r.created_by);
  const recordId = info.lastInsertRowid;

  let operator = r.created_by;
  r.timeline.forEach(ev => {
    switch (ev) {
      case 'create':
        addTimeline(recordId, 'create', '录入记录', operator);
        addAudit(recordId, 'create', null, { record_date: r.record_date, sleep_duration: r.sleep_duration }, operator, '新建记录');
        break;
      case 'create_partial':
        addTimeline(recordId, 'create', '录入记录（照片缺失，已部分保存）', operator);
        addAudit(recordId, 'create', null,
          { record_date: r.record_date, sleep_duration: r.sleep_duration, photo_missing: 1 },
          operator, '部分成功：照片缺失（异常数据已纳入汇总但保留审计）');
        break;
      case 'submit':
        addTimeline(recordId, 'submit', '提交复核', operator);
        addAudit(recordId, 'status_change', { status: 'draft' }, { status: 'pending' }, operator, '提交复核');
        operator = '主管王老师';
        break;
      case 'approve':
        addTimeline(recordId, 'approve', '复核通过', operator);
        addAudit(recordId, 'status_change', { status: 'pending' }, { status: 'approved' }, operator, '复核通过');
        break;
      case 'approve_with_update':
        addTimeline(recordId, 'update', '主管复核时修正备注', operator);
        addAudit(recordId, 'update', { notes: '' }, { notes: '护士补充说明：入睡稍晚但质量良好' }, operator, '复核时修正数据');
        addTimeline(recordId, 'approve', '复核通过', operator);
        addAudit(recordId, 'status_change', { status: 'pending' }, { status: 'approved' }, operator, '复核通过');
        break;
      case 'reject':
        addTimeline(recordId, 'reject', '退回补充：睡眠时长记录需核实', operator);
        addAudit(recordId, 'status_change', { status: 'pending' }, { status: 'rejected' }, operator, '退回补充：睡眠时长记录需核实，请补充照片或说明');
        break;
      case 'close':
        operator = '早班老师';
        addTimeline(recordId, 'close', '关闭归档', operator);
        addAudit(recordId, 'status_change', { status: 'approved' }, { status: 'closed' }, operator, '关闭归档');
        break;
    }
  });

  console.log(`  + 记录#${idx + 1}: ${children[r.child_idx].name} ${r.record_date} [${r.status}]${r.is_abnormal ? ' ⚠️含异常(照片缺失)' : ''}`);
});

console.log('✅ 样例数据导入完成！');
console.log('');
console.log('📋 测试账号：');
console.log('   录入护士：护士小陈 / 护士小李 / 护士小王');
console.log('   复核主管：主管王老师');
console.log('   早班老师：早班老师');
console.log('');
console.log('🔍 异常测试场景已预置：');
console.log('   - 李乐乐 今日记录：照片缺失（部分成功，已纳入汇总但保留审计标记）');
console.log('   - 赵阳阳 昨日记录：被退回补充（状态变更留痕）');
console.log('   - 李乐乐 前天记录：主管复核时修改过数据（旧值保留在审计中）');
