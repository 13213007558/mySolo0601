#!/usr/bin/env python3
import os

content = '''const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const { createObjectCsvStringifier } = require('csv-writer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

function generateCaseNo() {
  const date = new Date();
  const prefix = `SLP${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM cases WHERE case_no LIKE ?').get(`${prefix}%`);
  return `${prefix}${String(existing.cnt + 1).padStart(4, '0')}`;
}

function addAudit(caseId, eventId, action, detail, operatorId, operatorName) {
  const missing = (!operatorId && !operatorName) ? 1 : 0;
  db.prepare(`
    INSERT INTO audits (case_id, event_id, action, detail, operator_id, operator_name, operator_missing)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(caseId, eventId, action, detail, operatorId, operatorName, missing);
}

function addTimelineEvent(caseId, eventType, eventTitle, description, operatorId, operatorName, statusBefore, statusAfter) {
  const missing = (!operatorId && !operatorName) ? 1 : 0;
  const result = db.prepare(`
    INSERT INTO timeline_events (case_id, event_type, event_title, description, operator_id, operator_name, operator_missing, status_before, status_after)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(caseId, eventType, eventTitle, description, operatorId, operatorName, missing, statusBefore, statusAfter);
  
  addAudit(caseId, result.lastInsertRowid, eventType, description, operatorId, operatorName);
  return result.lastInsertRowid;
}

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
  const csvContent = '\\ufeff' + header + body;
  
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
'''

target_path = '/Users/guo/pro/solo/workspaces/gyf607027/server/src/index.js'
with open(target_path, 'w', encoding='utf-8') as f:
    f.write(content)

size = os.path.getsize(target_path)
print(f'写入成功，字节数: {size}')
