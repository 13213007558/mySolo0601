import type { Baby, TemperatureRecord, LeaveRecord, NoteHistoryItem, AuditLog } from '../shared/types';

const genId = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();

const leavePhotos = [
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=300&fit=crop',
];

const initialTemperatures: TemperatureRecord[] = [
  { id: genId(), babyId: '', temperature: 36.5, measureTime: '2026-06-08 08:15', deviceId: 'GUN-A001', operator: '李老师', source: 'gun' },
  { id: genId(), babyId: '', temperature: 36.8, measureTime: '2026-06-08 08:20', deviceId: 'GUN-A001', operator: '李老师', source: 'gun' },
  { id: genId(), babyId: '', temperature: 37.1, measureTime: '2026-06-08 08:25', deviceId: 'GUN-A002', operator: '王老师', source: 'gun' },
];

const initialLeaves: LeaveRecord[] = [
  { id: genId(), babyId: '', leaveDate: '2026-06-07', reason: '感冒发烧请假', photoUrl: leavePhotos[0], operator: '李老师', createdAt: now() },
];

const initialNotes: NoteHistoryItem[] = [
  { id: genId(), content: '家长承诺本周内完成保健复核材料提交', operator: '系统', createdAt: '2026-06-01 09:00', source: 'original' },
];

const sampleBabies: Baby[] = [
  {
    id: 'B001',
    name: '张小明',
    phone: '13812345678',
    phoneValid: true,
    room: '三楼婴儿房A',
    className: '向日葵班',
    checkStatus: 'confirmed',
    temperatures: [{ ...initialTemperatures[0], babyId: 'B001', id: genId() }, { ...initialTemperatures[1], babyId: 'B001', id: genId() }],
    leaves: [{ ...initialLeaves[0], babyId: 'B001', id: genId() }],
    notes: [{ ...initialNotes[0], id: genId() }],
    isManual: false,
    createdAt: '2026-06-01 08:00',
    updatedAt: '2026-06-08 08:30',
  },
  {
    id: 'B002',
    name: '李雨桐',
    phone: '139 8765 4321',
    phoneValid: false,
    room: '三楼婴儿房A',
    className: '向日葵班',
    checkStatus: 'pending',
    temperatures: [{ ...initialTemperatures[2], babyId: 'B002', id: genId() }],
    leaves: [],
    notes: [],
    isManual: false,
    createdAt: '2026-06-01 08:05',
    updatedAt: '2026-06-08 08:35',
  },
  {
    id: 'B003',
    name: '王梓涵',
    phone: '021-12345678',
    phoneValid: false,
    room: '三楼婴儿房B',
    className: '小海豚班',
    checkStatus: 'reviewed',
    temperatures: [],
    leaves: [],
    notes: [
      { id: genId(), content: '保健卡将于6月10日前补交', operator: '系统', createdAt: '2026-06-02 10:00', source: 'original' },
      { id: genId(), content: '【顾问补录】家长临时改口：保健卡遗失需重新办理，预计6月15日完成', operator: '赵顾问', createdAt: '2026-06-08 09:15', source: 'advisor' },
    ],
    isManual: true,
    createdAt: '2026-06-08 09:10',
    updatedAt: '2026-06-08 09:15',
  },
  {
    id: 'B004',
    name: '陈思远',
    phone: '',
    phoneValid: false,
    room: '三楼婴儿房B',
    className: '小海豚班',
    checkStatus: 'pending',
    temperatures: [],
    leaves: [],
    notes: [],
    isManual: false,
    createdAt: '2026-06-01 08:10',
    updatedAt: '2026-06-01 08:10',
  },
  {
    id: 'B005',
    name: '刘思琪',
    phone: '13566778899',
    phoneValid: true,
    room: '三楼婴儿房A',
    className: '向日葵班',
    checkStatus: 'reviewed',
    temperatures: [
      { id: genId(), babyId: 'B005', temperature: 36.6, measureTime: '2026-06-08 08:10', deviceId: 'GUN-A003', operator: '张老师', source: 'gun' },
    ],
    leaves: [
      { id: genId(), babyId: 'B005', leaveDate: '2026-06-05', reason: '家中有事请假一天', photoUrl: leavePhotos[1], operator: '张老师', createdAt: '2026-06-05 07:50' },
    ],
    notes: [
      { id: genId(), content: '家长已确认保健材料齐全', operator: '系统', createdAt: '2026-06-03 14:00', source: 'original' },
    ],
    isManual: false,
    createdAt: '2026-06-01 08:15',
    updatedAt: '2026-06-08 08:15',
  },
];

const sampleAudits: AuditLog[] = [
  {
    id: genId(),
    action: 'export',
    targetType: 'baby',
    targetId: 'all',
    operator: '孙主管',
    timestamp: '2026-06-08 07:30',
    privacyLeak: true,
    reason: '导出包含手机号字段，已标记审计',
  },
  {
    id: genId(),
    action: 'view',
    targetType: 'baby',
    targetId: 'B001',
    operator: '赵顾问',
    timestamp: '2026-06-08 08:45',
  },
  {
    id: genId(),
    action: 'create',
    targetType: 'baby',
    targetId: 'B003',
    operator: '赵顾问',
    timestamp: '2026-06-08 09:10',
    reason: '手工补录王梓涵信息',
  },
  {
    id: genId(),
    action: 'edit',
    targetType: 'note',
    targetId: 'B003',
    fieldName: 'notes',
    oldValue: '保健卡将于6月10日前补交',
    newValue: '【顾问补录】家长临时改口：保健卡遗失需重新办理，预计6月15日完成',
    operator: '赵顾问',
    timestamp: '2026-06-08 09:15',
  },
];

class DataStore {
  babies: Baby[] = [...sampleBabies];
  audits: AuditLog[] = [...sampleAudits];

  getAllBabies(): Baby[] {
    return this.babies;
  }

  getBabyById(id: string): Baby | undefined {
    return this.babies.find(b => b.id === id);
  }

  addBaby(baby: Omit<Baby, 'id' | 'createdAt' | 'updatedAt'>): Baby {
    const newBaby: Baby = {
      ...baby,
      id: 'B' + String(this.babies.length + 1).padStart(3, '0'),
      createdAt: now(),
      updatedAt: now(),
    };
    this.babies.push(newBaby);
    this.addAudit({
      action: 'create',
      targetType: 'baby',
      targetId: newBaby.id,
      operator: '赵顾问',
      privacyLeak: baby.phoneValid,
      reason: baby.isManual ? `手工补录${baby.name}信息` : `导入新增${baby.name}`,
    });
    return newBaby;
  }

  addNoteToBaby(babyId: string, content: string, operator: string): NoteHistoryItem | null {
    const baby = this.babies.find(b => b.id === babyId);
    if (!baby) return null;
    const note: NoteHistoryItem = {
      id: genId(),
      content,
      operator,
      createdAt: now(),
      source: 'advisor',
    };
    const oldLatest = baby.notes.length > 0 ? baby.notes[baby.notes.length - 1].content : '(空)';
    baby.notes.push(note);
    baby.updatedAt = now();
    this.addAudit({
      action: 'edit',
      targetType: 'note',
      targetId: babyId,
      fieldName: 'notes',
      oldValue: oldLatest,
      newValue: content,
      operator,
    });
    return note;
  }

  addAudit(audit: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const newAudit: AuditLog = {
      ...audit,
      id: genId(),
      timestamp: now(),
    };
    this.audits.unshift(newAudit);
    return newAudit;
  }

  getAudits(): AuditLog[] {
    return this.audits;
  }

  importFromRows(rows: { name: string; phone: string; room: string; className: string }[]): {
    total: number; success: number; failed: number;
    items: { row: number; name: string; phone: string; success: boolean; reason?: string }[];
  } {
    const results: { row: number; name: string; phone: string; success: boolean; reason?: string }[] = [];
    let successCount = 0;
    const phoneRegex = /^1[3-9]\d{9}$/;

    rows.forEach((r, idx) => {
      const cleanPhone = r.phone.replace(/[\s\-]/g, '');
      const isValid = phoneRegex.test(cleanPhone);

      if (!r.name.trim()) {
        results.push({ row: idx + 1, name: r.name, phone: r.phone, success: false, reason: '姓名为空' });
        return;
      }

      this.addBaby({
        name: r.name.trim(),
        phone: r.phone,
        phoneValid: isValid,
        room: r.room || '三楼婴儿房A',
        className: r.className || '向日葵班',
        checkStatus: 'pending',
        temperatures: [],
        leaves: [],
        notes: [],
        isManual: false,
      });
      successCount++;
      results.push({
        row: idx + 1,
        name: r.name,
        phone: r.phone,
        success: true,
        reason: isValid ? undefined : '手机号格式不规范，已部分导入',
      });
    });

    this.addAudit({
      action: 'import',
      targetType: 'baby',
      targetId: 'batch',
      operator: '赵顾问',
      reason: `批量导入 ${rows.length} 条，成功 ${successCount}，失败 ${rows.length - successCount}`,
    });

    return {
      total: rows.length,
      success: successCount,
      failed: rows.length - successCount,
      items: results,
    };
  }

  logExport(operator: string): void {
    this.addAudit({
      action: 'export',
      targetType: 'baby',
      targetId: 'all',
      operator,
      privacyLeak: true,
      reason: '导出操作含隐私字段（手机号），已留痕审计',
    });
  }
}

export const store = new DataStore();
