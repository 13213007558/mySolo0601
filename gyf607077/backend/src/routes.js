const express = require('express');
const db = require('./db');
const { signToken, authMiddleware, requirePermission, ROLES, ROLE_PERMISSIONS, canModifyObservation } = require('./auth');
const {
  createObservation,
  updateObservation,
  updateObservationStatus,
  listObservations,
  getObservationDetail,
  STATUS
} = require('./service');
const { getTimeline, getAudits, writeAudit, writeTimeline } = require('./audit');
const { exportObservationsCSV, exportTimelineCSV, EXPORT_DIR } = require('./exporter');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const STATUS_LABEL = {
  draft: '草稿',
  submitted: '已提交待复核',
  returned: '已退回补充',
  archived: '已关闭归档'
};
const ACTION_LABEL = {
  create: '创建',
  update: '修改',
  submit: '提交复核',
  return: '退回补充',
  approve: '复核通过',
  archive: '关闭归档',
  partial_success: '部分成功',
  rollback: '状态回退'
};
const ROLE_LABEL = {
  supervisor: '客服主管',
  parent: '父母',
  elder: '老人',
  nanny: '育儿嫂'
};

function enrichObs(o) {
  return { ...o, status_label: STATUS_LABEL[o.status] || o.status };
}

router.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: '用户名密码必填' });
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || user.password !== password) return res.status(401).json({ error: '用户名或密码错误' });
  writeAudit({ userId: user.id, action: 'login', ip: req.ip, userAgent: req.headers['user-agent'] });
  res.json({
    token: signToken(user),
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      roleLabel: ROLE_LABEL[user.role],
      displayName: user.display_name,
      permissions: ROLE_PERMISSIONS[user.role] || []
    }
  });
});

router.get('/auth/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    roleLabel: ROLE_LABEL[user.role],
    displayName: user.display_name,
    permissions: ROLE_PERMISSIONS[user.role] || []
  });
});

router.get('/observations', authMiddleware, (req, res) => {
  const rows = listObservations({ role: req.user.role, userId: req.user.id });
  let result = rows.map(enrichObs);

  if (req.user.role === ROLES.ELDER) {
    result = result.map(o => ({
      id: o.id,
      baby_name: o.baby_name,
      sleep_date: o.sleep_date,
      start_time: o.start_time,
      end_time: o.end_time,
      sleep_quality: o.sleep_quality,
      status: o.status,
      status_label: o.status_label,
      created_at: o.created_at,
      creator_name: o.creator_name,
      summary: `${o.baby_name} ${o.sleep_date} ${o.sleep_quality ? (o.sleep_quality === 'good' ? '睡眠良好' : o.sleep_quality === 'poor' ? '睡眠较差' : '睡眠一般') : ''}`
    }));
  }
  res.json(result);
});

router.get('/observations/:id', authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const obs = getObservationDetail(id, req.user);
  if (!obs) return res.status(404).json({ error: '记录不存在' });

  const timeline = getTimeline(id).map(t => ({ ...t, action_label: ACTION_LABEL[t.action], actor_role_label: ROLE_LABEL[t.actor_role] }));
  const audits = req.user.role === ROLES.SUPERVISOR ? getAudits(id) : undefined;

  if (req.user.role === ROLES.ELDER) {
    return res.json({
      observation: {
        id: obs.id,
        baby_name: obs.baby_name,
        sleep_date: obs.sleep_date,
        start_time: obs.start_time,
        end_time: obs.end_time,
        sleep_quality: obs.sleep_quality,
        status: obs.status,
        status_label: STATUS_LABEL[obs.status],
        created_at: obs.created_at,
        creator_name: obs.creator_name,
        summary: `${obs.baby_name} ${obs.sleep_date} ${obs.sleep_quality ? (obs.sleep_quality === 'good' ? '睡眠良好' : obs.sleep_quality === 'poor' ? '睡眠较差' : '睡眠一般') : ''}`
      },
      timeline: timeline.map(t => ({
        id: t.id, action: t.action, action_label: t.action_label, actor_name: t.actor_name, created_at: t.created_at, comment: t.comment
      }))
    });
  }
  res.json({ observation: enrichObs(obs), timeline, audits });
});

router.post('/observations', authMiddleware, requirePermission('create'), (req, res) => {
  try {
    const obs = createObservation(req.body, req.user.id);
    res.json(enrichObs(obs));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/observations/:id', authMiddleware, (req, res) => {
  try {
    const id = Number(req.params.id);
    const obs = updateObservation(id, req.body, req.user.id);
    res.json(enrichObs(obs));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/observations/:id/submit', authMiddleware, (req, res) => {
  try {
    const id = Number(req.params.id);
    const r = updateObservationStatus(id, STATUS.SUBMITTED, req.user.id, req.body && req.body.comment);
    res.json(r);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/observations/:id/return', authMiddleware, (req, res) => {
  try {
    const id = Number(req.params.id);
    const r = updateObservationStatus(id, STATUS.RETURNED, req.user.id, req.body && req.body.comment);
    res.json(r);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/observations/:id/archive', authMiddleware, (req, res) => {
  try {
    const id = Number(req.params.id);
    const r = updateObservationStatus(id, STATUS.ARCHIVED, req.user.id, req.body && req.body.comment);
    res.json(r);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/observations/batch-submit', authMiddleware, (req, res) => {
  const { ids } = req.body || {};
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids 必须是数组' });
  const success = [];
  const failed = [];
  for (const id of ids) {
    try {
      updateObservationStatus(id, STATUS.SUBMITTED, req.user.id, '批量提交');
      success.push(id);
    } catch (e) {
      failed.push({ id, error: e.message });
    }
  }
  if (success.length && failed.length) {
    const obsId = success[0];
    writeTimeline({
      observationId: obsId,
      action: 'partial_success',
      actorId: req.user.id,
      metadata: { success, failed, comment: '批量提交部分成功' }
    });
    writeAudit({
      observationId: obsId,
      userId: req.user.id,
      action: 'partial_success',
      newValue: { success, failed }
    });
  }
  res.json({ partial: true, success, failed, successCount: success.length, failedCount: failed.length });
});

router.post('/observations/:id/rollback', authMiddleware, requirePermission('audit:view'), (req, res) => {
  const id = Number(req.params.id);
  const targetStatus = req.body && req.body.status;
  const obs = db.prepare('SELECT * FROM observations WHERE id = ?').get(id);
  if (!obs) return res.status(404).json({ error: '记录不存在' });
  if (!targetStatus) return res.status(400).json({ error: '必须指定目标状态' });

  const allowedRollback = {
    [STATUS.SUBMITTED]: [STATUS.DRAFT],
    [STATUS.RETURNED]: [STATUS.DRAFT, STATUS.SUBMITTED],
    [STATUS.ARCHIVED]: [STATUS.SUBMITTED, STATUS.RETURNED, STATUS.DRAFT]
  };
  if (!allowedRollback[obs.status] || !allowedRollback[obs.status].includes(targetStatus)) {
    return res.status(400).json({ error: '不允许从 ' + obs.status + ' 回退到 ' + targetStatus });
  }
  const oldStatus = obs.status;
  db.prepare("UPDATE observations SET status = ?, updated_at = datetime('now','localtime'), version = version + 1 WHERE id = ?").run(targetStatus, id);
  writeTimeline({
    observationId: id,
    action: 'rollback',
    actorId: req.user.id,
    fromStatus: oldStatus,
    toStatus: targetStatus,
    comment: (req.body && req.body.comment) || '状态回退',
    metadata: { reason: (req.body && req.body.reason) || '管理员回退操作', actorIp: req.ip }
  });
  writeAudit({
    observationId: id,
    userId: req.user.id,
    action: 'rollback',
    oldValue: { status: oldStatus, version: obs.version },
    newValue: { status: targetStatus, version: obs.version + 1 },
    ip: req.ip
  });
  res.json({ ok: true, from: oldStatus, to: targetStatus });
});

router.get('/export/observations', authMiddleware, requirePermission('export'), (req, res) => {
  const { status } = req.query;
  try {
    const r = exportObservationsCSV(status || null);
    res.download(r.filepath, r.filename);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/export/observations/:id/timeline', authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  try {
    const r = exportTimelineCSV(id);
    res.download(r.filepath, r.filename);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/exports/list', authMiddleware, requirePermission('audit:view'), (req, res) => {
  const files = fs.readdirSync(EXPORT_DIR).map(f => {
    const stat = fs.statSync(path.join(EXPORT_DIR, f));
    return { filename: f, size: stat.size, mtime: stat.mtime };
  }).sort((a, b) => new Date(b.mtime) - new Date(a.mtime));
  res.json(files);
});

router.get('/meta/roles', (req, res) => {
  res.json({
    statuses: Object.entries(STATUS_LABEL).map(([k, v]) => ({ key: k, label: v })),
    actions: Object.entries(ACTION_LABEL).map(([k, v]) => ({ key: k, label: v })),
    roles: Object.entries(ROLE_LABEL).map(([k, v]) => ({ key: k, label: v }))
  });
});

module.exports = router;
