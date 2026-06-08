
app.get('/api/cases', (req, res) => {
  const { phone, status } = req.query;
  let sql = 'SELECT * FROM cases WHERE 1=1';
  const params = [];
  
  if (phone && phone.trim()) {
    sql += ' AND parent_phone LIKE ?';
    params.push(`%${phone.trim()}%`);
  }
  if (status && status.trim()) {
    sql += ' AND current_status = ?';
    params.push(status.trim());
  }
  
  sql += ' ORDER BY created_at DESC';
  const cases = db.prepare(sql).all(...params);
  
  const casesWithCounts = cases.map(c => {
    const materialCount = db.prepare('SELECT COUNT(*) as cnt FROM materials WHERE case_id = ?').get(c.id).cnt;
    const eventCount = db.prepare('SELECT COUNT(*) as cnt FROM timeline_events WHERE case_id = ?').get(c.id).cnt;
    return { ...c, material_count: materialCount, event_count: eventCount };
  });
  
  res.json(casesWithCounts);
});

app.get('/api/cases/:id', (req, res) => {
  const caseItem = db.prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id);
  if (!caseItem) {
    return res.status(404).json({ error: '案例不存在' });
  }
  
  const events = db.prepare('SELECT * FROM timeline_events WHERE case_id = ? ORDER BY created_at ASC').all(req.params.id);
  const materials = db.prepare('SELECT * FROM materials WHERE case_id = ? ORDER BY created_at ASC').all(req.params.id);
  const audits = db.prepare('SELECT * FROM audits WHERE case_id = ? ORDER BY created_at ASC').all(req.params.id);
  
  res.json({ ...caseItem, events, materials, audits });
});

app.post('/api/cases', (req, res) => {
  const { baby_name, baby_age_months, parent_phone, store_name, operator_id, operator_name } = req.body;
  
  if (!baby_name || !parent_phone) {
    return res.status(400).json({ error: '宝宝姓名和家长手机号必填' });
  }
  
  const caseNo = generateCaseNo();
  const result = db.prepare(`
    INSERT INTO cases (case_no, baby_name, baby_age_months, parent_phone, store_name, current_status)
    VALUES (?, ?, ?, ?, ?, 'draft')
  `).run(caseNo, baby_name, baby_age_months || null, parent_phone, store_name || null);
  
  const caseId = result.lastInsertRowid;
  addTimelineEvent(
    caseId,
    'create',
    '创建案例',
    `案例编号 ${caseNo}，宝宝：${baby_name}，家长手机：${parent_phone}`,
    operator_id,
    operator_name,
    null,
    'draft'
  );
  
  db.prepare('UPDATE cases SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(caseId);
  
  const newCase = db.prepare('SELECT * FROM cases WHERE id = ?').get(caseId);
  res.status(201).json(newCase);
});
