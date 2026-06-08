const db = require('./db');

const count = db.prepare('SELECT COUNT(*) as cnt FROM care_records').get().cnt;
if (count > 0) {
  console.log('已有记录，跳过 seed');
  process.exit(0);
}

const baby1 = db.prepare("SELECT id FROM babies WHERE name = '柚柚'").get().id;
const baby2 = db.prepare("SELECT id FROM babies WHERE name = '乐乐'").get().id;
const nurseLi = db.prepare("SELECT id FROM users WHERE username = 'nurse_li'").get().id;
const supervisor = db.prepare("SELECT id FROM users WHERE username = 'supervisor'").get().id;
const morning = db.prepare("SELECT id FROM users WHERE username = 'morning'").get().id;

function insertRecord(data) {
  const info = db.prepare(`INSERT INTO care_records (
    baby_id, batch_no, record_type, record_date, shift, nurse_id, nurse_name,
    temperature, weight, feeding_amount, diaper_count, sleep_hours,
    notes_public, notes_internal, status, reviewed_by, reviewed_at,
    photo_description, rectification_note, rectification_status,
    cross_shift_reason, created_by
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    data.baby_id, data.batch_no, data.record_type,
    data.record_date, data.shift, data.nurse_id, data.nurse_name,
    data.temperature, data.weight, data.feeding_amount, data.diaper_count, data.sleep_hours,
    data.notes_public, data.notes_internal,
    data.status, data.reviewed_by, data.reviewed_at,
    data.photo_description, data.rectification_note, data.rectification_status,
    data.cross_shift_reason, data.created_by
  );

  db.prepare(`INSERT INTO audit_logs (record_id, baby_id, action, operator_id, operator_name, operator_role, reason)
    VALUES (?, ?, 'create', ?, ?, ?, ?)`).run(
    info.lastInsertRowid, data.baby_id, data.nurse_id, data.nurse_name, 'teacher',
    data.record_type === 'temp_supplement' ? '临时补充录入' : data.record_type === 'bad_row' ? '坏行标记录入' : '正常录入'
  );

  if (data.status === 'reviewed') {
    db.prepare(`INSERT INTO audit_logs (record_id, baby_id, action, field_name, old_value, new_value, operator_id, operator_name, operator_role, reason)
      VALUES (?, ?, 'review', 'status', 'pending_review', 'reviewed', ?, '护理主管', 'supervisor', '复核通过')`).run(
      info.lastInsertRowid, data.baby_id, supervisor
    );
  }

  return info.lastInsertRowid;
}

const today = new Date();
const fmt = (d) => d.toISOString().slice(0, 10);
const daysAgo = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return fmt(d); };

insertRecord({
  baby_id: baby1, batch_no: 'B2026060801', record_type: 'normal',
  record_date: daysAgo(0), shift: 'morning', nurse_id: morning, nurse_name: '早班张老师',
  temperature: 36.8, weight: 3.65, feeding_amount: 120, diaper_count: 4, sleep_hours: 6.5,
  notes_public: '柚柚今天精神很好，吃奶正常，排便规律。',
  notes_internal: '注意观察脐带残端，略有渗液，已用碘伏消毒。',
  status: 'pending_review', reviewed_by: null, reviewed_at: null,
  photo_description: '早班柚柚沐浴后抚触，表情愉悦',
  rectification_note: null, rectification_status: 'none',
  cross_shift_reason: '今日午班、夜班请继续观察脐带情况', created_by: morning
});

insertRecord({
  baby_id: baby1, batch_no: 'B2026060802', record_type: 'normal',
  record_date: daysAgo(0), shift: 'afternoon', nurse_id: nurseLi, nurse_name: '李护士',
  temperature: 36.7, weight: 3.65, feeding_amount: 115, diaper_count: 3, sleep_hours: 4,
  notes_public: '下午睡眠安稳，吃奶情况良好。',
  notes_internal: '脐带情况稳定，无新增渗液。继续观察。',
  status: 'reviewed', reviewed_by: supervisor, reviewed_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
  photo_description: '午班喂奶后拍嗝',
  rectification_note: null, rectification_status: 'none',
  cross_shift_reason: '夜班注意体温监测', created_by: nurseLi
});

insertRecord({
  baby_id: baby1, batch_no: 'B2026060803-T', record_type: 'temp_supplement',
  record_date: daysAgo(0), shift: 'night', nurse_id: nurseLi, nurse_name: '李护士',
  temperature: 36.9, weight: null, feeding_amount: 100, diaper_count: 2, sleep_hours: 5,
  notes_public: '夜间补充记录：柚柚凌晨2点额外喂奶一次。',
  notes_internal: '临时补充：昨晚系统故障，漏录夜班数据，今晨补录。',
  status: 'reviewed', reviewed_by: supervisor, reviewed_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
  photo_description: null,
  rectification_note: null, rectification_status: 'none',
  cross_shift_reason: '补录数据，请早班核对', created_by: nurseLi
});

insertRecord({
  baby_id: baby1, batch_no: 'BAD2026060701', record_type: 'bad_row',
  record_date: daysAgo(1), shift: 'morning', nurse_id: nurseLi, nurse_name: '李护士',
  temperature: 42.5, weight: 99.99, feeding_amount: 999, diaper_count: 99, sleep_hours: 99,
  notes_public: null,
  notes_internal: '测试数据误录入，数据明显异常，标记为坏行，不计入正常统计。',
  status: 'rejected', reviewed_by: supervisor, reviewed_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
  photo_description: null,
  rectification_note: '已标记为坏行，数据来源为测试脚本误执行。', rectification_status: 'done',
  cross_shift_reason: null, created_by: nurseLi
});

insertRecord({
  baby_id: baby1, batch_no: 'B2026060701', record_type: 'normal',
  record_date: daysAgo(1), shift: 'morning', nurse_id: morning, nurse_name: '早班张老师',
  temperature: 36.6, weight: 3.62, feeding_amount: 110, diaper_count: 5, sleep_hours: 7,
  notes_public: '昨日情况稳定，体温正常。',
  notes_internal: '黄疸监测：面部轻度黄疸，经皮测疸12mg/dl，继续观察。',
  status: 'reviewed', reviewed_by: supervisor, reviewed_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
  photo_description: '日光浴中',
  rectification_note: null, rectification_status: 'none',
  cross_shift_reason: null, created_by: morning
});

insertRecord({
  baby_id: baby1, batch_no: 'B2026060601', record_type: 'normal',
  record_date: daysAgo(2), shift: 'morning', nurse_id: morning, nurse_name: '早班张老师',
  temperature: 36.7, weight: 3.58, feeding_amount: 105, diaper_count: 4, sleep_hours: 6,
  notes_public: '吃奶良好，睡眠安稳。',
  notes_internal: '昨日喂奶量有波动，今日恢复正常。',
  status: 'reviewed', reviewed_by: supervisor, reviewed_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
  photo_description: '亲子抚触时间',
  rectification_note: '喂奶量波动已复核，属正常范围', rectification_status: 'done',
  cross_shift_reason: null, created_by: morning
});

insertRecord({
  baby_id: baby1, batch_no: 'B2026060501-R', record_type: 'normal',
  record_date: daysAgo(3), shift: 'afternoon', nurse_id: nurseLi, nurse_name: '李护士',
  temperature: 37.2, weight: 3.55, feeding_amount: 95, diaper_count: 3, sleep_hours: 5,
  notes_public: '下午稍有哭闹，安抚后恢复。',
  notes_internal: '体温偏高观察中，已物理降温，复测36.8。',
  status: 'reviewed', reviewed_by: supervisor, reviewed_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
  photo_description: '物理降温中',
  rectification_note: '体温偏高已排查，排除感染，后续记录正常', rectification_status: 'pending',
  cross_shift_reason: null, created_by: nurseLi
});

insertRecord({
  baby_id: baby2, batch_no: 'L2026060801', record_type: 'normal',
  record_date: daysAgo(0), shift: 'morning', nurse_id: morning, nurse_name: '早班张老师',
  temperature: 36.9, weight: 4.1, feeding_amount: 130, diaper_count: 4, sleep_hours: 6,
  notes_public: '乐乐上午精神好，互动多。',
  notes_internal: '无异常。',
  status: 'pending_review', reviewed_by: null, reviewed_at: null,
  photo_description: '乐乐晨练',
  rectification_note: null, rectification_status: 'none',
  cross_shift_reason: null, created_by: morning
});

insertRecord({
  baby_id: baby2, batch_no: 'L2026060802-T', record_type: 'temp_supplement',
  record_date: daysAgo(0), shift: 'afternoon', nurse_id: nurseLi, nurse_name: '李护士',
  temperature: 36.8, weight: null, feeding_amount: 125, diaper_count: 3, sleep_hours: 4.5,
  notes_public: '下午补充记录。',
  notes_internal: '临时补充：午班护士请假，交接后补录。',
  status: 'pending_review', reviewed_by: null, reviewed_at: null,
  photo_description: null,
  rectification_note: null, rectification_status: 'none',
  cross_shift_reason: '午班人员变动，请主管复核补录数据', created_by: nurseLi
});

insertRecord({
  baby_id: baby2, batch_no: 'L2026060701', record_type: 'normal',
  record_date: daysAgo(1), shift: 'morning', nurse_id: morning, nurse_name: '早班张老师',
  temperature: 36.8, weight: 4.05, feeding_amount: 128, diaper_count: 5, sleep_hours: 6.5,
  notes_public: '昨日一切正常。',
  notes_internal: '无异常。',
  status: 'reviewed', reviewed_by: supervisor, reviewed_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
  photo_description: null,
  rectification_note: null, rectification_status: 'none',
  cross_shift_reason: null, created_by: morning
});

console.log('Seed 完成：共插入 10 条护理记录');
console.log('  - 柚柚：7条（正常5、临时补充1、坏行1）');
console.log('  - 乐乐：3条（正常2、临时补充1）');
