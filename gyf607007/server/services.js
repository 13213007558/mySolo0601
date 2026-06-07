const db = require('./db');
const fs = require('fs');
const path = require('path');

function addTimelineEvent(recordId, eventType, operator, remark, snapshot) {
  const stmt = db.prepare(`
    INSERT INTO timeline_events (record_id, event_type, operator, remark, snapshot_json)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(recordId, eventType, operator, remark || '', snapshot ? JSON.stringify(snapshot) : null);
}

function addAudit(recordId, auditType, detail, operator) {
  const stmt = db.prepare(`
    INSERT INTO audits (record_id, audit_type, detail, operator)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(recordId || null, auditType, detail, operator || 'system');
}

function createOrGetChild(name, birthDate, guardian) {
  let child = db.prepare('SELECT * FROM children WHERE name = ?').get(name);
  if (!child) {
    const info = db.prepare(`
      INSERT INTO children (name, birth_date, guardian) VALUES (?, ?, ?)
    `).run(name, birthDate || null, guardian || null);
    child = db.prepare('SELECT * FROM children WHERE id = ?').get(info.lastInsertRowid);
  }
  return child;
}

function importBatch(items, operator) {
  const successItems = [];
  const failedItems = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      if (!item.name || !item.shift_date) {
        throw new Error(`第 ${i + 1} 行缺少必填字段: 姓名或日期`);
      }
      if (!item.pages || !Array.isArray(item.pages) || item.pages.length === 0) {
        throw new Error(`第 ${i + 1} 行没有材料页面内容`);
      }

      const child = createOrGetChild(item.name, item.birth_date, item.guardian);

      const totalPages = item.total_pages || item.pages.length;
      const receivedPages = item.pages.length;
      const isPartial = receivedPages < totalPages ? 1 : 0;

      const info = db.prepare(`
        INSERT INTO records (child_id, shift_date, shift_type, status, total_pages, received_pages, is_partial, handler)
        VALUES (?, ?, 'night', 'draft', ?, ?, ?, ?)
      `).run(child.id, item.shift_date, totalPages, receivedPages, isPartial, operator);

      const recordId = info.lastInsertRowid;

      for (let p = 0; p < item.pages.length; p++) {
        const page = item.pages[p];
        db.prepare(`
          INSERT INTO record_pages (record_id, page_number, content, is_valid, invalid_reason)
          VALUES (?, ?, ?, ?, ?)
        `).run(recordId, page.page_number || (p + 1), page.content || '', page.is_valid !== undefined ? (page.is_valid ? 1 : 0) : 1, page.invalid_reason || null);
      }

      addTimelineEvent(recordId, 'created', operator, `录入 ${receivedPages}/${totalPages} 页材料` + (isPartial ? '（材料缺页，部分成功）' : ''), {
        child_name: child.name,
        shift_date: item.shift_date,
        total_pages: totalPages,
        received_pages: receivedPages
      });

      if (isPartial) {
        addAudit(recordId, 'partial_import', `材料缺页: 应到 ${totalPages} 页，实到 ${receivedPages} 页`, operator);
      }

      const validPages = db.prepare('SELECT COUNT(*) as cnt FROM record_pages WHERE record_id = ? AND is_valid = 1').get(recordId).cnt;
      if (validPages < receivedPages) {
        addAudit(recordId, 'invalid_page', `存在无效页面: 有效 ${validPages} / ${receivedPages}`, operator);
      }

      successItems.push({ index: i, record_id: recordId, name: item.name });
    } catch (err) {
      failedItems.push({ index: i, name: item.name || '(未知)', error: err.message });
      addAudit(null, 'import_row_failed', `导入行失败: ${err.message}`, operator);
    }
  }

  return { success: successItems, failed: failedItems, total: items.length };
}

function submitForReview(recordId, operator, remark) {
  const record = db.prepare('SELECT * FROM records WHERE id = ?').get(recordId);
  if (!record) throw new Error('记录不存在');
  if (record.status !== 'draft' && record.status !== 'returned') {
    throw new Error(`当前状态 ${record.status} 不能提交复核`);
  }

  db.prepare(`
    UPDATE records SET status = 'pending_review'
    WHERE id = ?
  `).run(recordId);

  addTimelineEvent(recordId, 'submit_review', operator, remark || '提交复核');
  return db.prepare('SELECT * FROM records WHERE id = ?').get(recordId);
}

function returnForSupplement(recordId, operator, remark) {
  const record = db.prepare('SELECT * FROM records WHERE id = ?').get(recordId);
  if (!record) throw new Error('记录不存在');
  if (record.status !== 'pending_review') {
    throw new Error(`当前状态 ${record.status} 不能退回补充`);
  }

  db.prepare(`
    UPDATE records SET status = 'returned'
    WHERE id = ?
  `).run(recordId);

  addTimelineEvent(recordId, 'return_supplement', operator, remark || '退回补充');
  addAudit(recordId, 'returned', remark || '退回补充', operator);
  return db.prepare('SELECT * FROM records WHERE id = ?').get(recordId);
}

function closeAndArchive(recordId, operator, remark) {
  const record = db.prepare('SELECT * FROM records WHERE id = ?').get(recordId);
  if (!record) throw new Error('记录不存在');
  if (record.status !== 'pending_review') {
    throw new Error(`当前状态 ${record.status} 不能关闭归档`);
  }

  db.prepare(`
    UPDATE records SET status = 'archived', reviewer = ?
    WHERE id = ?
  `).run(operator, recordId);

  addTimelineEvent(recordId, 'archived', operator, remark || '复核通过，关闭归档');
  return db.prepare('SELECT * FROM records WHERE id = ?').get(recordId);
}

function addRecordPages(recordId, pages, operator) {
  const record = db.prepare('SELECT * FROM records WHERE id = ?').get(recordId);
  if (!record) throw new Error('记录不存在');

  let added = 0;
  for (const page of pages) {
    db.prepare(`
      INSERT INTO record_pages (record_id, page_number, content, is_valid, invalid_reason)
      VALUES (?, ?, ?, ?, ?)
    `).run(recordId, page.page_number, page.content || '', page.is_valid !== undefined ? (page.is_valid ? 1 : 0) : 1, page.invalid_reason || null);
    added++;
  }

  const newReceived = record.received_pages + added;
  const stillPartial = newReceived < record.total_pages ? 1 : 0;
  db.prepare(`
    UPDATE records SET received_pages = ?, is_partial = ?
    WHERE id = ?
  `).run(newReceived, stillPartial, recordId);

  addTimelineEvent(recordId, 'add_pages', operator, `补充 ${added} 页材料（当前 ${newReceived}/${record.total_pages}）`);

  if (!stillPartial && record.is_partial) {
    addAudit(recordId, 'pages_completed', `材料已补全: ${newReceived}/${record.total_pages} 页`, operator);
  }

  return { added, received_pages: newReceived, total_pages: record.total_pages };
}

function getRecordDetail(recordId) {
  const record = db.prepare(`
    SELECT r.*, c.name as child_name, c.birth_date, c.guardian
    FROM records r JOIN children c ON r.child_id = c.id WHERE r.id = ?
  `).get(recordId);
  if (!record) return null;

  record.pages = db.prepare('SELECT * FROM record_pages WHERE record_id = ? ORDER BY page_number').all(recordId);
  record.timeline = db.prepare('SELECT * FROM timeline_events WHERE record_id = ? ORDER BY id').all(recordId);
  return record;
}

function listRecords(status) {
  let sql = `
    SELECT r.*, c.name as child_name, c.birth_date
    FROM records r JOIN children c ON r.child_id = c.id
  `;
  const params = [];
  if (status) {
    sql += ' WHERE r.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY r.id DESC';
  return db.prepare(sql).all(...params);
}

function listAudits(recordId) {
  let sql = 'SELECT * FROM audits';
  const params = [];
  if (recordId) {
    sql += ' WHERE record_id = ?';
    params.push(recordId);
  }
  sql += ' ORDER BY id DESC';
  return db.prepare(sql).all(...params);
}

function listExports() {
  return db.prepare('SELECT * FROM exports ORDER BY id DESC').all();
}

function exportRecords(recordIds, operator) {
  const placeholders = recordIds.map(() => '?').join(',');
  const records = db.prepare(`
    SELECT r.*, c.name as child_name, c.birth_date, c.guardian
    FROM records r JOIN children c ON r.child_id = c.id
    WHERE r.id IN (${placeholders})
  `).all(...recordIds);

  let expectedPages = 0;
  let actualPages = 0;
  const exportItems = [];

  for (const rec of records) {
    expectedPages += rec.total_pages;
    const pages = db.prepare('SELECT * FROM record_pages WHERE record_id = ? ORDER BY page_number').all(rec.id);
    actualPages += pages.length;
    exportItems.push({ record: rec, pages });
  }

  const hasMismatch = records.length !== recordIds.length || expectedPages !== actualPages;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `export_${timestamp}.json`;
  const filePath = path.join(__dirname, '..', 'exports', fileName);

  const exportData = {
    export_time: new Date().toISOString(),
    operator,
    requested_record_ids: recordIds,
    exported_record_count: records.length,
    expected_record_count: recordIds.length,
    expected_total_pages: expectedPages,
    actual_total_pages: actualPages,
    has_mismatch: hasMismatch,
    mismatch_detail: {
      record_count_diff: recordIds.length - records.length,
      page_count_diff: expectedPages - actualPages
    },
    items: exportItems
  };

  fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2), 'utf8');

  db.prepare(`
    INSERT INTO exports (export_date, record_ids, expected_count, actual_count, expected_pages, actual_pages, has_mismatch, file_path, operator)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    JSON.stringify(recordIds),
    recordIds.length,
    records.length,
    expectedPages,
    actualPages,
    hasMismatch ? 1 : 0,
    filePath,
    operator
  );

  if (hasMismatch) {
    addAudit(null, 'export_mismatch',
      `导出不一致: 请求 ${recordIds.length} 条，实际 ${records.length} 条；期望 ${expectedPages} 页，实际 ${actualPages} 页。文件: ${fileName}`,
      operator);
  }

  return {
    file_path: filePath,
    file_name: fileName,
    has_mismatch: hasMismatch,
    expected_record_count: recordIds.length,
    actual_record_count: records.length,
    expected_pages: expectedPages,
    actual_pages: actualPages
  };
}

module.exports = {
  importBatch,
  submitForReview,
  returnForSupplement,
  closeAndArchive,
  addRecordPages,
  getRecordDetail,
  listRecords,
  listAudits,
  listExports,
  exportRecords
};
