import type {
  Baby,
  MorningReview,
  ThermometerRecord,
  LeaveRequest,
  AuditLog,
  ExportRow,
} from '../shared/types.js';

export const babies: Baby[] = [
  { id: 'b001', name: '李小鱼', className: '海豚2班', parentName: '李妈妈', parentPhone: '138****1234' },
  { id: 'b002', name: '王小花', className: '海豚2班', parentName: '王爸爸', parentPhone: '139****5678' },
  { id: 'b003', name: '张小豆', className: '海豚2班', parentName: '张妈妈', parentPhone: '137****9012' },
  { id: 'b004', name: '陈小果', className: '海豚2班', parentName: '陈妈妈', parentPhone: '136****3456' },
  { id: 'b005', name: '刘小米', className: '海豚2班', parentName: '刘爸爸', parentPhone: '135****7890' },
];

function mkAudit(
  id: string,
  reviewId: string,
  action: AuditLog['action'],
  operator: string,
  operatorRole: AuditLog['operatorRole'],
  note?: string,
): AuditLog {
  return {
    id,
    reviewId,
    action,
    operator,
    operatorRole,
    timestamp: new Date(Date.now() - Math.random() * 3600_000).toISOString(),
    note,
  };
}

function mkThermo(
  id: string,
  reviewId: string,
  temp: number,
  status: 'normal' | 'empty' | 'dirty',
  hasPhoto: boolean,
): ThermometerRecord {
  return {
    id,
    reviewId,
    temperature: temp,
    measuredAt: new Date(Date.now() - Math.random() * 1800_000).toISOString(),
    deviceId: 'TH-' + Math.floor(Math.random() * 100),
    photoUrl: hasPhoto ? `https://picsum.photos/seed/${id}/400/300` : undefined,
    status,
  };
}

function mkLeave(
  id: string,
  reviewId: string,
  reason: string,
  status: 'normal' | 'empty' | 'dirty',
  hasPhoto: boolean,
): LeaveRequest {
  return {
    id,
    reviewId,
    reason,
    submittedAt: new Date(Date.now() - Math.random() * 86400_000).toISOString(),
    photoUrl: hasPhoto ? `https://picsum.photos/seed/${id}/400/500` : undefined,
    status,
  };
}

const today = new Date().toISOString().slice(0, 10);

export const reviews: MorningReview[] = [
  {
    id: 'r001',
    babyId: 'b001',
    date: today,
    status: 'passed',
    temperatureStatus: 'normal',
    leaveStatus: 'normal',
    overallStatus: 'normal',
    hasPhotoMissing: false,
    isAnomalyCountedNormal: false,
    wasManuallySupplemented: false,
    reviewStage: 'done',
    thermometerRecords: [mkThermo('t001', 'r001', 36.5, 'normal', true)],
    leaveRequests: [],
    auditLogs: [mkAudit('a001', 'r001', 'review_created', '系统', 'system', '晨检流程自动创建')],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'r002',
    babyId: 'b002',
    date: today,
    status: 'passed',
    temperatureStatus: 'dirty',
    leaveStatus: 'normal',
    overallStatus: 'dirty',
    hasPhotoMissing: true,
    isAnomalyCountedNormal: true,
    wasManuallySupplemented: false,
    reviewStage: 'kitchen',
    thermometerRecords: [mkThermo('t002', 'r002', 37.8, 'dirty', false)],
    leaveRequests: [mkLeave('l001', 'r002', '轻微咳嗽，已服药', 'normal', true)],
    auditLogs: [
      mkAudit('a002', 'r002', 'review_created', '系统', 'system', '晨检流程自动创建'),
      mkAudit('a003', 'r002', 'photo_missing', '前台服务员小美', 'waiter', '体温枪照片缺失，部分成功提交'),
      mkAudit('a004', 'r002', 'anomaly_counted_normal', '主管老王', 'manager', '异常体温被纳入正常汇总，已留审计'),
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'r003',
    babyId: 'b003',
    date: today,
    status: 'rejected',
    temperatureStatus: 'normal',
    leaveStatus: 'empty',
    overallStatus: 'empty',
    hasPhotoMissing: true,
    isAnomalyCountedNormal: false,
    wasManuallySupplemented: false,
    reviewStage: 'waiter',
    thermometerRecords: [mkThermo('t003', 'r003', 36.8, 'normal', true)],
    leaveRequests: [mkLeave('l002', 'r003', '', 'empty', false)],
    auditLogs: [
      mkAudit('a005', 'r003', 'review_created', '系统', 'system', '晨检流程自动创建'),
      mkAudit('a006', 'r003', 'photo_missing', '前台服务员小美', 'waiter', '请假条照片缺失，原因也为空'),
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'r004',
    babyId: 'b004',
    date: today,
    status: 'supplemented',
    temperatureStatus: 'normal',
    leaveStatus: 'normal',
    overallStatus: 'normal',
    hasPhotoMissing: false,
    isAnomalyCountedNormal: false,
    wasManuallySupplemented: true,
    reviewStage: 'manager',
    thermometerRecords: [mkThermo('t004', 'r004', 36.2, 'normal', true)],
    leaveRequests: [mkLeave('l003', 'r004', '早上肚子不舒服，已好转', 'normal', true)],
    auditLogs: [
      mkAudit('a007', 'r004', 'review_created', '系统', 'system', '晨检流程自动创建（初始数据为空）'),
      mkAudit('a008', 'r004', 'manual_supplement', '主管老王', 'manager', '手工补录体温与请假条'),
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'r005',
    babyId: 'b005',
    date: today,
    status: 'pending',
    temperatureStatus: 'empty',
    leaveStatus: 'empty',
    overallStatus: 'empty',
    hasPhotoMissing: true,
    isAnomalyCountedNormal: false,
    wasManuallySupplemented: false,
    reviewStage: 'waiter',
    thermometerRecords: [],
    leaveRequests: [],
    auditLogs: [mkAudit('a009', 'r005', 'review_created', '系统', 'system', '晨检流程已创建，等待服务员录入')],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function toExportRows(): ExportRow[] {
  return reviews.map((r) => {
    const baby = babies.find((b) => b.id === r.babyId)!;
    return {
      reviewId: r.id,
      babyName: baby.name,
      className: baby.className,
      date: r.date,
      status: r.status,
      temperatureStatus: r.temperatureStatus,
      leaveStatus: r.leaveStatus,
      hasPhotoMissing: r.hasPhotoMissing,
    };
  });
}
