const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');
const db = require('./db');

const EXPORT_DIR = path.join(__dirname, '..', 'exports');
if (!fs.existsSync(EXPORT_DIR)) fs.mkdirSync(EXPORT_DIR, { recursive: true });

function exportObservationsCSV(statusFilter) {
  const where = statusFilter ? 'WHERE status = ?' : '';
  const params = statusFilter ? [statusFilter] : [];
  const rows = db.prepare(`
    SELECT
      o.id,
      o.baby_name,
      o.sleep_date,
      o.start_time,
      o.end_time,
      o.sleep_quality,
      o.environment,
      o.notes,
      o.status,
      o.version,
      u.display_name AS creator,
      o.created_at,
      o.updated_at
    FROM observations o
    LEFT JOIN users u ON u.id = o.created_by
    ${where}
    ORDER BY o.sleep_date DESC, o.created_at DESC
  `).all(...params);

  const filename = `sleep-observations-${Date.now()}.csv`;
  const filepath = path.join(EXPORT_DIR, filename);

  const csvWriter = createObjectCsvWriter({
    path: filepath,
    header: [
      { id: 'id', title: 'ID' },
      { id: 'baby_name', title: '宝宝姓名' },
      { id: 'sleep_date', title: '睡眠日期' },
      { id: 'start_time', title: '开始时间' },
      { id: 'end_time', title: '结束时间' },
      { id: 'sleep_quality', title: '睡眠质量' },
      { id: 'environment', title: '环境' },
      { id: 'notes', title: '备注' },
      { id: 'status', title: '状态' },
      { id: 'version', title: '版本号' },
      { id: 'creator', title: '录入人' },
      { id: 'created_at', title: '创建时间' },
      { id: 'updated_at', title: '更新时间' }
    ]
  });

  csvWriter.writeRecords(rows);
  return { filename, filepath, count: rows.length };
}

function exportTimelineCSV(observationId) {
  const rows = db.prepare(`
    SELECT
      t.id,
      t.action,
      u.display_name AS actor,
      u.role AS actor_role,
      t.from_status,
      t.to_status,
      t.comment,
      t.fields_changed,
      t.created_at
    FROM timelines t
    LEFT JOIN users u ON u.id = t.actor_id
    WHERE t.observation_id = ?
    ORDER BY t.created_at DESC
  `).all(observationId);

  const filename = `observation-${observationId}-timeline-${Date.now()}.csv`;
  const filepath = path.join(EXPORT_DIR, filename);

  const csvWriter = createObjectCsvWriter({
    path: filepath,
    header: [
      { id: 'id', title: 'ID' },
      { id: 'action', title: '动作' },
      { id: 'actor', title: '操作人' },
      { id: 'actor_role', title: '角色' },
      { id: 'from_status', title: '原状态' },
      { id: 'to_status', title: '新状态' },
      { id: 'comment', title: '备注' },
      { id: 'fields_changed', title: '变更字段' },
      { id: 'created_at', title: '时间' }
    ]
  });

  csvWriter.writeRecords(rows);
  return { filename, filepath, count: rows.length };
}

module.exports = { exportObservationsCSV, exportTimelineCSV, EXPORT_DIR };
