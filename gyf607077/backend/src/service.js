const db = require('./db');
const { writeTimeline, writeAudit } = require('./audit');
const { ROLES, canModifyObservation } = require('./auth');

const STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  RETURNED: 'returned',
  ARCHIVED: 'archived'
};

const ALLOWED_TRANSITIONS = {
  [STATUS.DRAFT]: [STATUS.SUBMITTED],
  [STATUS.SUBMITTED]: [STATUS.RETURNED, STATUS.ARCHIVED],
  [STATUS.RETURNED]: [STATUS.SUBMITTED, STATUS.ARCHIVED],
  [STATUS.ARCHIVED]: []
};

function canTransition(from, to) {
  return (ALLOWED_TRANSITIONS[from] || []).includes(to);
}

function updateObservationStatus(id, newStatus, actorId, comment, metadata) {
  const obs = db.prepare('SELECT * FROM observations WHERE id = ?').get(id);
  if (!obs) throw new Error('记录不存在');
  if (!canTransition(obs.status, newStatus)) {
    throw new Error(`不允许从 ${obs.status} 变更为 ${newStatus}`);
  }
  const oldStatus = obs.status;
  const action = newStatus === STATUS.SUBMITTED ? 'submit'
    : newStatus === STATUS.RETURNED ? 'return'
    : newStatus === STATUS.ARCHIVED ? 'archive' : 'update';

  const result = db.prepare(`
    UPDATE observations
    SET status = ?, updated_at = datetime('now','localtime'), version = version + 1
    WHERE id = ?
  `).run(newStatus, id);

  writeTimeline({
    observationId: id,
    action,
    actorId,
    fromStatus: oldStatus,
    toStatus: newStatus,
    comment,
    metadata
  });

  writeAudit({
    observationId: id,
    userId: actorId,
    action: `status:${oldStatus}->${newStatus}`,
    oldValue: { status: oldStatus, version: obs.version },
    newValue: { status: newStatus, version: obs.version + 1 }
  });

  return { changes: result.changes, newStatus, oldStatus };
}

function createObservation(data, actorId) {
  const stmt = db.prepare(`
    INSERT INTO observations
    (baby_name, sleep_date, start_time, end_time, sleep_quality, environment, notes, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.baby_name,
    data.sleep_date,
    data.start_time,
    data.end_time || null,
    data.sleep_quality || null,
    data.environment || null,
    data.notes || null,
    STATUS.DRAFT,
    actorId
  );
  const id = result.lastInsertRowid;
  writeTimeline({
    observationId: id,
    action: 'create',
    actorId,
    toStatus: STATUS.DRAFT,
    metadata: { babyName: data.baby_name, sleepDate: data.sleep_date }
  });
  writeAudit({
    observationId: id,
    userId: actorId,
    action: 'create',
    newValue: data
  });
  return db.prepare('SELECT * FROM observations WHERE id = ?').get(id);
}

function updateObservation(id, data, actorId) {
  const obs = db.prepare('SELECT * FROM observations WHERE id = ?').get(id);
  if (!obs) throw new Error('记录不存在');
  if (!canModifyObservation({ id: actorId, role: db.prepare('SELECT role FROM users WHERE id = ?').get(actorId).role }, obs)) {
    throw new Error('无权修改此记录');
  }
  const fieldsChanged = [];
  const patch = {};
  const allowedFields = ['baby_name', 'sleep_date', 'start_time', 'end_time', 'sleep_quality', 'environment', 'notes'];
  for (const f of allowedFields) {
    if (data[f] !== undefined && data[f] !== obs[f]) {
      patch[f] = data[f];
      fieldsChanged.push(f);
    }
  }
  if (fieldsChanged.length === 0) return obs;

  const sets = fieldsChanged.map(f => `${f} = ?`).join(', ');
  const values = fieldsChanged.map(f => patch[f]);
  values.push(id);
  db.prepare(`UPDATE observations SET ${sets}, updated_at = datetime('now','localtime'), version = version + 1 WHERE id = ?`).run(...values);

  writeTimeline({
    observationId: id,
    action: 'update',
    actorId,
    fromStatus: obs.status,
    toStatus: obs.status,
    fieldsChanged,
    metadata: { version: obs.version + 1 }
  });
  writeAudit({
    observationId: id,
    userId: actorId,
    action: 'update',
    oldValue: Object.fromEntries(fieldsChanged.map(f => [f, obs[f]])),
    newValue: patch
  });
  return db.prepare('SELECT * FROM observations WHERE id = ?').get(id);
}

function listObservations({ role, userId }) {
  let rows;
  if (role === ROLES.SUPERVISOR) {
    rows = db.prepare(`
      SELECT o.*, u.display_name AS creator_name
      FROM observations o LEFT JOIN users u ON u.id = o.created_by
      ORDER BY o.updated_at DESC
    `).all();
  } else {
    rows = db.prepare(`
      SELECT o.*, u.display_name AS creator_name
      FROM observations o LEFT JOIN users u ON u.id = o.created_by
      WHERE o.created_by = ? OR o.status = 'archived'
      ORDER BY o.updated_at DESC
    `).all(userId);
  }
  return rows;
}

function getObservationDetail(id, user) {
  const obs = db.prepare(`
    SELECT o.*, u.display_name AS creator_name, u.role AS creator_role
    FROM observations o LEFT JOIN users u ON u.id = o.created_by
    WHERE o.id = ?
  `).get(id);
  if (!obs) return null;
  if (user.role !== ROLES.SUPERVISOR && obs.created_by !== user.id && obs.status !== STATUS.ARCHIVED) {
    return null;
  }
  return obs;
}

module.exports = {
  STATUS,
  ALLOWED_TRANSITIONS,
  canTransition,
  createObservation,
  updateObservation,
  updateObservationStatus,
  listObservations,
  getObservationDetail
};
