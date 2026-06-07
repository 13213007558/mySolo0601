import type { Baby, DailyCheckRecord, AuditLog, ImportResult, DirtyRowDetail } from './types';

export const mockBabies: Baby[] = [
  { id: 'b001', name: '张小明', className: '向日葵班', age: 3, guardian: '张伟', guardianPhone: '13800138001' },
  { id: 'b002', name: '李花花', className: '向日葵班', age: 2, guardian: '李娜', guardianPhone: '13800138002' },
  { id: 'b003', name: '王浩然', className: '向日葵班', age: 4, guardian: '王强', guardianPhone: '13800138003' },
  { id: 'b004', name: '刘依依', className: '小蜜蜂班', age: 3, guardian: '刘洋', guardianPhone: '13800138004' },
  { id: 'b005', name: '陈乐乐', className: '小蜜蜂班', age: 2, guardian: '陈静', guardianPhone: '13800138005' },
  { id: 'b006', name: '赵天宇', className: '小蜜蜂班', age: 4, guardian: '赵磊', guardianPhone: '13800138006' },
  { id: 'b007', name: '孙雨桐', className: '小蜜蜂班', age: 3, guardian: '孙芳', guardianPhone: '13800138007' },
  { id: 'b008', name: '周子轩', className: '蒲公英班', age: 4, guardian: '周涛', guardianPhone: '13800138008' },
  { id: 'b009', name: '吴梦琪', className: '蒲公英班', age: 2, guardian: '吴敏', guardianPhone: '13800138009' },
  { id: 'b010', name: '郑皓轩', className: '蒲公英班', age: 3, guardian: '郑凯', guardianPhone: '13800138010' },
  { id: 'b011', name: '冯紫涵', className: '蒲公英班', age: 4, guardian: '冯丽', guardianPhone: '13800138011' },
  { id: 'b012', name: '许梓涵', className: '向日葵班', age: 2, guardian: '许鹏', guardianPhone: '13800138012' },
  { id: 'b013', name: '何嘉怡', className: '小蜜蜂班', age: 3, guardian: '何军', guardianPhone: '13800138013' },
  { id: 'b014', name: '罗俊杰', className: '蒲公英班', age: 4, guardian: '罗明', guardianPhone: '13800138014' },
  { id: 'b015', name: '谢思琪', className: '向日葵班', age: 3, guardian: '谢华', guardianPhone: '13800138015' },
];

const genId = () => Math.random().toString(36).slice(2, 11);

const today = new Date();
const formatDate = (d: Date) => d.toISOString().split('T')[0];
const formatDateTime = (d: Date) => d.toISOString();

function makeTemp(babyId: string, dateStr: string, hour: number, minute: number, temp: number, note?: string) {
  const d = new Date(dateStr);
  d.setHours(hour, minute, 0, 0);
  return {
    id: genId(),
    babyId,
    temperature: temp,
    measureTime: formatDateTime(d),
    measurePerson: hour < 8 ? '夜班王老师' : '白班李老师',
    deviceId: 'TH-001',
    rawNote: note,
  };
}

const todayStr = formatDate(today);
const yesterdayStr = formatDate(new Date(today.getTime() - 86400000));
const twoDaysAgo = formatDate(new Date(today.getTime() - 2 * 86400000));

export const mockRecords: DailyCheckRecord[] = [
  {
    id: genId(), babyId: 'b001', date: todayStr,
    temperatures: [
      makeTemp('b001', todayStr, 6, 30, 36.5, '入园正常'),
      makeTemp('b001', todayStr, 9, 0, 36.7),
      makeTemp('b001', todayStr, 12, 0, 36.8),
    ],
    status: 'normal', initialReason: '体温正常，精神良好', leaveAttachments: [], reviewStatus: 'reviewed',
  },
  {
    id: genId(), babyId: 'b002', date: todayStr,
    temperatures: [makeTemp('b002', todayStr, 6, 45, 37.8, '早高峰快速记录，建议复测')],
    status: 'abnormal', initialReason: '体温偏高 37.8℃', leaveAttachments: [], reviewStatus: 'unreviewed',
  },
  {
    id: genId(), babyId: 'b003', date: todayStr,
    temperatures: [makeTemp('b003', todayStr, 7, 0, 36.9)],
    status: 'leave', initialReason: '家长请假',
    leaveAttachments: [{
      id: genId(), babyId: 'b003', date: todayStr,
      imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handwritten%20leave%20note%20for%20child%20sickness%20from%20parent%20with%20date%20and%20signature&image_size=portrait_4_3',
      uploadedBy: '保健老师张', uploadedAt: formatDateTime(new Date()),
    }],
    reviewStatus: 'reviewed',
  },
  {
    id: genId(), babyId: 'b004', date: todayStr,
    temperatures: [makeTemp('b004', todayStr, 7, 10, 37.2, '备注简略，待确认')],
    status: 'pending', initialReason: '临界体温，需复核', leaveAttachments: [], reviewStatus: 'unreviewed',
  },
  {
    id: genId(), babyId: 'b005', date: todayStr,
    temperatures: [
      makeTemp('b005', todayStr, 6, 50, 36.6),
      makeTemp('b005', todayStr, 9, 30, 36.4),
    ],
    status: 'normal', initialReason: '正常', leaveAttachments: [], reviewStatus: 'reviewed',
  },
  {
    id: genId(), babyId: 'b006', date: todayStr,
    temperatures: [makeTemp('b006', todayStr, 7, 20, 38.1, '夜班记录发烧，家长未接')],
    status: 'abnormal', initialReason: '高烧 38.1℃，已通知家长', leaveAttachments: [], reviewStatus: 'unreviewed',
  },
  {
    id: genId(), babyId: 'b007', date: todayStr,
    temperatures: [makeTemp('b007', todayStr, 7, 0, 36.8)],
    status: 'normal', initialReason: '正常', leaveAttachments: [], reviewStatus: 'reviewed',
  },
  {
    id: genId(), babyId: 'b008', date: todayStr,
    temperatures: [makeTemp('b008', todayStr, 7, 5, 37.0, '备注"咳嗽"')],
    status: 'pending', initialReason: '有咳嗽症状，待保健老师复核', leaveAttachments: [], reviewStatus: 'unreviewed',
  },
  {
    id: genId(), babyId: 'b009', date: todayStr,
    temperatures: [makeTemp('b009', todayStr, 6, 55, 36.7)],
    status: 'normal', initialReason: '正常', leaveAttachments: [], reviewStatus: 'reviewed',
  },
  {
    id: genId(), babyId: 'b010', date: todayStr,
    temperatures: [
      makeTemp('b010', todayStr, 7, 0, 37.5),
      makeTemp('b010', todayStr, 7, 30, 37.3, '复测'),
    ],
    status: 'abnormal', initialReason: '两次测量均偏高', leaveAttachments: [], reviewStatus: 'unreviewed',
  },
  {
    id: genId(), babyId: 'b011', date: todayStr,
    temperatures: [makeTemp('b011', todayStr, 6, 40, 36.5)],
    status: 'normal', initialReason: '正常', leaveAttachments: [], reviewStatus: 'reviewed',
  },
  {
    id: genId(), babyId: 'b012', date: todayStr,
    temperatures: [makeTemp('b012', todayStr, 7, 15, 36.9)],
    status: 'normal', initialReason: '正常', leaveAttachments: [], reviewStatus: 'reviewed',
  },
  {
    id: genId(), babyId: 'b013', date: todayStr,
    temperatures: [makeTemp('b013', todayStr, 7, 0, 37.1)],
    status: 'pending', initialReason: '夜班仅记录体温，无备注', leaveAttachments: [], reviewStatus: 'unreviewed',
  },
  {
    id: genId(), babyId: 'b014', date: todayStr,
    temperatures: [makeTemp('b014', todayStr, 6, 50, 36.6)],
    status: 'normal', initialReason: '正常', leaveAttachments: [], reviewStatus: 'reviewed',
  },
  {
    id: genId(), babyId: 'b015', date: todayStr,
    temperatures: [makeTemp('b015', todayStr, 7, 10, 36.8)],
    status: 'normal', initialReason: '正常', leaveAttachments: [], reviewStatus: 'reviewed',
  },
  {
    id: genId(), babyId: 'b001', date: yesterdayStr,
    temperatures: [makeTemp('b001', yesterdayStr, 7, 0, 37.6)],
    status: 'normal', initialReason: '家长带来医院证明，确认无事', leaveAttachments: [], reviewStatus: 'reviewed',
    auditLogs: [{
      id: genId(), recordId: '', babyId: 'b001',
      operatorId: 'op001', operatorName: '保健老师张',
      oldStatus: 'abnormal', newStatus: 'normal',
      oldReason: '体温偏高 37.6℃', newReason: '家长带来医院证明，喉咙正常，确认无事',
      operatedAt: formatDateTime(new Date(yesterdayStr + 'T09:30:00')),
      reviewedBy: '主管王主任', reviewedAt: formatDateTime(new Date(yesterdayStr + 'T14:00:00')),
    }],
  },
  {
    id: genId(), babyId: 'b004', date: yesterdayStr,
    temperatures: [makeTemp('b004', yesterdayStr, 7, 10, 37.0)],
    status: 'leave', initialReason: '下午请假，看牙医',
    leaveAttachments: [{
      id: genId(), babyId: 'b004', date: yesterdayStr,
      imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=dental%20clinic%20appointment%20note%20for%20child%20on%20printed%20paper&image_size=portrait_4_3',
      uploadedBy: '保健老师张', uploadedAt: formatDateTime(new Date(yesterdayStr + 'T11:00:00')),
    }],
    reviewStatus: 'reviewed',
    auditLogs: [{
      id: genId(), recordId: '', babyId: 'b004',
      operatorId: 'op001', operatorName: '保健老师张',
      oldStatus: 'pending', newStatus: 'leave',
      oldReason: '体温正常，但备注不完整', newReason: '家长中午补交病假条，下午看牙医',
      operatedAt: formatDateTime(new Date(yesterdayStr + 'T11:30:00')),
      reviewedBy: '主管王主任', reviewedAt: formatDateTime(new Date(yesterdayStr + 'T15:00:00')),
    }],
  },
  {
    id: genId(), babyId: 'b002', date: yesterdayStr,
    temperatures: [makeTemp('b002', yesterdayStr, 7, 0, 36.6)],
    status: 'normal', initialReason: '正常', leaveAttachments: [], reviewStatus: 'reviewed',
  },
  {
    id: genId(), babyId: 'b006', date: yesterdayStr,
    temperatures: [makeTemp('b006', yesterdayStr, 7, 0, 36.8)],
    status: 'normal', initialReason: '正常', leaveAttachments: [], reviewStatus: 'reviewed',
  },
  {
    id: genId(), babyId: 'b003', date: twoDaysAgo,
    temperatures: [makeTemp('b003', twoDaysAgo, 7, 0, 36.7)],
    status: 'normal', initialReason: '正常', leaveAttachments: [], reviewStatus: 'reviewed',
  },
  {
    id: genId(), babyId: 'b005', date: twoDaysAgo,
    temperatures: [makeTemp('b005', twoDaysAgo, 7, 0, 36.5)],
    status: 'normal', initialReason: '正常', leaveAttachments: [], reviewStatus: 'reviewed',
  },
];

export const mockAuditLogs: AuditLog[] = [
  {
    id: 'audit001', recordId: 'rec_hist_001', babyId: 'b001',
    operatorId: 'op001', operatorName: '保健老师张',
    oldStatus: 'abnormal', newStatus: 'normal',
    oldReason: '体温偏高 37.6℃', newReason: '家长带来医院证明，喉咙正常，确认无事',
    operatedAt: formatDateTime(new Date(yesterdayStr + 'T09:30:00')),
    reviewedBy: '主管王主任', reviewedAt: formatDateTime(new Date(yesterdayStr + 'T14:00:00')),
  },
  {
    id: 'audit002', recordId: 'rec_hist_002', babyId: 'b004',
    operatorId: 'op001', operatorName: '保健老师张',
    oldStatus: 'pending', newStatus: 'leave',
    oldReason: '体温正常，但备注不完整', newReason: '家长中午补交病假条，下午看牙医',
    operatedAt: formatDateTime(new Date(yesterdayStr + 'T11:30:00')),
    reviewedBy: '主管王主任', reviewedAt: formatDateTime(new Date(yesterdayStr + 'T15:00:00')),
  },
];

export function generateDirtyImportSample(): ImportResult {
  const dirtyRowDetails: DirtyRowDetail[] = [
    { rowNumber: 2, rowData: {}, errorType: 'empty', errorMessage: '所有字段为空' },
    { rowNumber: 3, rowData: {}, errorType: 'empty', errorMessage: '仅有逗号分隔符，无有效数据' },
    { rowNumber: 5, rowData: { name: '张小明', temperature: '37.x', className: '向日葵班' }, errorType: 'invalid_temperature', errorMessage: '体温值 "37.x" 不是有效数字' },
    { rowNumber: 6, rowData: { name: '李花花', temperature: '正常', className: '向日葵班' }, errorType: 'invalid_temperature', errorMessage: '体温值 "正常" 不是有效数字，应填写具体数值' },
    { rowNumber: 7, rowData: { name: '测试宝宝', temperature: '36.5', className: '未知班' }, errorType: 'missing_baby', errorMessage: '宝宝姓名 "测试宝宝" 在系统中未找到对应记录' },
  ];

  const goodRecords: DailyCheckRecord[] = mockRecords.filter(r => r.date === todayStr).slice(0, 5);

  return {
    totalRows: 11,
    successRows: 5,
    dirtyRows: 5,
    emptyRows: 2,
    partialSuccess: true,
    dirtyRowDetails,
    importedRecords: goodRecords,
  };
}

export function generateEmptyImportSample(): ImportResult {
  return {
    totalRows: 3,
    successRows: 0,
    dirtyRows: 0,
    emptyRows: 3,
    partialSuccess: false,
    dirtyRowDetails: [
      { rowNumber: 1, rowData: {}, errorType: 'empty', errorMessage: '仅有表头，无数据行' },
      { rowNumber: 2, rowData: {}, errorType: 'empty', errorMessage: '空行' },
      { rowNumber: 3, rowData: {}, errorType: 'empty', errorMessage: '空行' },
    ],
    importedRecords: [],
  };
}
