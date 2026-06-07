import type { InfantRecord, HistoryVersion, AuditLog } from './types';

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function formatDateTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function getGenderLabel(gender: 'male' | 'female'): string {
  return gender === 'male' ? '男' : '女';
}

export function exportToCSV(records: InfantRecord[]): string {
  const headers = [
    '批次号',
    '婴幼儿姓名',
    '性别',
    '出生日期',
    '家长姓名',
    '联系电话',
    '状态',
    '家长可见内容',
    '内部备注',
    '原始承诺',
    '创建时间',
    '更新时间',
    '创建人',
  ];
  const statusMap: Record<string, string> = {
    pending: '待复核',
    reviewed: '已复核',
    closed: '已关闭',
    invalid: '无效数据',
  };
  const rows = records.map((r) => [
    r.batchNo,
    r.infantName,
    getGenderLabel(r.gender),
    r.birthDate,
    r.parentName,
    r.phone,
    statusMap[r.status] || r.status,
    r.parentVisibleContent.replace(/\n/g, ' '),
    r.internalNotes.replace(/\n/g, ' '),
    r.originalPromise.replace(/\n/g, ' '),
    formatDateTime(r.createdAt),
    formatDateTime(r.updatedAt),
    r.createdBy,
  ]);
  const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n');
  return '\uFEFF' + csv;
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const STORAGE_KEYS = {
  records: 'wutong_infant_records',
  histories: 'wutong_infant_histories',
  audits: 'wutong_infant_audits',
  currentUser: 'wutong_current_user',
};

export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function createMockData(): {
  records: InfantRecord[];
  histories: HistoryVersion[];
  audits: AuditLog[];
} {
  const now = new Date();
  const daysAgo = (n: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    return d.toISOString();
  };

  const records: InfantRecord[] = [
    {
      id: uid(),
      infantName: '张小宝',
      batchNo: 'WT-2026-001',
      gender: 'male',
      birthDate: '2024-03-15',
      parentName: '张建国',
      phone: '13800138001',
      status: 'reviewed',
      parentVisibleContent: '已安排6月15日上午9:30试听蒙氏感官课，家长已确认。',
      internalNotes: '家长对课程价格敏感，推荐季卡套餐。',
      originalPromise: '赠送一次免费发育评估，试听当天安排。',
      isBadData: false,
      createdAt: daysAgo(5),
      updatedAt: daysAgo(2),
      createdBy: '李顾问',
      lastUpdatedBy: '王顾问',
    },
    {
      id: uid(),
      infantName: '刘朵朵',
      batchNo: 'WT-2026-002',
      gender: 'female',
      birthDate: '2024-08-22',
      parentName: '刘美丽',
      phone: '13900139002',
      status: 'pending',
      parentVisibleContent: '试听预约中，等待家长确认具体时间。',
      internalNotes: '家长临时改口说周末可能有冲突，等明天回话。原始承诺是安排本周三下午。',
      originalPromise: '本周三下午2点试听课，赠送儿童绘本一套。',
      isBadData: false,
      createdAt: daysAgo(3),
      updatedAt: daysAgo(1),
      createdBy: '王顾问',
      lastUpdatedBy: '李顾问',
    },
    {
      id: uid(),
      infantName: '陈乐乐',
      batchNo: 'WT-2026-003',
      gender: 'male',
      birthDate: '2023-11-10',
      parentName: '陈志远',
      phone: '13700137003',
      status: 'closed',
      parentVisibleContent: '已完成试听，家长表示暂不考虑。',
      internalNotes: '家长对早教接受度低，已关闭记录。后追加材料：家长微信咨询亲子活动，已回复。',
      originalPromise: '试听满意可享首月8折。',
      isBadData: false,
      appendedMaterials: [
        {
          id: uid(),
          content: '家长主动微信咨询下周末亲子活动，已发送活动海报并预留名额。',
          operator: '王顾问',
          appendedAt: daysAgo(0),
        },
      ],
      createdAt: daysAgo(10),
      updatedAt: daysAgo(0),
      createdBy: '李顾问',
      lastUpdatedBy: '王顾问',
    },
    {
      id: uid(),
      infantName: '王一一',
      batchNo: 'WT-2026-004',
      gender: 'female',
      birthDate: '2025-01-05',
      parentName: '王大力',
      phone: '13600136004',
      status: 'invalid',
      parentVisibleContent: '',
      internalNotes: '疑似重复录入，与 WT-2026-001 家长信息重合。',
      originalPromise: '',
      isBadData: true,
      badDataReason: '该记录为重复录入，已做无效处理，不纳入统计。',
      createdAt: daysAgo(4),
      updatedAt: daysAgo(4),
      createdBy: '李顾问',
      lastUpdatedBy: '园长',
    },
    {
      id: uid(),
      infantName: '赵明辉',
      batchNo: 'WT-2026-005',
      gender: 'male',
      birthDate: '2024-06-18',
      parentName: '赵刚',
      phone: '13500135005',
      status: 'pending',
      parentVisibleContent: '等待安排试听。',
      internalNotes: '系统中无处理人记录。',
      originalPromise: '承诺本周内联系安排。',
      isBadData: false,
      noHandlerReason: '原负责顾问请假，尚未重新分配处理人，记录暂挂。',
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
      createdBy: '系统自动',
    },
  ];

  const histories: HistoryVersion[] = [
    {
      id: uid(),
      recordId: records[1].id,
      fieldName: 'internalNotes',
      fieldLabel: '内部备注',
      oldValue: '待家长确认时间。',
      newValue: '家长临时改口说周末可能有冲突，等明天回话。原始承诺是安排本周三下午。',
      operator: '李顾问',
      changedAt: daysAgo(1),
      changeReason: '家长临时改口，补录备注。',
    },
    {
      id: uid(),
      recordId: records[0].id,
      fieldName: 'status',
      fieldLabel: '状态',
      oldValue: 'pending',
      newValue: 'reviewed',
      operator: '王顾问',
      changedAt: daysAgo(2),
      changeReason: '信息核对无误，确认复核。',
    },
    {
      id: uid(),
      recordId: records[2].id,
      fieldName: 'status',
      fieldLabel: '状态',
      oldValue: 'reviewed',
      newValue: 'closed',
      operator: '李顾问',
      changedAt: daysAgo(6),
      changeReason: '家长暂不考虑，关闭记录。',
    },
  ];

  const audits: AuditLog[] = [
    {
      id: uid(),
      recordId: records[0].id,
      action: 'create',
      operator: '李顾问',
      operatorRole: 'consultant',
      summary: '新增婴幼儿记录：张小宝（WT-2026-001）',
      createdAt: daysAgo(5),
    },
    {
      id: uid(),
      recordId: records[0].id,
      action: 'review',
      operator: '王顾问',
      operatorRole: 'consultant',
      summary: '复核记录 WT-2026-001，状态从待复核变更为已复核',
      createdAt: daysAgo(2),
    },
    {
      id: uid(),
      recordId: records[1].id,
      action: 'update',
      operator: '李顾问',
      operatorRole: 'consultant',
      summary: '修改记录 WT-2026-002 的内部备注（家长临时改口）',
      createdAt: daysAgo(1),
    },
    {
      id: uid(),
      recordId: records[2].id,
      action: 'append',
      operator: '王顾问',
      operatorRole: 'consultant',
      summary: '已关闭记录 WT-2026-003 追加材料：家长咨询亲子活动',
      createdAt: daysAgo(0),
    },
    {
      id: uid(),
      action: 'export',
      operator: '园长',
      operatorRole: 'principal',
      summary: '导出本月婴幼儿批次记录共 4 条',
      createdAt: daysAgo(0),
    },
    {
      id: uid(),
      recordId: records[3].id,
      action: 'update',
      operator: '园长',
      operatorRole: 'principal',
      summary: '将 WT-2026-004 标记为无效数据（重复录入）',
      createdAt: daysAgo(4),
    },
  ];

  return { records, histories, audits };
}
