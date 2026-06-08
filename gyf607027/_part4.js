
app.post('/api/cases/:id/reject', (req, res) => {
  const caseItem = db.prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id);
  if (!caseItem) {
    return res.status(404).json({ error: '案例不存在' });
  }
  if (caseItem.current_status !== 'reviewing') {
    return res.status(400).json({ error: '只有复核中状态可退回补充' });
  }
  
  const { reason, operator_id, operator_name } = req.body;
  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: '退回原因必填' });
  }
  
  db.prepare("UPDATE cases SET current_status = 'supplementing', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(caseItem.id);
  
  addTimelineEvent(
    caseItem.id,
    'reject',
    '退回补充',
    `退回原因：${reason.trim()}`,
    operator_id,
    operator_name,
    'reviewing',
    'supplementing'
  );
  
  res.json({ status: 'supplementing' });
});

app.post('/api/cases/:id/resubmit', (req, res) => {
  const caseItem = db.prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id);
  if (!caseItem) {
    return res.status(404).json({ error: '案例不存在' });
  }
  if (caseItem.current_status !== 'supplementing') {
    return res.status(400).json({ error: '只有补充中状态可再次提交复核' });
  }
  
  const { operator_id, operator_name } = req.body;
  
  db.prepare("UPDATE cases SET current_status = 'reviewing', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(caseItem.id);
  
  addTimelineEvent(
    caseItem.id,
    'resubmit',
    '再次提交复核',
    '补充材料完成，重新提交复核',
    operator_id,
    operator_name,
    'supplementing',
    'reviewing'
  );
  
  res.json({ status: 'reviewing' });
});

app.post('/api/cases/:id/close', (req, res) => {
  const caseItem = db.prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id);
  if (!caseItem) {
    return res.status(404).json({ error: '案例不存在' });
  }
  if (!['reviewing', 'supplementing'].includes(caseItem.current_status)) {
    return res.status(400).json({ error: '当前状态不可关闭归档' });
  }
  
  const { conclusion, operator_id, operator_name } = req.body;
  
  db.prepare(`
    UPDATE cases 
    SET current_status = 'closed', updated_at = CURRENT_TIMESTAMP, closed_at = CURRENT_TIMESTAMP, closed_by = ?
    WHERE id = ?
  `).run(operator_name || operator_id || '未知操作人', caseItem.id);
  
  addTimelineEvent(
    caseItem.id,
    'close',
    '关闭归档',
    conclusion ? `处理结论：${conclusion}` : '案例已关闭归档',
    operator_id,
    operator_name,
    caseItem.current_status,
    'closed'
  );
  
  res.json({ status: 'closed' });
});
