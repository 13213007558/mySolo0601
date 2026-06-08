import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据...');

  const passwordHash = await bcrypt.hash('123456', 10);

  const users = await prisma.user.createMany({
    data: [
      { username: 'admin', name: '系统管理员', passwordHash, role: 'ADMIN' },
      { username: 'supervisor', name: '张主管', passwordHash, role: 'SUPERVISOR' },
      { username: 'therapist1', name: '李治疗师', passwordHash, role: 'THERAPIST' },
      { username: 'therapist2', name: '王治疗师', passwordHash, role: 'THERAPIST' },
      { username: 'reception', name: '刘前台', passwordHash, role: 'RECEPTION' },
      { username: 'general', name: '陈普通', passwordHash, role: 'GENERAL' },
    ],
  });
  console.log(`创建了 ${users.count} 个用户`);

  await prisma.privacyField.createMany({
    data: [
      { tableName: 'babies', fieldName: 'idCard', displayName: '身份证号', requiredRoles: 'ADMIN,SUPERVISOR', maskPattern: '**************' },
      { tableName: 'babies', fieldName: 'phone', displayName: '联系电话', requiredRoles: 'ADMIN,SUPERVISOR,THERAPIST,RECEPTION', maskPattern: '*******' },
      { tableName: 'babies', fieldName: 'address', displayName: '家庭住址', requiredRoles: 'ADMIN,SUPERVISOR,THERAPIST', maskPattern: '***' },
      { tableName: 'babies', fieldName: 'parentName', displayName: '家长姓名', requiredRoles: 'ADMIN,SUPERVISOR,THERAPIST,RECEPTION', maskPattern: '*' },
      { tableName: 'babies', fieldName: 'medicalRecord', displayName: '病历信息', requiredRoles: 'ADMIN,SUPERVISOR,THERAPIST', maskPattern: '***' },
    ],
  });
  console.log('创建了隐私字段配置');

  const babies = await prisma.baby.createMany({
    data: [
      {
        name: '小明',
        idCard: '110101202201011234',
        birthDate: new Date('2022-01-01'),
        gender: '男',
        phone: '13800138001',
        address: '北京市朝阳区建国路88号',
        parentName: '张伟',
        medicalRecord: '轻度运动发育迟缓，需加强上肢训练',
      },
      {
        name: '小红',
        idCard: '110101202202022345',
        birthDate: new Date('2022-02-02'),
        gender: '女',
        phone: '13800138002',
        address: '北京市海淀区中关村大街1号',
        parentName: '李娜',
        medicalRecord: '语言发育迟缓，每周2次语言训练',
      },
      {
        name: '小刚',
        idCard: '110101202203033456',
        birthDate: new Date('2022-03-03'),
        gender: '男',
        phone: '13800138003',
        address: '北京市西城区金融街15号',
        parentName: '王刚',
        medicalRecord: '正常发育，定期体检',
      },
    ],
  });
  console.log(`创建了 ${babies.count} 个宝宝`);

  const therapist1 = await prisma.user.findUnique({ where: { username: 'therapist1' } });
  const therapist2 = await prisma.user.findUnique({ where: { username: 'therapist2' } });

  const classes = await prisma.class.createMany({
    data: [
      { name: '感统训练A班', code: 'GT-A-001', description: '感觉统合训练初级班', therapistId: therapist1?.id },
      { name: '感统训练B班', code: 'GT-B-001', description: '感觉统合训练进阶班', therapistId: therapist2?.id },
      { name: '语言训练班', code: 'YY-001', description: '语言发育训练', therapistId: therapist1?.id },
    ],
  });
  console.log(`创建了 ${classes.count} 个班级`);

  const classA = await prisma.class.findUnique({ where: { code: 'GT-A-001' } });
  const classB = await prisma.class.findUnique({ where: { code: 'GT-B-001' } });
  const classYY = await prisma.class.findUnique({ where: { code: 'YY-001' } });

  const baby1 = await prisma.baby.findUnique({ where: { idCard: '110101202201011234' } });
  const baby2 = await prisma.baby.findUnique({ where: { idCard: '110101202202022345' } });
  const baby3 = await prisma.baby.findUnique({ where: { idCard: '110101202203033456' } });

  await prisma.classEnrollment.createMany({
    data: [
      { babyId: baby1!.id, classId: classA!.id },
      { babyId: baby1!.id, classId: classYY!.id },
      { babyId: baby2!.id, classId: classA!.id },
      { babyId: baby3!.id, classId: classB!.id },
      { babyId: baby3!.id, classId: classYY!.id },
    ],
  });
  console.log('创建了班级报名关系（小明跨班）');

  await prisma.course.createMany({
    data: [
      { classId: classA!.id, name: '感统训练第1课', scheduledDate: new Date('2026-06-01T09:00:00') },
      { classId: classA!.id, name: '感统训练第2课', scheduledDate: new Date('2026-06-03T09:00:00') },
      { classId: classYY!.id, name: '语言训练第1课', scheduledDate: new Date('2026-06-02T14:00:00') },
      { classId: classB!.id, name: '感统进阶第1课', scheduledDate: new Date('2026-06-04T10:00:00') },
    ],
  });
  console.log('创建了课程安排');

  await prisma.disinfectionItem.createMany({
    data: [
      { barcode: 'ITEM001', name: '安抚奶嘴A1', type: 'PACIFIER' },
      { barcode: 'ITEM002', name: '奶瓶B2', type: 'BOTTLE' },
      { barcode: 'ITEM003', name: '益智积木', type: 'TOY' },
      { barcode: 'ITEM004', name: '口水巾C3', type: 'TOWEL' },
      { barcode: 'ITEM005', name: '牙胶D4', type: 'OTHER' },
    ],
  });
  console.log('创建了消毒物品');

  const reception = await prisma.user.findUnique({ where: { username: 'reception' } });
  const item1 = await prisma.disinfectionItem.findUnique({ where: { barcode: 'ITEM001' } });
  const item2 = await prisma.disinfectionItem.findUnique({ where: { barcode: 'ITEM002' } });
  const item3 = await prisma.disinfectionItem.findUnique({ where: { barcode: 'ITEM003' } });

  const normalRecord = await prisma.disinfectionRecord.create({
    data: {
      itemId: item1!.id,
      babyId: baby2!.id,
      classId: classA!.id,
      borrowTime: new Date('2026-06-09T08:30:00'),
      returnTime: new Date('2026-06-09T09:30:00'),
      status: 'NORMAL',
      scanResult: '消毒合格',
      createdById: reception!.id,
    },
  });
  console.log('创建了正常消毒记录');

  const abnormalRecord = await prisma.disinfectionRecord.create({
    data: {
      itemId: item2!.id,
      babyId: baby1!.id,
      classId: classA!.id,
      borrowTime: new Date('2026-06-09T08:45:00'),
      returnTime: new Date('2026-06-09T09:45:00'),
      status: 'ABNORMAL',
      scanResult: '消毒时间不足',
      createdById: reception!.id,
    },
  });
  console.log('创建了异常消毒记录');

  await prisma.disinfectionRecord.create({
    data: {
      itemId: item3!.id,
      babyId: baby1!.id,
      classId: classYY!.id,
      borrowTime: new Date('2026-06-09T13:30:00'),
      returnTime: new Date('2026-06-09T14:30:00'),
      status: 'PENDING',
      scanResult: null,
      createdById: reception!.id,
    },
  });
  console.log('创建了待处理消毒记录');

  const manualEntry = await prisma.disinfectionRecord.create({
    data: {
      itemId: item1!.id,
      babyId: baby3!.id,
      classId: classB!.id,
      borrowTime: new Date('2026-06-08T09:00:00'),
      returnTime: new Date('2026-06-08T10:00:00'),
      status: 'RESOLVED',
      scanResult: '补录-消毒合格',
      createdById: reception!.id,
      handledById: reception!.id,
      isManualEntry: true,
      manualEntryNote: '扫码枪故障，手工补录昨日记录',
    },
  });
  console.log('创建了手工补录记录（用于展示差异）');

  const supervisor = await prisma.user.findUnique({ where: { username: 'supervisor' } });

  await prisma.anomalyResolution.create({
    data: {
      recordId: manualEntry.id,
      anomalyType: '设备故障',
      description: '扫码枪电量不足，无法正常扫码',
      resolution: '已核对物品实际消毒记录，确认消毒时间足够，手工补录',
      handledById: supervisor!.id,
      partialSuccess: false,
    },
  });
  console.log('创建了异常处理记录');

  await prisma.syncStatus.create({
    data: {
      recordId: manualEntry.id,
      classPageSynced: true,
      babyDetailSynced: true,
      backendSynced: true,
      exportSynced: true,
      lastSyncAt: new Date(),
    },
  });
  console.log('创建了同步状态记录');

  const course1 = await prisma.course.findFirst({ where: { classId: classA!.id } });

  await prisma.feedback.create({
    data: {
      babyId: baby1!.id,
      courseId: course1!.id,
      content: '小明今日上肢力量训练表现良好，能完成10次抓握动作，比上次进步明显。建议在家继续练习推球动作。',
      source: 'THERAPIST',
      createdById: therapist1!.id,
      version: 1,
      isLatest: true,
    },
  });
  console.log('创建了治疗师课后反馈');

  await prisma.auditLog.create({
    data: {
      userId: supervisor!.id,
      action: 'MANUAL_ENTRY',
      targetType: 'DisinfectionRecord',
      targetId: manualEntry.id,
      babyId: baby3!.id,
      classId: classB!.id,
      details: '手工补录消毒记录，扫码枪故障',
    },
  });
  console.log('创建了审计日志');

  console.log('\n=== 数据初始化完成 ===');
  console.log('测试账号:');
  console.log('  管理员: admin / 123456');
  console.log('  主管: supervisor / 123456');
  console.log('  治疗师: therapist1 / 123456');
  console.log('  前台: reception / 123456');
  console.log('  普通用户: general / 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
