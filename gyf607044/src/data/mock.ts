import type { FreezerSlot, RescheduleRecord } from '@/types';
import { getNextNDays, nowIso, uid } from '@/utils/helpers';

const hoursFromNow = (h: number) => {
  const d = new Date();
  d.setHours(d.getHours() + h);
  return d.toISOString();
};

const hoursAgo = (h: number) => {
  const d = new Date();
  d.setHours(d.getHours() - h);
  return d.toISOString();
};

export function buildMockRecords(): RescheduleRecord[] {
  const base: RescheduleRecord[] = [
    {
      id: uid('rec_'),
      babyName: '小米粒',
      courseName: '婴幼儿抚触课',
      originalTime: hoursFromNow(24),
      expectedTime: hoursFromNow(72),
      reason: '宝宝有点腹泻，医生建议休息几天',
      sourceFile: '抚触课排期表-6月.xlsx',
      submitter: '王妈妈',
      handler: '李护士',
      currentStatus: 'processing',
      latestNote: '已协调周四下午档期，待家长确认',
      createdAt: hoursAgo(8),
      updatedAt: hoursAgo(3),
      isCorrupted: false,
      sourceType: 'parent_submit',
      statusLogs: [
        {
          id: uid('sl_'),
          recordId: '',
          fromStatus: 'pending',
          toStatus: 'processing',
          operator: '李护士',
          reason: '接收处理，开始协调档期',
          createdAt: hoursAgo(5),
          isRollback: false,
        },
      ],
      photos: [],
      rectifications: [],
      corruptionLogs: [],
    },
    {
      id: uid('rec_'),
      babyName: '小汤圆',
      courseName: '亲子游泳启蒙',
      originalTime: hoursFromNow(5),
      expectedTime: hoursFromNow(48),
      reason: '今天宝宝精神不好，改到后天',
      sourceFile: '游泳课6月排期.xlsx',
      submitter: '张妈妈',
      handler: '陈教练',
      currentStatus: 'completed',
      latestNote: '已改期至周六上午10点，家长确认',
      createdAt: hoursAgo(20),
      updatedAt: hoursAgo(10),
      isCorrupted: false,
      sourceType: 'parent_submit',
      statusLogs: [
        {
          id: uid('sl_'),
          recordId: '',
          fromStatus: 'pending',
          toStatus: 'processing',
          operator: '陈教练',
          reason: '已联系确认有空档',
          createdAt: hoursAgo(18),
          isRollback: false,
        },
        {
          id: uid('sl_'),
          recordId: '',
          fromStatus: 'processing',
          toStatus: 'completed',
          operator: '陈教练',
          reason: '家长确认改期成功',
          createdAt: hoursAgo(10),
          isRollback: false,
        },
      ],
      photos: [],
      rectifications: [],
      corruptionLogs: [],
    },
    {
      id: uid('rec_'),
      babyName: '小年糕',
      courseName: '感官启蒙课',
      originalTime: hoursFromNow(12),
      expectedTime: hoursFromNow(60),
      reason: '家中有事需要回趟老家',
      sourceFile: '启蒙课6月.xlsx',
      submitter: '刘妈妈',
      handler: undefined,
      currentStatus: 'pending',
      latestNote: undefined,
      createdAt: hoursAgo(1),
      updatedAt: hoursAgo(1),
      isCorrupted: false,
      sourceType: 'parent_submit',
      statusLogs: [],
      photos: [],
      rectifications: [],
      corruptionLogs: [],
    },
    {
      id: uid('rec_'),
      babyName: '小豆包',
      courseName: '辅食添加指导',
      originalTime: hoursFromNow(36),
      expectedTime: hoursFromNow(120),
      reason: '上周吃过一次有点过敏，等稳定一点再来',
      sourceFile: '辅食课6月.xlsx',
      submitter: '赵妈妈',
      handler: '周护士',
      currentStatus: 'rejected',
      latestNote: '辅食课两周内名额已满，建议下下月排期',
      createdAt: hoursAgo(40),
      updatedAt: hoursAgo(25),
      isCorrupted: false,
      sourceType: 'parent_submit',
      statusLogs: [
        {
          id: uid('sl_'),
          recordId: '',
          fromStatus: 'pending',
          toStatus: 'rejected',
          operator: '周护士',
          reason: '近两周辅食课全部排满',
          createdAt: hoursAgo(25),
          isRollback: false,
        },
      ],
      photos: [],
      rectifications: [
        {
          id: uid('rc_'),
          recordId: '',
          problem: '家长未提前了解档期紧张情况',
          measure: '下次改期前先在冷冻柜名额看板确认剩余名额',
          operator: '周护士',
          reviewer: '护理主管王',
          createdAt: hoursAgo(22),
          reviewedAt: hoursAgo(20),
        },
      ],
      corruptionLogs: [],
    },
    {
      id: uid('rec_'),
      babyName: '小花生',
      courseName: '早教音乐课',
      originalTime: hoursFromNow(48),
      expectedTime: hoursFromNow(96),
      reason: '与疫苗接种时间冲突',
      sourceFile: '音乐课6月排期.xlsx',
      submitter: '孙妈妈',
      handler: '林老师',
      currentStatus: 'completed',
      latestNote: '已改期，家长确认无异议',
      createdAt: hoursAgo(50),
      updatedAt: hoursAgo(30),
      isCorrupted: false,
      sourceType: 'parent_submit',
      statusLogs: [],
      photos: [],
      rectifications: [],
      corruptionLogs: [],
    },
    {
      id: uid('rec_'),
      babyName: '小贝壳',
      courseName: '婴幼儿抚触课',
      originalTime: hoursFromNow(100),
      expectedTime: hoursFromNow(150),
      reason: '手工补录 - 家长电话告知需改期，之前未录入系统',
      sourceFile: '电话记录-6月8日.txt',
      submitter: '护理主管王（手工补录）',
      handler: '李护士',
      currentStatus: 'processing',
      latestNote: '补录记录，已电话二次确认改期时间',
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(2),
      isCorrupted: false,
      sourceType: 'manual_entry',
      statusLogs: [
        {
          id: uid('sl_'),
          recordId: '',
          fromStatus: 'pending',
          toStatus: 'processing',
          operator: '护理主管王',
          reason: '手工补录，备注：家长6月7日晚电话通知改期',
          createdAt: hoursAgo(2),
          isRollback: false,
        },
      ],
      photos: [],
      rectifications: [],
      corruptionLogs: [],
    },
    {
      id: uid('rec_'),
      babyName: '小南瓜',
      courseName: '亲子游泳启蒙',
      originalTime: hoursFromNow(6),
      expectedTime: hoursFromNow(30),
      reason: '临时有事改到后天',
      sourceFile: '游泳课6月排期.xlsx',
      submitter: '吴妈妈',
      handler: undefined,
      currentStatus: 'pending',
      latestNote: undefined,
      createdAt: hoursAgo(0.2),
      updatedAt: hoursAgo(0.2),
      isCorrupted: true,
      corruptionReason: '检测到重复提交（30秒内相同信息提交2次）',
      sourceType: 'parent_submit',
      statusLogs: [],
      photos: [],
      rectifications: [],
      corruptionLogs: [
        {
          id: uid('cl_'),
          recordId: '',
          type: 'duplicate_submit',
          reason: '30秒内检测到相同宝宝、课程、原上课时间的重复提交',
          detectedBy: 'system',
          createdAt: hoursAgo(0.2),
        },
      ],
    },
    {
      id: uid('rec_'),
      babyName: '小樱桃',
      courseName: '感官启蒙课',
      originalTime: hoursFromNow(30),
      expectedTime: hoursFromNow(80),
      reason: '宝宝有点湿疹，延后两周',
      sourceFile: '启蒙课6月.xlsx',
      submitter: '郑妈妈',
      handler: '林老师',
      currentStatus: 'pending',
      latestNote: '状态被回退，请主管复核',
      createdAt: hoursAgo(36),
      updatedAt: hoursAgo(6),
      isCorrupted: true,
      corruptionReason: '检测到状态回退：由completed回退至pending',
      sourceType: 'parent_submit',
      statusLogs: [
        {
          id: uid('sl_'),
          recordId: '',
          fromStatus: 'pending',
          toStatus: 'completed',
          operator: '林老师',
          reason: '改期完成',
          createdAt: hoursAgo(20),
          isRollback: false,
        },
        {
          id: uid('sl_'),
          recordId: '',
          fromStatus: 'completed',
          toStatus: 'pending',
          operator: '林老师',
          reason: '发现原档期仍未释放，需重新处理',
          createdAt: hoursAgo(6),
          isRollback: true,
        },
      ],
      photos: [],
      rectifications: [],
      corruptionLogs: [
        {
          id: uid('cl_'),
          recordId: '',
          type: 'status_rollback',
          reason: '林老师 将状态从「已完成」回退到「待处理」，已记录回退原因',
          detectedBy: 'system',
          createdAt: hoursAgo(6),
        },
      ],
    },
  ];

  base.forEach((r) => {
    r.statusLogs.forEach((l) => (l.recordId = r.id));
    r.rectifications.forEach((l) => (l.recordId = r.id));
    r.corruptionLogs.forEach((l) => (l.recordId = r.id));
    r.photos.forEach((p) => (p.recordId = r.id));
  });

  return base;
}

export function buildMockFreezerSlots(): FreezerSlot[] {
  const days = getNextNDays(14);
  const periods = ['morning', 'afternoon', 'evening'] as const;
  const slots: FreezerSlot[] = [];
  days.forEach((date, di) => {
    periods.forEach((period) => {
      const id = uid('fs_');
      let status: FreezerSlot['status'] = 'available';
      let occupiedBy: string | undefined;
      let occupantType: FreezerSlot['occupantType'];
      let markedAt: string | undefined;
      const r = Math.random();
      if (di < 3 && r < 0.35) {
        status = 'confirmed';
        occupiedBy = ['李宝宝', '王宝宝', '张宝宝', '赵宝宝'][Math.floor(Math.random() * 4)];
        occupantType = 'normal';
        markedAt = hoursAgo(20 + di * 3);
      } else if (di < 5 && r > 0.75) {
        status = 'verbal_hold';
        occupiedBy = ['刘妈妈口头', '陈妈妈口头', '周妈妈口头'][Math.floor(Math.random() * 3)];
        occupantType = 'shift_transfer';
        markedAt = hoursAgo(25 + di * 2);
      }
      slots.push({
        id,
        date,
        period,
        status,
        occupiedBy,
        occupantType,
        markedAt,
        logs:
          status !== 'available'
            ? [
                {
                  id: uid('fl_'),
                  slotId: id,
                  action: status === 'confirmed' ? 'confirm' : 'hold',
                  operator: '厨房管理员',
                  remark: occupiedBy,
                  createdAt: markedAt || nowIso(),
                },
              ]
            : [],
      });
    });
  });
  return slots;
}
