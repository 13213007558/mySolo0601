
app.get('/api/export', (req, res) => {
  const { phone } = req.query;
  let sql = `
    SELECT 
      c.case_no,
      c.baby_name,
      c.baby_age_months,
      c.parent_phone,
      c.store_name,
      c.current_status,
      c.created_at,
      c.closed_at,
      c.closed_by
    FROM cases c
    WHERE 1=1
  `;
  const params = [];
  
  if (phone && phone.trim()) {
    sql += ' AND c.parent_phone LIKE ?';
    params.push(`%${phone.trim()}%`);
  }
  
  sql += ' ORDER BY c.created_at DESC';
  const cases = db.prepare(sql).all(...params);
  
  const csvStringifier = createObjectCsvStringifier({
    path: null,
    header: [
      { id: 'case_no', title: '案例编号' },
      { id: 'baby_name', title: '宝宝姓名' },
      { id: 'baby_age_months', title: '月龄' },
      { id: 'parent_phone', title: '家长手机号' },
      { id: 'store_name', title: '门店' },
      { id: 'current_status_label', title: '当前状态' },
      { id: 'created_at', title: '创建时间' },
      { id: 'closed_at', title: '关闭时间' },
      { id: 'closed_by', title: '关闭操作人' },
      { id: 'event_count', title: '时间线事件数' },
      { id: 'material_count', title: '材料数' }
    ]
  });
  
  const statusMap = {
    draft: '草稿',
    reviewing: '复核中',
    supplementing: '补充中',
    closed: '已关闭'
  };
  
  const records = cases.map(c => {
    const eventCount = db.prepare('SELECT COUNT(*) as cnt FROM timeline_events WHERE case_id = ?').get(c.id).cnt;
    const materialCount = db.prepare('SELECT COUNT(*) as cnt FROM materials WHERE case_id = ?').get(c.id).cnt;
    return {
      ...c,
      current_status_label: statusMap[c.current_status] || c.current_status,
      event_count: eventCount,
      material_count: materialCount
    };
  });
  
  const header = csvStringifier.getHeaderString();
  const body = csvStringifier.stringifyRecords(records);
  const csvContent = '\ufeff' + header + body;
  
  const filename = `sleep_review_export_${Date.now()}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csvContent);
});

app.get('/api/audits', (req, res) => {
  const { case_id, show_missing_only } = req.query;
  let sql = 'SELECT * FROM audits WHERE 1=1';
  const params = [];
  
  if (case_id) {
    sql += ' AND case_id = ?';
    params.push(case_id);
  }
  if (show_missing_only === '1') {
    sql += ' AND operator_missing = 1';
  }
  
  sql += ' ORDER BY created_at DESC';
  const audits = db.prepare(sql).all(...params);
  res.json(audits);
});

app.listen(PORT, () => {
  console.log(`婴幼儿睡眠观察复核墙服务已启动: http://localhost:${PORT}`);
});

module.exports = app;
