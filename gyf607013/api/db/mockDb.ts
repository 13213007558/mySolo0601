import type {
  User,
  Baby,
  ClassInfo,
  DisinfectionRecord,
  AuditLog,
  ScanRecord,
  FollowUpNote,
} from '../../src/types/index.js';

interface MockDatabase {
  users: User[];
  babies: Baby[];
  classes: ClassInfo[];
  disinfectionRecords: DisinfectionRecord[];
  auditLogs: AuditLog[];
  scanRecords: ScanRecord[];
  followUpNotes: FollowUpNote[];
}

const now = new Date();
const iso = (d: Date) => d.toISOString();
const daysAgo = (n: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  return d;
};
const hoursAgo = (n: number) => {
  const d = new Date(now);
  d.setHours(d.getHours() - n);
  return d;
};

const initialUsers: User[] = [
  { id: 'u1', name: '王主管', role: 'supervisor', phone: '13800000001' },
  { id: 'u2', name: '李护士', role: 'nurse', phone: '13800000002' },
  { id: 'u3', name: '张同事', role: 'staff', phone: '13800000003' },
];

const initialBabies: Baby[] = [
  {
    id: 'b1',
    name: '张小明',
    classId: 'c1',
    birthday: '2022-03-15',
    allergies: '花生、牛奶',
    guardianPhone: '13811112222',
    guardianName: '张伟',
  },
  {
    id: 'b2',
    name: '李小红',
    classId: 'c1',
    birthday: '2022-06-20',
    allergies: '鸡蛋',
    guardianPhone: '13822223333',
    guardianName: '李娜',
  },
  {
    id: 'b3',
    name: '王小宝',
    classId: 'c1',
    birthday: '2023-01-10',
    guardianPhone: '13833334444',
    guardianName: '王强',
  },
  {
    id: 'b4',
    name: '赵小甜',
    classId: 'c2',
    birthday: '2022-08-05',
    allergies: '海鲜',
    guardianPhone: '13844445555',
    guardianName: '赵敏',
  },
  {
    id: 'b5',
    name: '陈小乐',
    classId: 'c2',
    birthday: '2022-11-18',
    guardianPhone: '13855556666',
    guardianName: '陈刚',
  },
  {
    id: 'b6',
    name: '刘小豆',
    classId: 'c2',
    birthday: '2023-02-28',
    allergies: '芒果',
    guardianPhone: '13866667777',
    guardianName: '刘芳',
  },
  {
    id: 'b7',
    name: '孙小雨',
    classId: 'c3',
    birthday: '2022-04-12',
    guardianPhone: '13877778888',
    guardianName: '孙军',
  },
  {
    id: 'b8',
    name: '周小星',
    classId: 'c3',
    birthday: '2023-05-08',
    allergies: '尘螨',
    guardianPhone: '13888889999',
    guardianName: '周丽',
  },
];

const initialClasses: ClassInfo[] = [
  { id: 'c1', name: '太阳班', babyCount: 3, completionRate: 0.92, exceptionCount: 1 },
  { id: 'c2', name: '月亮班', babyCount: 3, completionRate: 0.88, exceptionCount: 2 },
  { id: 'c3', name: '星星班', babyCount: 2, completionRate: 0.95, exceptionCount: 0 },
];

const initialDisinfectionRecords: DisinfectionRecord[] = [
  {
    id: 'dr1',
    babyId: 'b1',
    classId: 'c1',
    itemName: '奶瓶A1',
    scheduledTime: iso(hoursAgo(8)),
    actualTime: iso(hoursAgo(7)),
    status: 'completed',
    temperature: 100,
    duration: 30,
    operatorId: 'u2',
    operatorName: '李护士',
    handlerId: 'u3',
    handlerName: '张同事',
    reviewedById: 'u1',
    reviewedByName: '王主管',
    reviewedAt: iso(hoursAgo(6)),
    source: 'scan',
    createdAt: iso(hoursAgo(8)),
    updatedAt: iso(hoursAgo(6)),
  },
  {
    id: 'dr2',
    babyId: 'b1',
    classId: 'c1',
    itemName: '餐具套装',
    scheduledTime: iso(hoursAgo(4)),
    actualTime: iso(hoursAgo(3)),
    status: 'completed',
    temperature: 95,
    duration: 30,
    operatorId: 'u2',
    operatorName: '李护士',
    handlerId: 'u3',
    handlerName: '张同事',
    source: 'scan',
    isBoundaryAudit: true,
    boundaryReason: '温度达到下限阈值95℃',
    createdAt: iso(hoursAgo(4)),
    updatedAt: iso(hoursAgo(3)),
  },
  {
    id: 'dr3',
    babyId: 'b2',
    classId: 'c1',
    itemName: '奶瓶B1',
    scheduledTime: iso(hoursAgo(6)),
    actualTime: iso(hoursAgo(5)),
    status: 'completed',
    temperature: 105,
    duration: 30,
    operatorId: 'u2',
    operatorName: '李护士',
    source: 'scan',
    isBoundaryAudit: true,
    boundaryReason: '温度达到上限阈值105℃',
    createdAt: iso(hoursAgo(6)),
    updatedAt: iso(hoursAgo(5)),
  },
  {
    id: 'dr4',
    babyId: 'b2',
    classId: 'c1',
    itemName: '毛巾',
    scheduledTime: iso(hoursAgo(2)),
    status: 'processing',
    temperature: 102,
    duration: 15,
    operatorId: 'u2',
    operatorName: '李护士',
    source: 'scan',
    createdAt: iso(hoursAgo(2)),
    updatedAt: iso(hoursAgo(2)),
  },
  {
    id: 'dr5',
    babyId: 'b3',
    classId: 'c1',
    itemName: '安抚奶嘴',
    scheduledTime: iso(hoursAgo(1)),
    status: 'pending',
    temperature: 0,
    duration: 0,
    source: 'scan',
    createdAt: iso(hoursAgo(1)),
    updatedAt: iso(hoursAgo(1)),
  },
  {
    id: 'dr6',
    babyId: 'b4',
    classId: 'c2',
    itemName: '奶瓶C1',
    scheduledTime: iso(daysAgo(1)),
    actualTime: iso(daysAgo(1)),
    status: 'completed',
    temperature: 108,
    duration: 30,
    operatorId: 'u2',
    operatorName: '李护士',
    handlerId: 'u3',
    handlerName: '张同事',
    reviewedById: 'u1',
    reviewedByName: '王主管',
    reviewedAt: iso(daysAgo(1)),
    exceptionNote: '温度超过上限阈值，需复核',
    source: 'scan',
    isBoundaryAudit: true,
    boundaryReason: '温度108℃超过上限阈值105℃',
    createdAt: iso(daysAgo(1)),
    updatedAt: iso(daysAgo(1)),
  },
  {
    id: 'dr7',
    babyId: 'b4',
    classId: 'c2',
    itemName: '水杯',
    scheduledTime: iso(hoursAgo(10)),
    actualTime: iso(hoursAgo(9)),
    status: 'completed',
    temperature: 92,
    duration: 30,
    operatorId: 'u2',
    operatorName: '李护士',
    exceptionNote: '温度低于下限阈值，重新消毒',
    source: 'manual',
    isBoundaryAudit: true,
    boundaryReason: '温度92℃低于下限阈值95℃（手工补录）',
    createdAt: iso(hoursAgo(10)),
    updatedAt: iso(hoursAgo(9)),
  },
  {
    id: 'dr8',
    babyId: 'b5',
    classId: 'c2',
    itemName: '餐具套装',
    scheduledTime: iso(hoursAgo(5)),
    actualTime: iso(hoursAgo(4)),
    status: 'exception',
    temperature: 88,
    duration: 30,
    operatorId: 'u2',
    operatorName: '李护士',
    handlerId: 'u1',
    handlerName: '王主管',
    exceptionNote: '设备故障，温度异常偏低',
    source: 'scan',
    isBoundaryAudit: true,
    boundaryReason: '温度88℃远低于阈值95℃',
    createdAt: iso(hoursAgo(5)),
    updatedAt: iso(hoursAgo(3)),
  },
  {
    id: 'dr9',
    babyId: 'b6',
    classId: 'c2',
    itemName: '奶瓶D1',
    scheduledTime: iso(hoursAgo(12)),
    actualTime: iso(hoursAgo(11)),
    status: 'completed',
    temperature: 100,
    duration: 30,
    operatorId: 'u2',
    operatorName: '李护士',
    source: 'manual',
    createdAt: iso(hoursAgo(12)),
    updatedAt: iso(hoursAgo(11)),
  },
  {
    id: 'dr10',
    babyId: 'b7',
    classId: 'c3',
    itemName: '奶瓶E1',
    scheduledTime: iso(hoursAgo(3)),
    actualTime: iso(hoursAgo(2)),
    status: 'completed',
    temperature: 101,
    duration: 30,
    operatorId: 'u2',
    operatorName: '李护士',
    source: 'scan',
    createdAt: iso(hoursAgo(3)),
    updatedAt: iso(hoursAgo(2)),
  },
  {
    id: 'dr11',
    babyId: 'b8',
    classId: 'c3',
    itemName: '毛巾',
    scheduledTime: iso(hoursAgo(1)),
    status: 'pending',
    temperature: 0,
    duration: 0,
    source: 'scan',
    createdAt: iso(hoursAgo(1)),
    updatedAt: iso(hoursAgo(1)),
  },
];

const initialAuditLogs: AuditLog[] = [
  {
    id: 'al1',
    recordId: 'dr2',
    fieldName: 'temperature',
    oldValue: null,
    newValue: 95,
    operatorId: 'u2',
    operatorName: '李护士',
    operatedAt: iso(hoursAgo(3)),
    isBoundaryAudit: true,
  },
  {
    id: 'al2',
    recordId: 'dr3',
    fieldName: 'temperature',
    oldValue: null,
    newValue: 105,
    operatorId: 'u2',
    operatorName: '李护士',
    operatedAt: iso(hoursAgo(5)),
    isBoundaryAudit: true,
  },
  {
    id: 'al3',
    recordId: 'dr6',
    fieldName: 'temperature',
    oldValue: null,
    newValue: 108,
    operatorId: 'u2',
    operatorName: '李护士',
    operatedAt: iso(daysAgo(1)),
    isBoundaryAudit: true,
  },
  {
    id: 'al4',
    recordId: 'dr7',
    fieldName: 'temperature',
    oldValue: null,
    newValue: 92,
    operatorId: 'u2',
    operatorName: '李护士',
    operatedAt: iso(hoursAgo(9)),
    isBoundaryAudit: true,
  },
  {
    id: 'al5',
    recordId: 'dr8',
    fieldName: 'status',
    oldValue: 'processing',
    newValue: 'exception',
    operatorId: 'u1',
    operatorName: '王主管',
    operatedAt: iso(hoursAgo(3)),
    isBoundaryAudit: false,
  },
  {
    id: 'al6',
    recordId: 'dr8',
    fieldName: 'exceptionNote',
    oldValue: null,
    newValue: '设备故障，温度异常偏低',
    operatorId: 'u1',
    operatorName: '王主管',
    operatedAt: iso(hoursAgo(3)),
    isBoundaryAudit: false,
  },
  {
    id: 'al7',
    recordId: 'dr9',
    fieldName: 'source',
    oldValue: 'scan',
    newValue: 'manual',
    operatorId: 'u1',
    operatorName: '王主管',
    operatedAt: iso(hoursAgo(11)),
    isBoundaryAudit: false,
  },
];

const initialScanRecords: ScanRecord[] = [
  {
    id: 'sr1',
    recordId: 'dr1',
    action: 'borrow',
    operatorId: 'u3',
    operatorName: '张同事',
    timestamp: iso(hoursAgo(8)),
    itemName: '奶瓶A1',
    status: 'success',
  },
  {
    id: 'sr2',
    recordId: 'dr1',
    action: 'process',
    operatorId: 'u2',
    operatorName: '李护士',
    timestamp: iso(hoursAgo(7)),
    itemName: '奶瓶A1',
    status: 'success',
    handlerName: '张同事',
  },
  {
    id: 'sr3',
    recordId: 'dr1',
    action: 'return',
    operatorId: 'u3',
    operatorName: '张同事',
    timestamp: iso(hoursAgo(6)),
    itemName: '奶瓶A1',
    status: 'success',
  },
  {
    id: 'sr4',
    recordId: 'dr2',
    action: 'borrow',
    operatorId: 'u3',
    operatorName: '张同事',
    timestamp: iso(hoursAgo(4)),
    itemName: '餐具套装',
    status: 'success',
  },
  {
    id: 'sr5',
    recordId: 'dr2',
    action: 'process',
    operatorId: 'u2',
    operatorName: '李护士',
    timestamp: iso(hoursAgo(3)),
    itemName: '餐具套装',
    status: 'warning',
    handlerName: '张同事',
  },
  {
    id: 'sr6',
    recordId: 'dr6',
    action: 'process',
    operatorId: 'u2',
    operatorName: '李护士',
    timestamp: iso(daysAgo(1)),
    itemName: '奶瓶C1',
    status: 'warning',
    handlerName: '张同事',
  },
  {
    id: 'sr7',
    recordId: 'dr8',
    action: 'process',
    operatorId: 'u2',
    operatorName: '李护士',
    timestamp: iso(hoursAgo(5)),
    itemName: '餐具套装',
    status: 'error',
    handlerName: '王主管',
  },
  {
    id: 'sr8',
    recordId: 'dr10',
    action: 'borrow',
    operatorId: 'u3',
    operatorName: '张同事',
    timestamp: iso(hoursAgo(3)),
    itemName: '奶瓶E1',
    status: 'success',
  },
];

const initialFollowUpNotes: FollowUpNote[] = [
  {
    id: 'fn1',
    babyId: 'b1',
    content: '过敏史记录已更新，家长确认花生和牛奶过敏。日常注意饮食隔离。',
    nextFollowUp: iso(daysAgo(-7)),
    createdById: 'u2',
    createdByName: '李护士',
    createdAt: iso(daysAgo(3)),
  },
  {
    id: 'fn2',
    babyId: 'b4',
    content: '海鲜过敏记录，已告知厨房避免相关食材。',
    nextFollowUp: iso(daysAgo(-14)),
    createdById: 'u2',
    createdByName: '李护士',
    createdAt: iso(daysAgo(5)),
  },
  {
    id: 'fn3',
    babyId: 'b8',
    content: '尘螨过敏，建议定期晾晒被褥，教室加强通风。',
    createdById: 'u2',
    createdByName: '李护士',
    createdAt: iso(daysAgo(2)),
  },
  {
    id: 'fn4',
    babyId: 'b6',
    content: '芒果过敏，家长已签署知情同意书。',
    createdById: 'u1',
    createdByName: '王主管',
    createdAt: iso(daysAgo(10)),
  },
];

class MockDb {
  private data: MockDatabase;

  constructor() {
    this.data = {
      users: JSON.parse(JSON.stringify(initialUsers)),
      babies: JSON.parse(JSON.stringify(initialBabies)),
      classes: JSON.parse(JSON.stringify(initialClasses)),
      disinfectionRecords: JSON.parse(JSON.stringify(initialDisinfectionRecords)),
      auditLogs: JSON.parse(JSON.stringify(initialAuditLogs)),
      scanRecords: JSON.parse(JSON.stringify(initialScanRecords)),
      followUpNotes: JSON.parse(JSON.stringify(initialFollowUpNotes)),
    };
  }

  getUsers(): User[] {
    return this.data.users;
  }

  findUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  findUserByName(name: string): User | undefined {
    return this.data.users.find((u) => u.name === name);
  }

  getBabies(): Baby[] {
    return this.data.babies;
  }

  findBabyById(id: string): Baby | undefined {
    return this.data.babies.find((b) => b.id === id);
  }

  getBabiesByClassId(classId: string): Baby[] {
    return this.data.babies.filter((b) => b.classId === classId);
  }

  getClasses(): ClassInfo[] {
    return this.data.classes;
  }

  findClassById(id: string): ClassInfo | undefined {
    return this.data.classes.find((c) => c.id === id);
  }

  getDisinfectionRecords(): DisinfectionRecord[] {
    return this.data.disinfectionRecords;
  }

  findDisinfectionRecordById(id: string): DisinfectionRecord | undefined {
    return this.data.disinfectionRecords.find((r) => r.id === id);
  }

  getDisinfectionRecordsByBabyId(babyId: string): DisinfectionRecord[] {
    return this.data.disinfectionRecords.filter((r) => r.babyId === babyId);
  }

  getDisinfectionRecordsByClassId(classId: string): DisinfectionRecord[] {
    return this.data.disinfectionRecords.filter((r) => r.classId === classId);
  }

  addDisinfectionRecord(record: Partial<DisinfectionRecord>): DisinfectionRecord {
    const id = record.id || `dr${Date.now()}`;
    const now = iso(new Date());
    const newRecord: DisinfectionRecord = {
      id,
      babyId: record.babyId || '',
      classId: record.classId || '',
      itemName: record.itemName || '',
      scheduledTime: record.scheduledTime || now,
      actualTime: record.actualTime,
      status: record.status || 'pending',
      temperature: record.temperature ?? 0,
      duration: record.duration ?? 0,
      operatorId: record.operatorId,
      operatorName: record.operatorName,
      handlerId: record.handlerId,
      handlerName: record.handlerName,
      reviewedById: record.reviewedById,
      reviewedByName: record.reviewedByName,
      reviewedAt: record.reviewedAt,
      exceptionNote: record.exceptionNote,
      source: record.source || 'manual',
      isBoundaryAudit: record.isBoundaryAudit,
      boundaryReason: record.boundaryReason,
      createdAt: record.createdAt || now,
      updatedAt: record.updatedAt || now,
    };
    this.data.disinfectionRecords.unshift(newRecord);
    return newRecord;
  }

  updateDisinfectionRecord(
    id: string,
    updates: Partial<DisinfectionRecord>,
  ): DisinfectionRecord | undefined {
    const idx = this.data.disinfectionRecords.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    this.data.disinfectionRecords[idx] = {
      ...this.data.disinfectionRecords[idx],
      ...updates,
      updatedAt: iso(new Date()),
    };
    return this.data.disinfectionRecords[idx];
  }

  getAuditLogs(): AuditLog[] {
    return this.data.auditLogs;
  }

  addAuditLog(log: Omit<AuditLog, 'id' | 'operatedAt'>): AuditLog {
    const newLog: AuditLog = {
      ...log,
      id: `al${Date.now()}${Math.random().toString(36).slice(2, 8)}`,
      operatedAt: iso(new Date()),
    };
    this.data.auditLogs.unshift(newLog);
    return newLog;
  }

  getAuditLogsByRecordId(recordId: string): AuditLog[] {
    return this.data.auditLogs.filter((l) => l.recordId === recordId);
  }

  getScanRecords(): ScanRecord[] {
    return this.data.scanRecords;
  }

  getScanRecordsByRecordId(recordId: string): ScanRecord[] {
    return this.data.scanRecords.filter((s) => s.recordId === recordId);
  }

  getFollowUpNotesByBabyId(babyId: string): FollowUpNote[] {
    return this.data.followUpNotes.filter((f) => f.babyId === babyId);
  }

  reset(): void {
    this.data = {
      users: JSON.parse(JSON.stringify(initialUsers)),
      babies: JSON.parse(JSON.stringify(initialBabies)),
      classes: JSON.parse(JSON.stringify(initialClasses)),
      disinfectionRecords: JSON.parse(JSON.stringify(initialDisinfectionRecords)),
      auditLogs: JSON.parse(JSON.stringify(initialAuditLogs)),
      scanRecords: JSON.parse(JSON.stringify(initialScanRecords)),
      followUpNotes: JSON.parse(JSON.stringify(initialFollowUpNotes)),
    };
  }
}

export const mockDb = new MockDb();
export default mockDb;
