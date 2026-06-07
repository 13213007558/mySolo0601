const jwt = require('jsonwebtoken');
const db = require('./db');

const SECRET = 'baby-sleep-observation-secret-key-2024';

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, name: user.name },
    SECRET,
    { expiresIn: '7d' }
  );
}

function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录' });
  }
  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: '登录已过期' });
  }
}

function roleRequired(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
}

function audit(req, action, targetType, targetId, detail) {
  const ip = (req.ip || req.connection.remoteAddress || '').toString();
  db.prepare(
    'INSERT INTO audit_logs (user_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.user.id, action, targetType, targetId, detail || null, ip);
}

function canAccessRecord(user, record) {
  if (user.role === 'supervisor') return true;
  if (user.role === 'consultant' && record.consultant_id === user.id) return true;
  if (user.role === 'parent') {
    const baby = db.prepare('SELECT * FROM babies WHERE id = ?').get(record.baby_id);
    if (baby && baby.parent_id === user.id) return true;
  }
  return false;
}

module.exports = { signToken, authRequired, roleRequired, audit, canAccessRecord, SECRET };
