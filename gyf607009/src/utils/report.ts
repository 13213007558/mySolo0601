import type {
  PickupRecord,
  AuditLog,
  CorrectionRecord,
  ExportReport,
  ExportReportSummary,
} from '@/types';

export function generateId(prefix = 'ID'): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return iso;
  }
}

export function shortId(id: string): string {
  return id.length > 16 ? id.slice(0, 14) + '…' : id;
}

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);
}

export async function computeConsistencyHash(
  records: PickupRecord[],
  auditLogs: AuditLog[],
  corrections: CorrectionRecord[]
): Promise<string> {
  const payload = JSON.stringify({
    r: records.map((x) => [x.id, x.status, x.updatedAt]),
    a: auditLogs.map((x) => [x.id, x.recordId, x.action, x.timestamp]),
    c: corrections.map((x) => [x.id, x.recordId, x.correctedAt]),
  });
  return sha256(payload);
}

export function buildReportSummary(
  records: PickupRecord[],
  hash: string
): ExportReportSummary {
  const totalExpected = records.filter((r) => !r.isBadRow).length;
  return {
    totalExpected,
    totalPicked: records.filter((r) => r.status === 'picked').length,
    totalException: records.filter((r) => r.status === 'exception' && !r.isBadRow).length,
    totalPhoneAuthorized: records.filter((r) => r.pickupType === 'phone_authorized').length,
    totalTempAunt: records.filter((r) => r.pickupType === 'temp_aunt').length,
    totalWithdrawn: records.filter((r) => r.status === 'withdrawn').length,
    totalBadRows: records.filter((r) => r.isBadRow).length,
    generatedAt: nowISO(),
    shiftName: '西门夜班 17:00-次日08:00',
    consistencyHash: hash,
  };
}

export async function buildExportReport(
  records: PickupRecord[],
  auditLogs: AuditLog[],
  corrections: CorrectionRecord[]
): Promise<ExportReport> {
  const hash = await computeConsistencyHash(records, auditLogs, corrections);
  return {
    summary: buildReportSummary(records, hash),
    records,
    auditLogs,
    corrections,
  };
}

function escapeCsv(val: unknown): string {
  const s = val === null || val === undefined ? '' : String(val);
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export function reportToCsv(report: ExportReport): string {
  const header = [
    '记录ID', '宝宝姓名', '班级', '状态', '接送类型', '授权人',
    '实际接走人', '是否坏行', '异常原因', '冲突备注',
    '授权通话人', '授权电话', '授权时间', '身份核验通过', '授权内容',
    '临时阿姨姓名', '临时阿姨工号', '阿姨核验时间', '阿姨备注',
    '撤回原因', '撤回人', '撤回时间',
    '创建时间', '更新时间', '摘要一致性哈希',
  ];
  const rows = report.records.map((r) => [
    r.id, r.babyName, r.className, r.status, r.pickupType, r.authorizedBy,
    r.pickupPerson, r.isBadRow ? '是' : '否', r.exceptionReason ?? '', r.conflictNote ?? '',
    r.phoneAuth?.callerName ?? '', r.phoneAuth?.callerPhone ?? '', r.phoneAuth?.authTime ?? '',
    r.phoneAuth?.identityVerified ? '是' : '否', r.phoneAuth?.authContent ?? '',
    r.tempAunt?.auntName ?? '', r.tempAunt?.auntId ?? '', r.tempAunt?.verifiedAt ?? '', r.tempAunt?.relationNote ?? '',
    r.withdrawnReason ?? '', r.withdrawnBy ?? '', r.withdrawnAt ?? '',
    r.createdAt, r.updatedAt, report.summary.consistencyHash,
  ]);
  const auditHeader = ['--- 审计日志 ---', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
  const auditRows = [
    ['日志ID', '关联记录ID', '操作', '操作人', '操作人角色', '时间', '变更字段', '变更前', '变更后', '原因', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ...report.auditLogs.map((a) => [
      a.id, a.recordId, a.action, a.operator, a.operatorRole, a.timestamp,
      a.fieldChanged ?? '', a.oldValue ?? '', a.newValue ?? '', a.reason ?? '',
      '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
    ]),
  ];
  const lines = [
    `# 婴幼儿接送授权夜班交接报告 - ${report.summary.shiftName}`,
    `# 生成时间: ${report.summary.generatedAt}`,
    `# 一致性哈希: ${report.summary.consistencyHash}`,
    `# 摘要: 应接${report.summary.totalExpected}/已接${report.summary.totalPicked}/异常${report.summary.totalException}/电话授权${report.summary.totalPhoneAuthorized}/临时阿姨${report.summary.totalTempAunt}/撤回${report.summary.totalWithdrawn}/坏行${report.summary.totalBadRows}`,
    header.map(escapeCsv).join(','),
    ...rows.map((row) => row.map(escapeCsv).join(',')),
    auditHeader.join(','),
    ...auditRows.map((row) => row.map(escapeCsv).join(',')),
  ];
  return lines.join('\n');
}

export function reportToMarkdown(report: ExportReport): string {
  const s = report.summary;
  const md: string[] = [];
  md.push(`# 婴幼儿接送授权夜班交接报告`);
  md.push('');
  md.push(`> 班次：**${s.shiftName}**  `);
  md.push(`> 生成时间：${formatTime(s.generatedAt)}  `);
  md.push(`> 数据一致性哈希：\`${s.consistencyHash}\``);
  md.push('');
  md.push('## 一、夜班摘要');
  md.push('');
  md.push('| 指标 | 数量 |');
  md.push('|------|------|');
  md.push(`| 应接送宝宝（排除坏行） | ${s.totalExpected} |`);
  md.push(`| 已接走 | ${s.totalPicked} |`);
  md.push(`| 异常（不含坏行） | ${s.totalException} |`);
  md.push(`| 电话授权 | ${s.totalPhoneAuthorized} |`);
  md.push(`| 临时阿姨 | ${s.totalTempAunt} |`);
  md.push(`| 已撤回 | ${s.totalWithdrawn} |`);
  md.push(`| 坏行（已隔离） | ${s.totalBadRows} |`);
  md.push('');
  md.push('## 二、接送记录明细');
  md.push('');
  md.push('| 记录ID | 宝宝 | 班级 | 状态 | 类型 | 授权人 | 接走人 | 坏行 | 备注 |');
  md.push('|--------|------|------|------|------|--------|--------|------|------|');
  report.records.forEach((r) => {
    const notes = [r.exceptionReason, r.conflictNote, r.withdrawnReason].filter(Boolean).join('；');
    md.push(`| ${r.id} | ${r.babyName} | ${r.className} | ${r.status} | ${r.pickupType} | ${r.authorizedBy || '-'} | ${r.pickupPerson || '-'} | ${r.isBadRow ? '是' : '否'} | ${notes || '-'} |`);
  });
  md.push('');
  md.push('## 三、异常与撤回清单');
  md.push('');
  const problems = report.records.filter((r) => r.status === 'exception' || r.status === 'withdrawn');
  if (problems.length === 0) {
    md.push('无异常与撤回记录。');
  } else {
    problems.forEach((r) => {
      md.push(`### ${r.babyName}（${r.id}）`);
      md.push(`- 状态：${r.status}`);
      if (r.exceptionReason) md.push(`- 异常原因：${r.exceptionReason}`);
      if (r.conflictNote) md.push(`- 冲突说明：${r.conflictNote}`);
      if (r.withdrawnReason) md.push(`- 撤回原因：${r.withdrawnReason}`);
      if (r.withdrawnBy) md.push(`- 撤回操作人：${r.withdrawnBy}（${formatTime(r.withdrawnAt!)}）`);
      md.push('');
    });
  }
  md.push('## 四、审计变更历史');
  md.push('');
  md.push('| 时间 | 操作 | 记录ID | 操作人 | 字段 | 变更前 → 变更后 | 原因 |');
  md.push('|------|------|--------|--------|------|-----------------|------|');
  report.auditLogs.forEach((a) => {
    const change = a.fieldChanged
      ? `\`${a.oldValue ?? '-'}\` → \`${a.newValue ?? '-'}\``
      : '-';
    md.push(`| ${formatTime(a.timestamp)} | ${a.action} | ${a.recordId} | ${a.operator} | ${a.fieldChanged || '-'} | ${change} | ${a.reason || '-'} |`);
  });
  md.push('');
  md.push('## 五、人工更正记录');
  md.push('');
  if (report.corrections.length === 0) {
    md.push('本次交接尚无人工更正记录。');
  } else {
    report.corrections.forEach((c) => {
      md.push(`- 更正ID ${c.id}（记录 ${c.recordId}）`);
      md.push(`  - 更正人：${c.correctedBy} @ ${formatTime(c.correctedAt)}`);
      md.push(`  - 更正原因：${c.correctionReason}`);
      md.push(`  - 主管复查：${c.isReviewed ? `已复查（${c.reviewedBy} @ ${formatTime(c.reviewedAt!)}）` : '待复查'}`);
    });
  }
  md.push('');
  md.push('---');
  md.push(`*本报告由提醒墙自动生成，页面摘要、列表详情、CSV 与 Markdown 基于同一数据源（哈希 \`${s.consistencyHash}\`），可互相对证。*`);
  return md.join('\n');
}

export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
