const db = require('./db');

function buildSummary(auth) {
  const parts = [];
  parts.push(`宝宝${auth.baby_name}`);
  if (auth.room_number) parts.push(`(${auth.room_number}房)`);
  parts.push(`接送人:${auth.authorized_person}`);
  if (auth.auth_type === 'phone') {
    parts.push(`[电话授权-${auth.phone_auth_by || '未知'}]`);
  } else if (auth.auth_type === 'temp_auntie') {
    parts.push(`[临时阿姨-${auth.temp_auntie_name || '未登记'}]`);
  } else if (auth.auth_type === 'mixed') {
    parts.push(`[混合:电话+临时阿姨]`);
  }
  const statusMap = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已驳回',
    closed: '已关闭',
    rectifying: '整改中'
  };
  parts.push(`状态:${statusMap[auth.status] || auth.status}`);
  return parts.join(' ');
}

function getFullAuth(id) {
  const auth = db.prepare('SELECT * FROM authorizations WHERE id = ?').get(id);
  if (!auth) return null;
  auth.photos = db.prepare('SELECT * FROM photos WHERE authorization_id = ? ORDER BY id').all(id);
  auth.rectifications = db.prepare('SELECT * FROM rectifications WHERE authorization_id = ? ORDER BY id').all(id);
  auth.summary = buildSummary(auth);
  return auth;
}

function getAllAuths() {
  const list = db.prepare('SELECT * FROM authorizations ORDER BY id DESC').all();
  return list.map(a => ({ ...a, summary: buildSummary(a) }));
}

function computeDerivedFields(auth) {
  return { ...auth, summary: buildSummary(auth) };
}

module.exports = {
  buildSummary,
  getFullAuth,
  getAllAuths,
  computeDerivedFields
};
