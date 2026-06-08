const db = require('../src/db');
const { writeTimeline, writeAudit } = require('../src/audit');

function seed() {
  const users = [
    { username: 'supervisor', password: '123456', role: 'supervisor', display_name: '客服主管-李姐' },
    { username: 'parent', password: '123456', role: 'parent', display_name: '爸爸-小王' },
    { username: 'elder', password: '123456', role: 'elder', display_name: '奶奶-王阿姨' },
    { username: 'nanny', password: '123456', role: 'nanny', display_name: '育儿嫂-张阿姨' }
  ];

  const insertUser = db.prepare('INSERT OR IGNORE INTO users (username, password, role, display_name) VALUES (?, ?, ?, ?)');
  const userIdMap = {};
  for (const u of users) {
    const info = insertUser.run(u.username, u.password, u.role, u.display_name);
    if (info.lastInsertRowid) {
      userIdMap[u.username] = info.lastInsertRowid;
    } else {
      const row = db.prepare('SELECT id FROM users WHERE username = ?').get(u.username);
      userIdMap[u.username] = row.id;
    }
  }
  console.log('用户已初始化:', userIdMap);

  const observations = [
    { baby_name: '豆豆', sleep_date: '2026-06-01', start_time: '13:00', end_time: '15:30', sleep_quality: 'good', environment: '卧室安静,温度26度', notes: '午睡,无夜惊', status: 'archived', created_by: userIdMap.nanny },
    { baby_name: '豆豆', sleep_date: '2026-06-02', start_time: '20:30', end_time: '06:15', sleep_quality: 'normal', environment: '夜醒一次,喂奶后继续睡', notes: '夜间睡眠', status: 'submitted', created_by: userIdMap.nanny },
    { baby_name: '豆豆', sleep_date: '2026-06-03', start_time: '13:30', end_time: '14:15', sleep_quality: 'poor', environment: '外面装修噪音大', notes: '被吵醒后哭闹', status: 'returned', created_by: userIdMap.parent },
    { baby_name: '豆豆', sleep_date: '2026-06-04', start_time: '14:00', end_time: null, sleep_quality: null, environment: '刚躺下', notes: '', status: 'draft', created_by: userIdMap.nanny },
    { baby_name: '米米', sleep_date: '2026-06-03', start_time: '21:00', end_time: '07:00', sleep_quality: 'good', environment: '恒温25度', notes: '整夜睡眠质量很好', status: 'archived', created_by: userIdMap.parent },
    { baby_name: '米米', sleep_date: '2026-06-05', start_time: '12:30', end_time: '14:00', sleep_quality: 'normal', environment: '开了空调', notes: '午睡', status: 'submitted', created_by: userIdMap.nanny }
  ];

  const insertObs = db.prepare(`INSERT INTO observations
    (baby_name, sleep_date, start_time, end_time, sleep_quality, environment, notes, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  for (const o of observations) {
    const info = insertObs.run(o.baby_name, o.sleep_date, o.start_time, o.end_time, o.sleep_quality, o.environment, o.notes, o.status, o.created_by);
    const obsId = info.lastInsertRowid;
    const creatorName = Object.keys(userIdMap).find(k => userIdMap[k] === o.created_by);
    writeTimeline({
      observationId: obsId,
      action: 'create',
      actorId: o.created_by,
      toStatus: 'draft',
      metadata: { babyName: o.baby_name, sleepDate: o.sleep_date }
    });
    writeAudit({ observationId: obsId, userId: o.created_by, action: 'create', newValue: o });

    if (o.status !== 'draft') {
      writeTimeline({
        observationId: obsId,
        action: 'submit',
        actorId: o.created_by,
        fromStatus: 'draft',
        toStatus: 'submitted',
        comment: '初始录入后提交'
      });
      writeAudit({ observationId: obsId, userId: o.created_by, action: 'status:draft->submitted' });
    }
    if (o.status === 'returned') {
      writeTimeline({
        observationId: obsId,
        action: 'return',
        actorId: userIdMap.supervisor,
        fromStatus: 'submitted',
        toStatus: 'returned',
        comment: '缺少详细睡眠过程描述,请补充'
      });
      writeAudit({ observationId: obsId, userId: userIdMap.supervisor, action: 'status:submitted->returned' });
    }
    if (o.status === 'archived') {
      writeTimeline({
        observationId: obsId,
        action: 'archive',
        actorId: userIdMap.supervisor,
        fromStatus: 'submitted',
        toStatus: 'archived',
        comment: '复核通过,已归档'
      });
      writeAudit({ observationId: obsId, userId: userIdMap.supervisor, action: 'status:submitted->archived' });
    }
  }

  console.log('样例数据导入完成,共', observations.length, '条睡眠观察记录');
  console.log('\n登录账号(密码均为 123456):');
  console.log('  supervisor - 客服主管(全权限,查看审计)');
  console.log('  parent     - 父母(录入/提交/查看详情/导出)');
  console.log('  elder      - 老人(仅查看摘要)');
  console.log('  nanny      - 育儿嫂(录入/提交/查看详情)');
}

seed();
