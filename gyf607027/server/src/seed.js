const db = require("./db");

console.log("清理旧数据...");
db.exec("DELETE FROM audits");
db.exec("DELETE FROM timeline_events");
db.exec("DELETE FROM materials");
db.exec("DELETE FROM cases");

console.log("插入样例案例数据...");

const sampleCases = [
  {
    case_no: 'SLP202606010001',
    baby_name: '小宝',
    baby_age_months: 6,
    parent_phone: '13800138001',
    store_name: '爱婴坊朝阳店',
    current_status: 'closed',
    closed_by: '张主管'
  },
  {
    case_no: 'SLP202606050002',
    baby_name: '朵朵',
    baby_age_months: 4,
    parent_phone: '13900139002',
    store_name: '爱婴坊海淀店',
    current_status: 'reviewing'
  },
  {
    case_no: 'SLP202606070003',
    baby_name: '安安',
    baby_age_months: 8,
    parent_phone: '13700137003',
    store_name: '爱婴坊朝阳店',
    current_status: 'supplementing'
  },
  {
    case_no: 'SLP202606080004',
    baby_name: '乐乐',
    baby_age_months: 3,
    parent_phone: '13600136004',
    store_name: '爱婴坊西城店',
    current_status: 'draft'
  },
  {
    case_no: 'SLP202606080005',
    baby_name: '毛豆',
    baby_age_months: 10,
    parent_phone: '13800138001',
    store_name: '爱婴坊朝阳店',
    current_status: 'reviewing'
  }
];

const insertCase = db.prepare(`
  INSERT INTO cases (case_no, baby_name, baby_age_months, parent_phone, store_name, current_status, closed_by, closed_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const sampleCaseIds = {};
for (const c of sampleCases) {
  const result = insertCase.run(
    c.case_no, c.baby_name, c.baby_age_months, c.parent_phone, c.store_name,
    c.current_status, c.closed_by || null,
    c.current_status === 'closed' ? '2026-06-03 15:30:00' : null
  );
  sampleCaseIds[c.case_no] = result.lastInsertRowid;
  console.log('  案例 ' + c.case_no + ' - ' + c.baby_name);
}

console.log('插入样例材料数据...');

const insertMaterial = db.prepare(`
  INSERT INTO materials (case_id, material_type, title, content, file_name, uploaded_by, created_at)
  VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
`);

const sampleMaterials = [
  ['SLP202606010001', 'sleep_log', '3天睡眠日志', '6月1日-3日睡眠记录，平均夜醒3次', 'sleep_log_001.pdf', '李店长'],
  ['SLP202606010001', 'consultation_note', '睡眠咨询记录', '家长主诉：频繁夜醒，入睡困难', null, '李店长'],
  ['SLP202606010001', 'photo', '睡眠环境照片', '婴儿床环境照片3张', 'bedroom_001.jpg', '李店长'],
  ['SLP202606050002', 'sleep_log', '5天睡眠日志', '记录完整，入睡时间不规律', 'sleep_log_002.xlsx', '王店长'],
  ['SLP202606050002', 'consultation_note', '咨询记录表', '白天小睡短，黄昏闹严重', null, '王店长'],
  ['SLP202606070003', 'sleep_log', '2天睡眠日志', '记录不完整，需补充后半夜醒来时间', 'sleep_log_003.pdf', '李店长'],
  ['SLP202606080004', 'consultation_note', '首次咨询记录', '刚满月，昼夜颠倒', null, '赵店长'],
  ['SLP202606080005', 'sleep_log', '7天睡眠日志', '完整记录一周睡眠', 'sleep_log_005.pdf', '李店长'],
  ['SLP202606080005', 'consultation_note', '详细咨询记录', '夜醒频繁，怀疑关联辅食添加', null, '李店长'],
  ['SLP202606080005', 'photo', '婴儿房照片', '房间光线和温度记录', 'room_005.jpg', '李店长']
];

for (const m of sampleMaterials) {
  insertMaterial.run(sampleCaseIds[m[0]], m[1], m[2], m[3], m[4], m[5]);
  console.log('  材料: ' + m[2]);
}

console.log('插入样例时间线事件...');

const insertEvent = db.prepare(`
  INSERT INTO timeline_events (case_id, event_type, event_title, description, operator_id, operator_name, operator_missing, status_before, status_after, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const sampleEvents = [
  ['SLP202606010001', 'create', '创建案例', '宝宝6个月，家长主诉夜醒频繁', null, '李店长', 0, null, 'draft', '2026-06-01 09:15:00'],
  ['SLP202606010001', 'add_material', '录入材料', '提交3份材料：睡眠日志、咨询记录、照片', null, '李店长', 0, 'draft', 'draft', '2026-06-01 10:00:00'],
  ['SLP202606010001', 'submit', '提交复核', '材料齐全，提交复核', null, '李店长', 0, 'draft', 'reviewing', '2026-06-01 10:05:00'],
  ['SLP202606010001', 'close', '关闭归档', '处理结论：建议调整白天小睡时长，建立固定睡前仪式。3天后随访情况好转。', null, '张主管', 0, 'reviewing', 'closed', '2026-06-03 15:30:00'],
  ['SLP202606050002', 'create', '创建案例', '宝宝4个月，入睡困难', null, '王店长', 0, null, 'draft', '2026-06-05 11:20:00'],
  ['SLP202606050002', 'add_material', '录入材料', '提交2份材料', null, '王店长', 0, 'draft', 'draft', '2026-06-05 14:00:00'],
  ['SLP202606050002', 'submit', '提交复核', null, null, null, 1, 'draft', 'reviewing', '2026-06-05 14:10:00'],
  ['SLP202606070003', 'create', '创建案例', '宝宝8个月，夜醒后难以再次入睡', null, '李店长', 0, null, 'draft', '2026-06-07 08:45:00'],
  ['SLP202606070003', 'add_material', '录入材料', '提交1份材料', null, '李店长', 0, 'draft', 'draft', '2026-06-07 09:30:00'],
  ['SLP202606070003', 'submit', '提交复核', null, null, null, 1, 'draft', 'reviewing', '2026-06-07 09:35:00'],
  ['SLP202606070003', 'reject', '退回补充', '退回原因：睡眠日志不完整，缺少后半夜醒来时间和哄睡方式记录，请补充后重新提交', null, '张主管', 0, 'reviewing', 'supplementing', '2026-06-07 16:20:00'],
  ['SLP202606080004', 'create', '创建案例', '刚满月宝宝，昼夜颠倒', null, '赵店长', 0, null, 'draft', '2026-06-08 10:00:00'],
  ['SLP202606080005', 'create', '创建案例', '10个月宝宝，夜醒频繁', null, '李店长', 0, null, 'draft', '2026-06-08 11:00:00'],
  ['SLP202606080005', 'add_material', '录入材料', '提交3份材料', null, '李店长', 0, 'draft', 'draft', '2026-06-08 12:00:00'],
  ['SLP202606080005', 'submit', '提交复核', null, null, null, 1, 'draft', 'reviewing', '2026-06-08 12:05:00']
];

for (const e of sampleEvents) {
  insertEvent.run(sampleCaseIds[e[0]], e[1], e[2], e[3], e[4], e[5], e[6], e[7], e[8], e[9]);
  console.log('  事件: ' + e[2]);
}

console.log('插入审计记录...');
const insertAudit = db.prepare(`
  INSERT INTO audits (case_id, event_id, action, detail, operator_id, operator_name, operator_missing, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const allEvents = db.prepare('SELECT * FROM timeline_events ORDER BY id').all();
for (const ev of allEvents) {
  insertAudit.run(ev.case_id, ev.id, ev.event_type, ev.description, ev.operator_id, ev.operator_name, ev.operator_missing, ev.created_at);
}

console.log('');
console.log('样例数据导入完成！');
console.log('');
console.log('数据统计:');
console.log('  案例: ' + db.prepare('SELECT COUNT(*) FROM cases').get()['COUNT(*)'] + ' 条');
console.log('  材料: ' + db.prepare('SELECT COUNT(*) FROM materials').get()['COUNT(*)'] + ' 条');
console.log('  时间线事件: ' + db.prepare('SELECT COUNT(*) FROM timeline_events').get()['COUNT(*)'] + ' 条');
console.log('  审计记录: ' + db.prepare('SELECT COUNT(*) FROM audits').get()['COUNT(*)'] + ' 条');
console.log('  缺失操作人的审计: ' + db.prepare("SELECT COUNT(*) FROM audits WHERE operator_missing = 1").get()['COUNT(*)'] + ' 条（用于主管复查）');
console.log(`  缺失操作人的审计: ${db.prepare("SELECT COUNT(*) FROM audits WHERE operator_missing = 1").get()['COUNT(*)']} 条（用于主管复查）`);
