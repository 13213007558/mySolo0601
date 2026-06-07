import type { Schedule, AuditLogEntry, NoteEntry } from '../../shared/types';

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

const mkAudit = (
  id: string,
  action: AuditLogEntry['action'],
  operator: string,
  targetId: string,
  targetType: AuditLogEntry['targetType'],
  details: string,
  oldValue?: string,
  newValue?: string,
  ts?: Date
): AuditLogEntry => ({
  id,
  timestamp: iso(ts ?? hoursAgo(Math.random() * 48)),
  action,
  operator,
  targetId,
  targetType,
  details,
  oldValue,
  newValue,
});

const mkNote = (
  id: string,
  author: string,
  content: string,
  isRevision: boolean,
  originalPromise?: string,
  ts?: Date
): NoteEntry => ({
  id,
  timestamp: iso(ts ?? hoursAgo(Math.random() * 24)),
  author,
  content,
  isRevision,
  originalPromise,
});

export const sampleSchedules: Schedule[] = [
  {
    id: 'SCH-001',
    childId: 'C-001',
    childName: '张沐阳',
    childNickname: '果果',
    trialCourseName: '蒙氏感官启蒙试听课',
    scheduledDate: '2026-06-10',
    scheduledTime: '09:30',
    pickUpTime: '09:00',
    dropOffTime: '11:30',
    consultant: '李顾问（Linda）',
    authorizedPersons: [
      {
        id: 'AP-001-1',
        name: '张敏',
        relation: '母亲',
        phone: '138****5678',
        idCard: '310***********1234',
        photoStatus: 'present',
      },
      {
        id: 'AP-001-2',
        name: '王桂兰',
        relation: '外婆',
        phone: '139****8765',
        idCard: '310***********5678',
        photoStatus: 'missing',
      },
    ],
    status: 'confirmed',
    identityStatus: 'verified',
    materialStatus: 'partial',
    photoStatus: 'missing',
    isPartialSuccess: true,
    partialSuccessReason: '外婆身份照片暂未上传，其余材料完整，允许部分授权',
    notes: [
      mkNote(
        'N-001-1',
        '李顾问（Linda）',
        '家长承诺 6/9 下班前补交外婆照片',
        false,
        undefined,
        daysAgo(2)
      ),
      mkNote(
        'N-001-2',
        '李顾问（Linda）',
        '家长临时改口：外婆不来了，改由舅舅接送，照片稍后补',
        true,
        '原承诺：6/9 下班前补交外婆照片',
        hoursAgo(5)
      ),
    ],
    auditLogs: [
      mkAudit('A-001-1', 'create', '系统', 'SCH-001', 'schedule', '创建排程 SCH-001', undefined, undefined, daysAgo(5)),
      mkAudit('A-001-2', 'status_change', '李顾问（Linda）', 'SCH-001', 'schedule', '状态由 scheduled 变更为 confirmed', 'scheduled', 'confirmed', daysAgo(3)),
      mkAudit('A-001-3', 'partial_success', '张主管', 'SCH-001', 'schedule', '照片缺失，执行部分成功流程', 'present', 'missing', daysAgo(2)),
      mkAudit('A-001-4', 'note_add', '李顾问（Linda）', 'SCH-001', 'schedule', '追加修订备注：家长临时改口改由舅舅接送', undefined, undefined, hoursAgo(5)),
    ],
  },
  {
    id: 'SCH-002',
    childId: 'C-002',
    childName: '刘思源',
    childNickname: '豆豆',
    trialCourseName: '奥尔夫音乐试听课',
    scheduledDate: '2026-06-10',
    scheduledTime: '10:00',
    pickUpTime: '09:30',
    dropOffTime: '11:00',
    consultant: '王顾问（Kevin）',
    authorizedPersons: [
      {
        id: 'AP-002-1',
        name: '刘芳',
        relation: '母亲',
        phone: '137****4321',
        idCard: '310***********4321',
        photoStatus: 'present',
      },
    ],
    status: 'completed',
    identityStatus: 'verified',
    materialStatus: 'complete',
    photoStatus: 'present',
    isPartialSuccess: false,
    notes: [
      mkNote('N-002-1', '王顾问（Kevin）', '家长表示孩子对乐器很感兴趣，后续考虑报正式班', false, undefined, daysAgo(1)),
    ],
    auditLogs: [
      mkAudit('A-002-1', 'create', '系统', 'SCH-002', 'schedule', '创建排程 SCH-002', undefined, undefined, daysAgo(7)),
      mkAudit('A-002-2', 'status_change', '王顾问（Kevin）', 'SCH-002', 'schedule', '状态由 confirmed 变更为 completed', 'confirmed', 'completed', hoursAgo(2)),
    ],
  },
  {
    id: 'SCH-003',
    childId: 'C-003',
    childName: '陈子墨',
    childNickname: '墨墨',
    trialCourseName: '创意美术试听课',
    scheduledDate: '2026-06-11',
    scheduledTime: '14:00',
    pickUpTime: '13:30',
    dropOffTime: '16:00',
    consultant: '赵顾问（Grace）',
    authorizedPersons: [
      {
        id: 'AP-003-1',
        name: '陈建国',
        relation: '父亲',
        phone: '136****9876',
        idCard: '310***********9876',
        photoStatus: 'present',
      },
    ],
    status: 'scheduled',
    identityStatus: 'pending',
    materialStatus: 'missing',
    photoStatus: 'present',
    isPartialSuccess: false,
    notes: [],
    auditLogs: [
      mkAudit('A-003-1', 'create', '系统', 'SCH-003', 'schedule', '创建排程 SCH-003', undefined, undefined, hoursAgo(20)),
    ],
  },
  {
    id: 'SCH-004',
    childId: 'C-004',
    childName: '林雨桐',
    childNickname: '桐桐',
    trialCourseName: '亲子游泳试听课',
    scheduledDate: '2026-06-09',
    scheduledTime: '15:30',
    pickUpTime: '15:00',
    dropOffTime: '17:00',
    consultant: '周顾问（Amy）',
    authorizedPersons: [
      {
        id: 'AP-004-1',
        name: '林雪',
        relation: '母亲',
        phone: '135****1111',
        idCard: '310***********1111',
        photoStatus: 'missing',
      },
    ],
    status: 'failed',
    identityStatus: 'verified',
    materialStatus: 'partial',
    photoStatus: 'missing',
    isPartialSuccess: false,
    failureReason: '授权接送人照片缺失且家长未按时补交，按流程判定失败',
    notes: [
      mkNote('N-004-1', '周顾问（Amy）', '已电话联系家长，无人接听；发微信未回', false, undefined, hoursAgo(8)),
    ],
    auditLogs: [
      mkAudit('A-004-1', 'create', '系统', 'SCH-004', 'schedule', '创建排程 SCH-004', undefined, undefined, daysAgo(4)),
      mkAudit('A-004-2', 'photo_missing', '系统', 'SCH-004', 'schedule', '检测到授权接送人照片缺失，触发预警', undefined, undefined, hoursAgo(12)),
      mkAudit('A-004-3', 'status_change', '张主管', 'SCH-004', 'schedule', '状态由 confirmed 变更为 failed', 'confirmed', 'failed', hoursAgo(6)),
    ],
  },
  {
    id: 'SCH-005',
    childId: 'C-005',
    childName: '王浩宇',
    childNickname: '浩浩',
    trialCourseName: '乐高积木试听课',
    scheduledDate: '2026-06-08',
    scheduledTime: '10:30',
    pickUpTime: '10:00',
    dropOffTime: '12:00',
    consultant: '孙顾问（Mike）',
    authorizedPersons: [
      {
        id: 'AP-005-1',
        name: '王强',
        relation: '父亲',
        phone: '134****2222',
        idCard: '310***********2222',
        photoStatus: 'rejected',
      },
    ],
    status: 'manually_corrected',
    identityStatus: 'verified',
    materialStatus: 'partial',
    photoStatus: 'rejected',
    isPartialSuccess: false,
    manualCorrection: {
      correctedBy: '张主管',
      correctedAt: iso(hoursAgo(3)),
      correctionNote:
        '系统误判照片不合格，人工复核确认照片清晰可用。原状态 failed，已更正为 in_progress，当日 14:00 重新安排试听。',
      originalStatus: 'failed',
    },
    notes: [
      mkNote('N-005-1', '孙顾问（Mike）', '系统自动将照片标记为不合格，家长投诉称照片清晰', false, undefined, hoursAgo(10)),
      mkNote(
        'N-005-2',
        '张主管',
        '人工复核通过，照片实为合格；已通知家长下午 14:00 到场',
        true,
        '原状态：系统判定照片不合格 → failed',
        hoursAgo(3)
      ),
    ],
    auditLogs: [
      mkAudit('A-005-1', 'create', '系统', 'SCH-005', 'schedule', '创建排程 SCH-005', undefined, undefined, daysAgo(3)),
      mkAudit('A-005-2', 'status_change', '系统', 'SCH-005', 'schedule', '状态自动变更为 failed（照片不合格）', 'confirmed', 'failed', hoursAgo(12)),
      mkAudit('A-005-3', 'manual_correction', '张主管', 'SCH-005', 'schedule', '人工更正：照片复核合格，状态由 failed 更正为 manually_corrected', 'failed', 'manually_corrected', hoursAgo(3)),
    ],
  },
  {
    id: 'SCH-006',
    childId: 'C-006',
    childName: '赵欣怡',
    childNickname: '欣欣',
    trialCourseName: '绘本阅读试听课',
    scheduledDate: '2026-06-12',
    scheduledTime: '09:00',
    pickUpTime: '08:30',
    dropOffTime: '10:30',
    consultant: '钱顾问（Sophie）',
    authorizedPersons: [
      {
        id: 'AP-006-1',
        name: '赵丽',
        relation: '母亲',
        phone: '133****3333',
        idCard: '310***********3333',
        photoStatus: 'present',
      },
      {
        id: 'AP-006-2',
        name: '赵建国',
        relation: '外公',
        phone: '132****4444',
        idCard: '310***********4444',
        photoStatus: 'present',
      },
    ],
    status: 'confirmed',
    identityStatus: 'verified',
    materialStatus: 'complete',
    photoStatus: 'present',
    isPartialSuccess: false,
    notes: [],
    auditLogs: [
      mkAudit('A-006-1', 'create', '系统', 'SCH-006', 'schedule', '创建排程 SCH-006', undefined, undefined, hoursAgo(30)),
      mkAudit('A-006-2', 'status_change', '钱顾问（Sophie）', 'SCH-006', 'schedule', '状态由 scheduled 变更为 confirmed', 'scheduled', 'confirmed', hoursAgo(28)),
    ],
  },
];
