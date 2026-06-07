import type { DataIssue, InfantRecord } from './types';

const ID_CARD_PATTERN = /(^\d{15}$)|(^\d{17}[\dXx]$)/;
const PHONE_PATTERN = /^1[3-9]\d{9}$/;
const SENSITIVE_PATTERNS = [
  { pattern: ID_CARD_PATTERN, label: '身份证号' },
  { pattern: /\d{16,19}/, label: '银行卡号' },
  { pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/, label: '邮箱地址' },
];

export function validatePhone(phone: string): DataIssue | null {
  if (!phone) {
    return {
      id: `issue-phone-${Date.now()}`,
      field: 'parentPhone',
      type: 'required_missing',
      severity: 'error',
      message: '家长手机号为必填项',
      reason: '手机号是联系家长的唯一紧急通道，夜班交接时必须完整填写，遗漏将导致无法在紧急情况下联系家长。',
    };
  }
  const cleanPhone = phone.replace(/\s|-/g, '');
  if (!PHONE_PATTERN.test(cleanPhone)) {
    return {
      id: `issue-phone-${Date.now()}`,
      field: 'parentPhone',
      type: 'phone_format',
      severity: 'error',
      message: `手机号格式异常："${phone}"`,
      reason: `检测到输入值 "${phone}" 不符合中国大陆手机号规范（应为 11 位数字且以 13-19 开头）。当前值可能包含空格、短横线、字母或位数不足，将导致导出后无法正常拨号。建议核实后修正。`,
    };
  }
  return null;
}

export function validateRequiredFields(record: Partial<InfantRecord>): DataIssue[] {
  const issues: DataIssue[] = [];

  if (!record.babyName?.trim()) {
    issues.push({
      id: `issue-name-${Date.now()}-1`,
      field: 'babyName',
      type: 'required_missing',
      severity: 'error',
      message: '宝宝姓名为必填项',
      reason: '宝宝姓名是记录识别的核心字段，缺失将导致该条记录无法与实际婴儿对应，在夜班交接时可能造成严重混淆。',
    });
  }

  if (!record.batchNo?.trim()) {
    issues.push({
      id: `issue-batch-${Date.now()}-2`,
      field: 'batchNo',
      type: 'required_missing',
      severity: 'warning',
      message: '批次号缺失',
      reason: '批次号用于追溯当日到园的婴幼儿群体，临时补充记录也建议补填批次号以便统一管理。当前记录可保存，但筛选时可能无法归入正常批次。',
    });
  }

  if (!record.birthDate) {
    issues.push({
      id: `issue-birth-${Date.now()}-3`,
      field: 'birthDate',
      type: 'required_missing',
      severity: 'warning',
      message: '出生日期未填写',
      reason: '出生日期用于判断年龄段和对应护理标准，缺失可能导致护理流程不符合规范。建议尽快补录。',
    });
  }

  const phoneIssue = validatePhone(record.parentPhone || '');
  if (phoneIssue) issues.push(phoneIssue);

  return issues;
}

export function validatePrivacyLeak(record: Partial<InfantRecord>): DataIssue[] {
  const issues: DataIssue[] = [];
  type PVKey = keyof InfantRecord['parentVisible'];
  const checkFields: { key: PVKey | 'internalNotes'; label: string; scope: string }[] = [
    { key: 'feeding', label: '喂养记录', scope: '家长可见区' },
    { key: 'temperature', label: '体温记录', scope: '家长可见区' },
    { key: 'sleep', label: '睡眠记录', scope: '家长可见区' },
    { key: 'internalNotes', label: '内部备注', scope: '内部备注区' },
  ];

  checkFields.forEach(({ key, label, scope }) => {
    let content: string;
    if (key === 'internalNotes') {
      content = record.internalNotes || '';
    } else {
      content = record.parentVisible?.[key] || '';
    }
    if (!content) return;

    SENSITIVE_PATTERNS.forEach(({ pattern, label: sensitiveLabel }) => {
      if (pattern.test(content)) {
        issues.push({
          id: `issue-privacy-${Date.now()}-${String(key)}-${Math.random().toString(36).slice(2, 6)}`,
          field: key,
          type: 'privacy_leak',
          severity: 'error',
          message: `${scope}-${label}中检测到疑似${sensitiveLabel}`,
          reason: `在"${scope}"的"${label}"字段中发现内容 "${content.slice(0, 30)}${content.length > 30 ? '...' : ''}"，其中包含疑似${sensitiveLabel}。导出家长可见内容时会直接泄露该信息，违反个人信息保护规范。请将敏感信息移至内部备注区并做脱敏处理。`,
        });
      }
    });
  });

  return issues;
}

export function validateAll(record: Partial<InfantRecord>): DataIssue[] {
  return [...validateRequiredFields(record), ...validatePrivacyLeak(record)];
}

export function computeStatus(issues: DataIssue[]): 'normal' | 'pending' | 'abnormal' {
  if (issues.length === 0) return 'normal';
  if (issues.some((i) => i.severity === 'error')) return 'abnormal';
  return 'pending';
}

export function maskPhone(phone: string): string {
  const clean = phone.replace(/\s|-/g, '');
  if (clean.length !== 11) return phone;
  return clean.slice(0, 3) + '****' + clean.slice(7);
}

export function toCSV(records: InfantRecord[], opts: { maskPhone: boolean; excludeInternal: boolean }): string {
  const headers = [
    '批次号',
    '宝宝姓名',
    '性别',
    '出生日期',
    '家长手机号',
    '数据来源',
    '状态',
    '喂养记录（家长可见）',
    '体温（家长可见）',
    '睡眠情况（家长可见）',
  ];
  if (!opts.excludeInternal) {
    headers.push('内部备注');
  }
  headers.push('数据质量问题数');
  headers.push('录入时间');
  headers.push('最后更新');

  const rows = records.map((r) => {
    const cells = [
      r.batchNo,
      r.babyName,
      r.gender === 'male' ? '男' : r.gender === 'female' ? '女' : '',
      r.birthDate,
      opts.maskPhone ? maskPhone(r.parentPhone) : r.parentPhone,
      r.source === 'batch' ? '批次记录' : '临时补充',
      r.status === 'normal' ? '正常' : r.status === 'pending' ? '待复核' : '异常',
      r.parentVisible.feeding,
      r.parentVisible.temperature,
      r.parentVisible.sleep,
    ];
    if (!opts.excludeInternal) {
      cells.push(r.internalNotes);
    }
    cells.push(String(r.issues.length));
    cells.push(r.createdAt);
    cells.push(r.updatedAt);
    return cells.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
