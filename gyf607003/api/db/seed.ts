import type Database from 'better-sqlite3';
import type { User, Baby, DisinfectionRecord, ExceptionRecord, AuditLog, ClassInfo } from '../../shared/types.js';

export function seedData(db: Database.Database): void {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const fmt = (h: number, m: number) => `${today}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`;

  const users: User[] = [
    { id: 'u_disinfector', name: '张消毒', role: 'disinfector' },
    { id: 'u_teacher', name: '李老师', role: 'teacher' },
    { id: 'u_supervisor', name: '王主管', role: 'supervisor' },
    { id: 'u_admin', name: '赵管理员', role: 'admin' },
  ];

  const classes: ClassInfo[] = [
    { id: 'c_small', name: '小班', capacity: 20, babyCount: 4, exceptionCount: 0, completedRate: 88 },
    { id: 'c_middle', name: '中班', capacity: 25, babyCount: 4, exceptionCount: 1, completedRate: 72 },
    { id: 'c_large', name: '大班', capacity: 30, babyCount: 4, exceptionCount: 0, completedRate: 95 },
  ];

  const babies: Baby[] = [
    { id: 'b_s1', name: '小明', classId: 'c_small', className: '小班', parentPhone: '13812340001', parentIdCard: '110101202001010011', homeAddress: '北京市朝阳区建国路88号院1号楼1001室', status: 'normal' },
    { id: 'b_s2', name: '小红', classId: 'c_small', className: '小班', parentPhone: '13912340002', parentIdCard: '110101202001020022', homeAddress: '北京市海淀区中关村大街1号院2号楼2002室', status: 'normal' },
    { id: 'b_s3', name: '小刚', classId: 'c_small', className: '小班', parentPhone: '13712340003', parentIdCard: '110101202001030033', homeAddress: '北京市西城区金融街10号院3号楼3003室', status: 'normal' },
    { id: 'b_s4', name: '小丽', classId: 'c_small', className: '小班', parentPhone: '13612340004', parentIdCard: '110101202001040044', homeAddress: '北京市东城区王府井大街5号院4号楼4004室', status: 'normal' },
    { id: 'b_m1', name: '小华', classId: 'c_middle', className: '中班', parentPhone: '13512340005', parentIdCard: '110101201901050055', homeAddress: '北京市丰台区南三环西路16号院5号楼5005室', status: 'exception' },
    { id: 'b_m2', name: '小强', classId: 'c_middle', className: '中班', parentPhone: '13412340006', parentIdCard: '110101201901060066', homeAddress: '北京市石景山区古城大街8号院6号楼6006室', status: 'normal' },
    { id: 'b_m3', name: '小芳', classId: 'c_middle', className: '中班', parentPhone: '13312340007', parentIdCard: '110101201901070077', homeAddress: '北京市通州区新华大街12号院7号楼7007室', status: 'normal' },
    { id: 'b_m4', name: '小军', classId: 'c_middle', className: '中班', parentPhone: '13212340008', parentIdCard: '110101201901080088', homeAddress: '北京市大兴区黄村东大街20号院8号楼8008室', status: 'normal' },
    { id: 'b_l1', name: '小伟', classId: 'c_large', className: '大班', parentPhone: '13112340009', parentIdCard: '110101201801090099', homeAddress: '北京市昌平区回龙观西大街15号院9号楼9009室', status: 'normal' },
    { id: 'b_l2', name: '小敏', classId: 'c_large', className: '大班', parentPhone: '13012340010', parentIdCard: '110101201801100100', homeAddress: '北京市顺义区府前东街6号院10号楼10010室', status: 'normal' },
    { id: 'b_l3', name: '小磊', classId: 'c_large', className: '大班', parentPhone: '15812340011', parentIdCard: '110101201801110111', homeAddress: '北京市房山区良乡西路22号院11号楼11011室', status: 'normal' },
    { id: 'b_l4', name: '小燕', classId: 'c_large', className: '大班', parentPhone: '15912340012', parentIdCard: '110101201801120122', homeAddress: '北京市门头沟区新桥大街18号院12号楼12012室', status: 'normal' },
  ];

  const records: DisinfectionRecord[] = [
    { id: 'r1', babyId: 'b_s1', babyName: '小明', classId: 'c_small', itemType: 'bottle', itemName: '贝亲奶瓶240ml', status: 'disinfected', operatorId: 'u_disinfector', operatorName: '张消毒', operateTime: fmt(18, 30), isManual: false },
    { id: 'r2', babyId: 'b_s1', babyName: '小明', classId: 'c_small', itemType: 'tableware', itemName: '不锈钢餐具套装', status: 'disinfected', operatorId: 'u_disinfector', operatorName: '张消毒', operateTime: fmt(18, 35), isManual: false },
    { id: 'r3', babyId: 'b_s2', babyName: '小红', classId: 'c_small', itemType: 'bottle', itemName: 'NUK奶瓶180ml', status: 'distributed', operatorId: 'u_disinfector', operatorName: '张消毒', operateTime: fmt(18, 40), isManual: false },
    { id: 'r4', babyId: 'b_s3', babyName: '小刚', classId: 'c_small', itemType: 'toy', itemName: '硅胶牙胶', status: 'recycled', operatorId: 'u_disinfector', operatorName: '张消毒', operateTime: fmt(18, 45), isManual: false },
    { id: 'r5', babyId: 'b_s4', babyName: '小丽', classId: 'c_small', itemType: 'clothing', itemName: '纯棉围兜', status: 'disinfected', operatorId: 'u_disinfector', operatorName: '张消毒', operateTime: fmt(18, 50), isManual: true, remark: '手工补录：夜班交接时发现漏登记' },
    { id: 'r6', babyId: 'b_m1', babyName: '小华', classId: 'c_middle', itemType: 'bottle', itemName: '可么多么奶瓶250ml', status: 'exception', operatorId: 'u_disinfector', operatorName: '张消毒', operateTime: fmt(19, 0), isManual: false },
    { id: 'r7', babyId: 'b_m1', babyName: '小华', classId: 'c_middle', itemType: 'tableware', itemName: '辅食碗勺套装', status: 'disinfected', operatorId: 'u_disinfector', operatorName: '张消毒', operateTime: fmt(19, 5), isManual: false },
    { id: 'r8', babyId: 'b_m2', babyName: '小强', classId: 'c_middle', itemType: 'bottle', itemName: '布朗博士奶瓶', status: 'disinfected', operatorId: 'u_disinfector', operatorName: '张消毒', operateTime: fmt(19, 10), isManual: false },
    { id: 'r9', babyId: 'b_m3', babyName: '小芳', classId: 'c_middle', itemType: 'toy', itemName: '曼哈顿手抓球', status: 'pending', operatorId: 'u_disinfector', operatorName: '张消毒', operateTime: fmt(19, 15), isManual: false },
    { id: 'r10', babyId: 'b_m4', babyName: '小军', classId: 'c_middle', itemType: 'clothing', itemName: '换洗衣物套装', status: 'disinfected', operatorId: 'u_disinfector', operatorName: '张消毒', operateTime: fmt(19, 20), isManual: false },
    { id: 'r11', babyId: 'b_l1', babyName: '小伟', classId: 'c_large', itemType: 'bottle', itemName: '学饮杯', status: 'disinfected', operatorId: 'u_disinfector', operatorName: '张消毒', operateTime: fmt(19, 25), isManual: false },
    { id: 'r12', babyId: 'b_l2', babyName: '小敏', classId: 'c_large', itemType: 'tableware', itemName: '儿童筷子训练套', status: 'distributed', operatorId: 'u_disinfector', operatorName: '张消毒', operateTime: fmt(19, 30), isManual: false },
    { id: 'r13', babyId: 'b_l3', babyName: '小磊', classId: 'c_large', itemType: 'toy', itemName: '积木套装', status: 'recycled', operatorId: 'u_disinfector', operatorName: '张消毒', operateTime: fmt(19, 35), isManual: false },
    { id: 'r14', babyId: 'b_l4', babyName: '小燕', classId: 'c_large', itemType: 'clothing', itemName: '午睡小毯子', status: 'disinfected', operatorId: 'u_disinfector', operatorName: '张消毒', operateTime: fmt(19, 40), isManual: false },
    { id: 'r15', babyId: 'b_l1', babyName: '小伟', classId: 'c_large', itemType: 'other', itemName: '安抚奶嘴', status: 'disinfected', operatorId: 'u_disinfector', operatorName: '张消毒', operateTime: fmt(19, 45), isManual: false },
  ];

  const exceptions: ExceptionRecord[] = [
    {
      id: 'e1', recordId: 'r6', babyId: 'b_m1', babyName: '小华', classId: 'c_middle',
      type: 'unclean_reissue', reason: '奶瓶未完成消毒被误放入发放区，被中班老师发现退回',
      status: 'pending', createTime: fmt(19, 15),
    },
    {
      id: 'e2', recordId: 'r4', babyId: 'b_s3', babyName: '小刚', classId: 'c_small',
      type: 'damage', reason: '硅胶牙胶回收时发现有咬裂痕迹',
      status: 'resolved', handlerId: 'u_disinfector', handlerName: '张消毒',
      handleMeasure: '已丢弃损坏牙胶，通知家长补送新牙胶', handleTime: fmt(19, 10),
      reviewedBy: 'u_supervisor', reviewedAt: fmt(20, 0), reviewComment: '处理及时，已记录。',
      createTime: fmt(18, 55),
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'a1', action: 'handle_exception', targetType: 'exception', targetId: 'e2',
      operatorId: 'u_disinfector', operatorName: '张消毒', operateTime: fmt(19, 10),
      beforeData: { status: 'pending' }, afterData: { status: 'resolved', handleMeasure: '已丢弃损坏牙胶' },
      syncStatus: 'success', retryCount: 0,
    },
    {
      id: 'a2', action: 'manual_record', targetType: 'record', targetId: 'r5',
      operatorId: 'u_disinfector', operatorName: '张消毒', operateTime: fmt(18, 50),
      beforeData: null, afterData: { babyName: '小丽', itemName: '纯棉围兜', isManual: true },
      syncStatus: 'success', retryCount: 0,
    },
  ];

  const insertUser = db.prepare('INSERT INTO users (id, name, role) VALUES (?, ?, ?)');
  for (const u of users) insertUser.run(u.id, u.name, u.role);

  const insertClass = db.prepare('INSERT INTO classes (id, name, capacity) VALUES (?, ?, ?)');
  for (const c of classes) insertClass.run(c.id, c.name, c.capacity);

  const insertBaby = db.prepare('INSERT INTO babies (id, name, class_id, class_name, parent_phone, parent_id_card, home_address, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  for (const b of babies) insertBaby.run(b.id, b.name, b.classId, b.className, b.parentPhone, b.parentIdCard, b.homeAddress, b.status);

  const insertRecord = db.prepare('INSERT INTO disinfection_records (id, baby_id, baby_name, class_id, item_type, item_name, status, operator_id, operator_name, operate_time, is_manual, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  for (const r of records) insertRecord.run(r.id, r.babyId, r.babyName, r.classId, r.itemType, r.itemName, r.status, r.operatorId, r.operatorName, r.operateTime, r.isManual ? 1 : 0, r.remark || null);

  const insertException = db.prepare('INSERT INTO exception_records (id, record_id, baby_id, baby_name, class_id, type, reason, status, handler_id, handler_name, handle_measure, handle_time, create_time, reviewed_by, reviewed_at, review_comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  for (const e of exceptions) insertException.run(e.id, e.recordId, e.babyId, e.babyName, e.classId, e.type, e.reason, e.status, e.handlerId || null, e.handlerName || null, e.handleMeasure || null, e.handleTime || null, e.createTime, e.reviewedBy || null, e.reviewedAt || null, e.reviewComment || null);

  const insertAudit = db.prepare('INSERT INTO audit_logs (id, action, target_type, target_id, operator_id, operator_name, operate_time, before_data, after_data, sync_status, retry_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  for (const a of auditLogs) insertAudit.run(a.id, a.action, a.targetType, a.targetId, a.operatorId, a.operatorName, a.operateTime, JSON.stringify(a.beforeData), JSON.stringify(a.afterData), a.syncStatus, a.retryCount);
}
