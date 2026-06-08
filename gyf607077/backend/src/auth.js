const jwt = require('jsonwebtoken');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'infant-sleep-review-secret-2024';

const ROLES = {
  SUPERVISOR: 'supervisor',
  PARENT: 'parent',
  ELDER: 'elder',
  NANNY: 'nanny'
};

const ROLE_PERMISSIONS = {
  [ROLES.SUPERVISOR]: ['read:all','create','update:all','submit','return','approve','archive','export','audit:view'],
  [ROLES.PARENT]: ['read:detail','create','update:own','submit','return','archive','export'],
  [ROLES.ELDER]: ['read:summary'],
  [ROLES.NANNY]: ['read:detail','create','update:own','submit']
};

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, displayName: user.display_name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: '未登录' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: '登录已过期' });
  }
}

function requirePermission(...perms) {
  return (req, res, next) => {
    const userPerms = ROLE_PERMISSIONS[req.user.role] || [];
    const has = perms.some(p => userPerms.includes(p));
    if (!has) return res.status(403).json({ error: '无权操作' });
    next();
  };
}

function canModifyObservation(user, observation) {
  if (user.role === ROLES.SUPERVISOR) return true;
  if (['update:all'].some(p => (ROLE_PERMISSIONS[user.role] || []).includes(p))) return true;
  return observation.created_by === user.id && (ROLE_PERMISSIONS[user.role] || []).includes('update:own');
}

module.exports = {
  JWT_SECRET,
  ROLES,
  ROLE_PERMISSIONS,
  signToken,
  authMiddleware,
  requirePermission,
  canModifyObservation
};
