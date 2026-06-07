const db = require('./db');
const { getFullAuth, getAllAuths, buildSummary } = require('./auth-service');

function escapeCsv(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function exportCsv(id) {
  const headers = [
    'ID', '宝宝姓名', '出生日期', '房号', '母亲姓名',
    '被授权人', '身份证号', '联系电话', '与宝宝关系',
    '授权类型', '电话授权人', '电话授权备注', '临时阿姨姓名',
    '状态', '页面摘要', '关闭时间', '关闭人',
    '创建时间', '更新时间',
    '照片数量', '照片说明(合并)',
    '整改记录数量', '整改内容(合并)'
  ];
  let rows;
  if (id) {
    const a = getFullAuth(id);
    rows = a ? [a] : [];
  } else {
    rows = getAllAuths().map(a => getFullAuth(a.id));
  }
  const lines = [headers.map(escapeCsv).join(',')];
  for (const a of rows) {
    lines.push([
      a.id, a.baby_name, a.baby_dob, a.room_number, a.mother_name,
      a.authorized_person, a.id_card, a.phone, a.relationship,
      a.auth_type, a.phone_auth_by, a.phone_auth_note, a.temp_auntie_name,
      a.status, buildSummary(a),
      a.closed_at, a.closed_by,
      a.created_at, a.updated_at,
      a.photos.length,
      a.photos.map(p => `${p.filename}:${p.description || ''}`).join(' | '),
      a.rectifications.length,
      a.rectifications.map(r => `[${r.status}]${r.content}(处理人:${r.handler || '未指定'})`).join(' | ')
    ].map(escapeCsv).join(','));
  }
  return lines.join('\n') + '\n';
}

function exportMarkdown(id) {
  let rows;
  if (id) {
    const a = getFullAuth(id);
    rows = a ? [a] : [];
  } else {
    rows = getAllAuths().map(a => getFullAuth(a.id));
  }
  const statusMap = {
    pending: '待审核', approved: '已通过', rejected: '已驳回',
    closed: '已关闭', rectifying: '整改中'
  };
  const typeMap = {
    normal: '正常授权',
    phone: '电话授权',
    temp_auntie: '临时阿姨',
    mixed: '混合(电话+临时阿姨)'
  };
  let md = '# 婴幼儿接送授权回访册（月子护理版）\n\n';
  md += `> 导出时间：${new Date().toLocaleString('zh-CN')}\n\n`;
  md += `共 ${rows.length} 条记录\n\n---\n\n`;
  for (const a of rows) {
    md += `## #${a.id} ${buildSummary(a)}\n\n`;
    md += `- **状态**：${statusMap[a.status] || a.status}\n`;
    md += `- **授权类型**：${typeMap[a.auth_type] || a.auth_type}\n`;
    md += `- **宝宝**：${a.baby_name}${a.baby_dob ? ` (${a.baby_dob})` : ''}\n`;
    md += `- **房号/母亲**：${a.room_number || '-'} / ${a.mother_name || '-'}\n`;
    md += `- **被授权接送人**：${a.authorized_person} | 电话:${a.phone || '-'} | 关系:${a.relationship || '-'}\n`;
    if (a.auth_type === 'phone' || a.auth_type === 'mixed') {
      md += `- **电话授权人**：${a.phone_auth_by || '未记录'}；备注：${a.phone_auth_note || '-'}\n`;
    }
    if (a.auth_type === 'temp_auntie' || a.auth_type === 'mixed') {
      md += `- **临时阿姨**：${a.temp_auntie_name || '未登记'}\n`;
    }
    md += `- **创建/更新**：${a.created_at} / ${a.updated_at}\n`;
    if (a.closed_at) {
      md += `- **关闭**：${a.closed_at} by ${a.closed_by || '-'}\n`;
    }
    if (a.photos.length) {
      md += `\n### 照片附件 (${a.photos.length})\n\n`;
      md += '| 文件 | 说明 | 上传人 | 时间 |\n|---|---|---|---|\n';
      for (const p of a.photos) {
        md += `| ${p.filename} | ${p.description || '-'} | ${p.uploaded_by || '-'} | ${p.created_at} |\n`;
      }
    }
    if (a.rectifications.length) {
      md += `\n### 整改记录 (${a.rectifications.length})\n\n`;
      for (const r of a.rectifications) {
        md += `- [${statusMap[r.status] || r.status}] ${r.content}  _处理人:${r.handler || '-'} (${r.updated_at})_\n`;
      }
    }
    md += '\n---\n\n';
  }
  return md;
}

module.exports = { exportCsv, exportMarkdown };
