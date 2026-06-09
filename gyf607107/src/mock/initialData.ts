import type { Alarm, User, OperationHistory, SupplementNote } from '@/types';

export const mockUsers: User[] = [
  {
    id: 'user-001',
    name: '周顾问',
    role: 'consultant',
    phone: '13812345678',
    canExportRaw: false,
  },
  {
    id: 'user-002',
    name: '张主管',
    role: 'supervisor',
    phone: '13987654321',
    canExportRaw: true,
  },
];

export const mockAlarms: Alarm[] = [
  {
    id: 'alarm-001',
    siteName: '内蒙古风电场A',
    bladeNo: 'BLADE-A-001',
    defectType: '叶片裂纹',
    severity: 'high',
    status: 'pending',
    conclusion: '',
    contactPhone: '13611112222',
    handler: '周顾问',
    createdAt: '2026-06-01 09:30:00',
    updatedAt: '2026-06-01 09:30:00',
    isManualSupplement: false,
  },
  {
    id: 'alarm-002',
    siteName: '内蒙古风电场A',
    bladeNo: 'BLADE-A-002',
    defectType: '表面腐蚀',
    severity: 'medium',
    status: 'completed',
    conclusion: '已安排维修团队处理，预计3天内完成',
    contactPhone: '13611113333',
    handler: '周顾问',
    createdAt: '2026-06-02 14:20:00',
    updatedAt: '2026-06-03 10:15:00',
    isManualSupplement: false,
  },
  {
    id: 'alarm-003',
    siteName: '新疆风电场B',
    bladeNo: 'BLADE-B-001',
    defectType: '前缘磨损',
    severity: 'low',
    status: 'reviewed',
    conclusion: '磨损程度较轻，列入下次例行检查',
    contactPhone: '13722223333',
    handler: '周顾问',
    createdAt: '2026-06-03 11:00:00',
    updatedAt: '2026-06-04 16:30:00',
    isManualSupplement: false,
  },
  {
    id: 'alarm-004',
    siteName: '甘肃风电场C',
    bladeNo: 'BLADE-C-001',
    defectType: '雷击损伤',
    severity: 'critical',
    status: 'withdrawn',
    conclusion: '需要立即停机检修',
    contactPhone: '13833334444',
    handler: '周顾问',
    createdAt: '2026-06-05 08:45:00',
    updatedAt: '2026-06-06 09:00:00',
    isManualSupplement: false,
  },
  {
    id: 'alarm-005',
    siteName: '河北风电场D',
    bladeNo: 'BLADE-D-001',
    defectType: '分层脱胶',
    severity: 'high',
    status: 'processing',
    conclusion: '正在评估维修方案',
    contactPhone: '13944445555',
    handler: '周顾问',
    createdAt: '2026-06-07 13:30:00',
    updatedAt: '2026-06-07 15:00:00',
    isManualSupplement: false,
  },
  {
    id: 'alarm-006',
    siteName: '新疆风电场B',
    bladeNo: 'BLADE-B-002',
    defectType: '叶片裂纹',
    severity: 'medium',
    status: 'pending',
    conclusion: '',
    contactPhone: '13722224444',
    handler: '周顾问',
    createdAt: '2026-06-08 10:00:00',
    updatedAt: '2026-06-08 10:00:00',
    isManualSupplement: false,
  },
  {
    id: 'alarm-007',
    siteName: '内蒙古风电场A',
    bladeNo: 'BLADE-A-003',
    defectType: '表面腐蚀',
    severity: 'low',
    status: 'completed',
    conclusion: '已完成防腐处理',
    contactPhone: '13611115555',
    handler: '周顾问',
    createdAt: '2026-06-08 11:30:00',
    updatedAt: '2026-06-09 08:30:00',
    isManualSupplement: false,
  },
];

export const mockHistory: OperationHistory[] = [
  {
    id: 'hist-001',
    alarmId: 'alarm-002',
    operator: '周顾问',
    action: 'submit',
    newRemark: '已安排维修团队处理，预计3天内完成',
    operatedAt: '2026-06-03 10:15:00',
  },
  {
    id: 'hist-002',
    alarmId: 'alarm-003',
    operator: '周顾问',
    action: 'submit',
    newRemark: '磨损程度较轻，列入下次例行检查',
    operatedAt: '2026-06-04 10:00:00',
  },
  {
    id: 'hist-003',
    alarmId: 'alarm-003',
    operator: '张主管',
    action: 'review',
    newRemark: '同意处理方案，注意跟踪下次检查结果',
    operatedAt: '2026-06-04 16:30:00',
  },
  {
    id: 'hist-004',
    alarmId: 'alarm-004',
    operator: '周顾问',
    action: 'submit',
    newRemark: '需要立即停机检修',
    operatedAt: '2026-06-05 16:00:00',
  },
  {
    id: 'hist-005',
    alarmId: 'alarm-004',
    operator: '张主管',
    action: 'withdraw',
    oldReason: '需要立即停机检修',
    newRemark: '建议先进行远程探伤确认损伤程度，再决定是否停机',
    operatedAt: '2026-06-06 09:00:00',
  },
  {
    id: 'hist-006',
    alarmId: 'alarm-005',
    operator: '周顾问',
    action: 'submit',
    newRemark: '正在评估维修方案',
    operatedAt: '2026-06-07 15:00:00',
  },
  {
    id: 'hist-007',
    alarmId: 'alarm-007',
    operator: '周顾问',
    action: 'submit',
    newRemark: '已完成防腐处理',
    operatedAt: '2026-06-09 08:30:00',
  },
];

export const mockSupplements: SupplementNote[] = [];

export const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const getCurrentTime = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};
