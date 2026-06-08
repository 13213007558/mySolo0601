
app.post('/api/cases/:id/materials', (req, res) => {
  const caseItem = db.prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id);
  if (!caseItem) {
    return res.status(404).json({ error: '案例不存在' });
  }
  
  const { materials, operator_id, operator_name } = req.body;
  if (!materials || !Array.isArray(materials) || materials.length === 0) {
    return res.status(400).json({ error: '材料列表不能为空' });
  }
  
  const isClosed = caseItem.current_status === 'closed';
  const results = [];
  let anySuccess = false;
  
  const insertStmt = db.prepare(`
    INSERT INTO materials (case_id, material_type, title, content, file_name, uploaded_by, is_supplement, part_of_closed_case, process_result)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const tx = db.transaction((items) => {
    for (const m of items) {
      if (!m.material_type || !m.title) {
        results.push({ title: m.title || '未命名', success: false, error: '缺少类型或标题' });
        continue;
      }
      
      if (isClosed) {
        const allowedTypes = ['supplement_note', 'additional_photo', 'followup_record'];
        if (!allowedTypes.includes(m.material_type)) {
          results.push({ title: m.title, success: false, error: '案例已关闭，仅允许追加补充说明、附加照片和随访记录' });
          continue;
        }
      }
      
      try {
        insertStmt.run(
          caseItem.id,
          m.material_type,
          m.title,
          m.content || null,
          m.file_name || null,
          operator_id || null,
          isClosed ? 1 : 0,
          isClosed ? 1 : 0,
          isClosed ? 'accepted_partial' : 'accepted'
        );
        results.push({ title: m.title, success: true });
        anySuccess = true;
      } catch (e) {
        results.push({ title: m.title, success: false, error: e.message });
      }
    }
  });
  
  tx(materials);
  
  if (anySuccess) {
    addTimelineEvent(
      caseItem.id,
      'add_material',
      isClosed ? '追加材料（部分成功）' : '录入材料',
      `共提交 ${materials.length} 份材料，成功 ${results.filter(r => r.success).length} 份${isClosed ? '（案例已关闭，按规则允许部分类型追加）' : ''}`,
      operator_id,
      operator_name,
      caseItem.current_status,
      caseItem.current_status
    );
    db.prepare('UPDATE cases SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(caseItem.id);
  }
  
  res.json({
    partial_success: isClosed,
    total: materials.length,
    success_count: results.filter(r => r.success).length,
    results
  });
});

app.post('/api/cases/:id/submit', (req, res) => {
  const caseItem = db.prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id);
  if (!caseItem) {
    return res.status(404).json({ error: '案例不存在' });
  }
  if (caseItem.current_status !== 'draft') {
    return res.status(400).json({ error: '只有草稿状态可提交复核' });
  }
  
  const { operator_id, operator_name } = req.body;
  const materialCount = db.prepare('SELECT COUNT(*) as cnt FROM materials WHERE case_id = ?').get(caseItem.id).cnt;
  if (materialCount === 0) {
    return res.status(400).json({ error: '请先录入至少一份材料再提交复核' });
  }
  
  db.prepare("UPDATE cases SET current_status = 'reviewing', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(caseItem.id);
  
  addTimelineEvent(
    caseItem.id,
    'submit',
    '提交复核',
    `提交复核，材料共 ${materialCount} 份`,
    operator_id,
    operator_name,
    'draft',
    'reviewing'
  );
  
  res.json({ status: 'reviewing' });
});
