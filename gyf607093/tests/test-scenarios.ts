import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { privacyService } from '../src/services/privacyService';
import { disinfectionService } from '../src/services/disinfectionService';
import { feedbackService } from '../src/services/feedbackService';
import { exportService } from '../src/services/exportService';
import { syncService } from '../src/services/syncService';
import { auditService } from '../src/services/auditService';
import { UserRoleType } from '../src/config';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  data?: any;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, message: string, data?: any) {
  results.push({ name, passed, message, data });
  const status = passed ? '✓ PASS' : '✗ FAIL';
  console.log(`${status} - ${name}: ${message}`);
  if (data && !passed) {
    console.log('  详情:', JSON.stringify(data, null, 2).substring(0, 200));
  }
}

async function setupTestData() {
  console.log('\n=== 准备测试数据 ===\n');

  await prisma.$transaction([
    prisma.anomalyResolution.deleteMany(),
    prisma.syncStatus.deleteMany(),
    prisma.disinfectionRecord.deleteMany(),
    prisma.feedback.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.exportLog.deleteMany(),
    prisma.classEnrollment.deleteMany(),
    prisma.disinfectionItem.deleteMany(),
    prisma.course.deleteMany(),
    prisma.baby.deleteMany(),
    prisma.class.deleteMany(),
    prisma.user.deleteMany(),
    prisma.privacyField.deleteMany(),
  ]);

  const passwordHash = await bcrypt.hash('123456', 10);

  await prisma.user.createMany({
    data: [
      { username: 'admin', name: '系统管理员', passwordHash, role: 'ADMIN' },
      { username: 'supervisor', name: '张主管', passwordHash, role: 'SUPERVISOR' },
      { username: 'therapist1', name: '李治疗师', passwordHash, role: 'THERAPIST' },
      { username: 'reception', name: '刘前台', passwordHash, role: 'RECEPTION' },
      { username: 'general', name: '陈普通', passwordHash, role: 'GENERAL' },
    ],
  });

  await prisma.privacyField.createMany({
    data: [
      { tableName: 'babies', fieldName: 'idCard', displayName: '身份证号', requiredRoles: 'ADMIN,SUPERVISOR', maskPattern: '**************' },
      { tableName: 'babies', fieldName: 'phone', displayName: '联系电话', requiredRoles: 'ADMIN,SUPERVISOR,THERAPIST,RECEPTION', maskPattern: '*******' },
      { tableName: 'babies', fieldName: 'address', displayName: '家庭住址', requiredRoles: 'ADMIN,SUPERVISOR,THERAPIST', maskPattern: '***' },
      { tableName: 'babies', fieldName: 'parentName', displayName: '家长姓名', requiredRoles: 'ADMIN,SUPERVISOR,THERAPIST,RECEPTION', maskPattern: '*' },
      { tableName: 'babies', fieldName: 'medicalRecord', displayName: '病历信息', requiredRoles: 'ADMIN,SUPERVISOR,THERAPIST', maskPattern: '***' },
    ],
  });

  await privacyService.init();

  const [admin, supervisor, therapist, reception, general] = await Promise.all([
    prisma.user.findUnique({ where: { username: 'admin' } }),
    prisma.user.findUnique({ where: { username: 'supervisor' } }),
    prisma.user.findUnique({ where: { username: 'therapist1' } }),
    prisma.user.findUnique({ where: { username: 'reception' } }),
    prisma.user.findUnique({ where: { username: 'general' } }),
  ]);

  const baby1 = await prisma.baby.create({
    data: {
      name: '小明',
      idCard: '110101202201011234',
      birthDate: new Date('2022-01-01'),
      gender: '男',
      phone: '13800138001',
      address: '北京市朝阳区建国路88号',
      parentName: '张伟',
      medicalRecord: '轻度运动发育迟缓',
    },
  });

  const baby2 = await prisma.baby.create({
    data: {
      name: '小红',
      idCard: '110101202202022345',
      birthDate: new Date('2022-02-02'),
      gender: '女',
      phone: '13800138002',
      address: '北京市海淀区中关村大街1号',
      parentName: '李娜',
      medicalRecord: '语言发育迟缓',
    },
  });

  const classA = await prisma.class.create({
    data: { name: '感统训练A班', code: 'GT-A-001', therapistId: therapist!.id },
  });

  const classB = await prisma.class.create({
    data: { name: '感统训练B班', code: 'GT-B-001', therapistId: therapist!.id },
  });

  const classYY = await prisma.class.create({
    data: { name: '语言训练班', code: 'YY-001', therapistId: therapist!.id },
  });

  await prisma.classEnrollment.createMany({
    data: [
      { babyId: baby1.id, classId: classA.id },
      { babyId: baby1.id, classId: classYY.id },
      { babyId: baby2.id, classId: classA.id },
    ],
  });

  await prisma.disinfectionItem.createMany({
    data: [
      { barcode: 'TEST001', name: '测试安抚奶嘴', type: 'PACIFIER' },
      { barcode: 'TEST002', name: '测试奶瓶', type: 'BOTTLE' },
      { barcode: 'TEST003', name: '测试玩具', type: 'TOY' },
    ],
  });

  const course1 = await prisma.course.create({
    data: { classId: classA.id, name: '测试课程', scheduledDate: new Date() },
  });

  return { admin, supervisor, therapist, reception, general, baby1, baby2, classA, classB, classYY, course1 };
}

async function testPrivacyFieldProtection(testData: any) {
  console.log('\n=== 测试1: 隐私字段按角色保护 ===\n');

  const roles: UserRoleType[] = ['ADMIN', 'SUPERVISOR', 'THERAPIST', 'RECEPTION', 'GENERAL'];
  const babyData = {
    name: '小明',
    idCard: '110101202201011234',
    phone: '13800138001',
    address: '北京市朝阳区建国路88号',
    parentName: '张伟',
    medicalRecord: '轻度运动发育迟缓',
  };

  for (const role of roles) {
    const processed = privacyService.processBabyData(babyData, role, 'json');

    const idCardVisible = !processed.idCard?.toString().includes('*');
    const phoneVisible = !processed.phone?.toString().includes('*') && !processed.phone?.toString().includes('***');
    const addressVisible = !processed.address?.toString().includes('***');

    if (role === 'ADMIN' || role === 'SUPERVISOR') {
      logTest(`高权限角色(${role})可查看身份证`, idCardVisible,
        idCardVisible ? `身份证可见: ${processed.idCard}` : `身份证被脱敏: ${processed.idCard}`);
    } else {
      logTest(`低权限角色(${role})身份证被脱敏`, !idCardVisible,
        !idCardVisible ? `身份证已脱敏: ${processed.idCard}` : `身份证未脱敏: ${processed.idCard}`);
    }

    if (role === 'GENERAL') {
      logTest(`普通用户(${role})电话被脱敏`, !phoneVisible,
        !phoneVisible ? `电话已脱敏: ${processed.phone}` : `电话未脱敏: ${processed.phone}`);
    }

    if (role === 'GENERAL' || role === 'RECEPTION') {
      logTest(`${role}住址被脱敏`, !addressVisible,
        !addressVisible ? `住址已脱敏: ${processed.address}` : `住址未脱敏: ${processed.address}`);
    }
  }

  const logProcessed = privacyService.maskSensitiveData(babyData, 'ADMIN' as UserRoleType);
  const logMasked = !!(logProcessed.idCard?.toString().includes('*') || logProcessed.phone?.toString().includes('*'));
  logTest('日志中隐私字段始终脱敏', logMasked,
    logMasked ? `日志数据已脱敏` : `日志数据未脱敏`);
}

async function testAnomalyProcessingAndSync(testData: any) {
  console.log('\n=== 测试2: 异常处理后数据同步 ===\n');

  const { reception, supervisor, baby1, classA } = testData;

  const item = await prisma.disinfectionItem.findUnique({ where: { barcode: 'TEST002' } });

  const borrowRecord = await disinfectionService.scanRecord({
    barcode: 'TEST002',
    babyId: baby1.id,
    classId: classA.id,
    action: 'borrow',
    userId: reception.id,
  });

  const returnRecord = await disinfectionService.scanRecord({
    barcode: 'TEST002',
    babyId: baby1.id,
    classId: classA.id,
    action: 'return',
    userId: reception.id,
    scanResult: '消毒时间不足-异常',
  });

  logTest('异常归还记录状态为ABNORMAL',
    returnRecord.status === 'ABNORMAL',
    `状态: ${returnRecord.status}`);

  const resolveResult = await disinfectionService.resolveAnomaly({
    recordId: returnRecord.id,
    anomalyType: '消毒时间不足',
    description: '消毒设备故障导致时间不足',
    resolution: '已重新消毒30分钟，确认合格',
    handledById: supervisor.id,
    partialSuccess: false,
  });

  logTest('异常处理后记录状态更新为RESOLVED',
    resolveResult.record.status === 'RESOLVED',
    `状态: ${resolveResult.record.status}`);

  logTest('异常处理记录包含处理人信息',
    resolveResult.record.handledById === supervisor.id && resolveResult.record.handledBy !== null,
    `处理人: ${resolveResult.record.handledBy?.name}`);

  logTest('异常处理后四处同步完成',
    resolveResult.syncResult.classPageSynced &&
    resolveResult.syncResult.babyDetailSynced &&
    resolveResult.syncResult.backendSynced &&
    resolveResult.syncResult.exportSynced,
    `同步结果: ${JSON.stringify(resolveResult.syncResult)}`);

  const syncStatus = await syncService.getSyncStatus(returnRecord.id);
  logTest('同步状态记录已保存',
    syncStatus !== null && syncStatus.classPageSynced,
    `同步状态: ${JSON.stringify(syncStatus)}`);

  const classRecords = await disinfectionService.getClassRecords(
    classA.id,
    'SUPERVISOR' as UserRoleType
  );
  const resolvedInClass = classRecords.records.find(r => r.id === returnRecord.id);
  logTest('班级页可查询到已处理记录',
    resolvedInClass !== undefined && resolvedInClass.status === 'RESOLVED',
    `班级页包含记录: ${resolvedInClass !== undefined}`);

  const babyRecords = await disinfectionService.getBabyRecords(
    baby1.id,
    'SUPERVISOR' as UserRoleType
  );
  const resolvedInBaby = babyRecords.records.find(r => r.id === returnRecord.id);
  logTest('宝宝详情可查询到已处理记录',
    resolvedInBaby !== undefined && resolvedInBaby.status === 'RESOLVED',
    `宝宝详情包含记录: ${resolvedInBaby !== undefined}`);

  return { abnormalRecordId: returnRecord.id };
}

async function testCrossClassPartialSuccess(testData: any) {
  console.log('\n=== 测试3: 跨班宝宝部分成功处理 ===\n');

  const { supervisor, baby1, classA, classYY, classB } = testData;

  const item = await prisma.disinfectionItem.findUnique({ where: { barcode: 'TEST003' } });

  await disinfectionService.scanRecord({
    barcode: 'TEST003',
    babyId: baby1.id,
    classId: classA.id,
    userId: supervisor.id,
    action: 'borrow',
  });

  const abnormalReturn = await disinfectionService.scanRecord({
    barcode: 'TEST003',
    babyId: baby1.id,
    classId: classA.id,
    userId: supervisor.id,
    action: 'return',
    scanResult: '跨班测试异常',
  });

  const crossClassResult = await disinfectionService.processCrossClassBaby(
    baby1.id,
    classA.id,
    [classYY.id, classB.id],
    supervisor.id
  );

  await disinfectionService.resolveAnomaly({
    recordId: abnormalReturn.id,
    anomalyType: '跨班测试异常',
    description: '测试跨班处理',
    resolution: '已处理',
    handledById: supervisor.id,
    partialSuccess: true,
  });

  logTest('跨班处理允许部分成功',
    crossClassResult.partialSuccess === true || crossClassResult.success === true,
    `部分成功: ${crossClassResult.partialSuccess}, 成功班级: ${crossClassResult.processedClasses.length}, 失败: ${crossClassResult.failedClasses.length}`);

  logTest('已报名班级处理成功',
    crossClassResult.processedClasses.includes(classYY.id),
    `已报名班级YY在成功列表: ${crossClassResult.processedClasses.includes(classYY.id)}`);

  logTest('未报名班级处理失败',
    crossClassResult.failedClasses.some(f => f.classId === classB.id),
    `未报名班级B在失败列表: ${crossClassResult.failedClasses.some(f => f.classId === classB.id)}`);

  if (crossClassResult.failedClasses.length > 0) {
    logTest('失败原因记录正确',
      crossClassResult.failedClasses[0].reason.includes('未报名'),
      `失败原因: ${crossClassResult.failedClasses[0].reason}`);
  }
}

async function testUnauthorizedAudit(testData: any) {
  console.log('\n=== 测试4: 越权访问审计 ===\n');

  const { general, baby1 } = testData;

  await auditService.logUnauthorizedAccess(
    general.id,
    'BabyDetail',
    baby1.id,
    'GENERAL',
    'SUPERVISOR',
    '192.168.1.100',
    'Test User Agent'
  );

  const unauthorizedLogs = await auditService.getUnauthorizedAccessLogs();
  const hasLog = unauthorizedLogs.logs.some(
    log => log.userId === general.id && log.isUnauthorized === true
  );

  logTest('越权访问已记录审计日志',
    hasLog,
    `找到越权日志: ${hasLog}, 总数: ${unauthorizedLogs.total}`);

  const allAuditLogs = await auditService.getAuditLogs(
    { isUnauthorized: true },
    1,
    20
  );

  logTest('主管可查询越权审计日志',
    allAuditLogs.logs.length > 0 && allAuditLogs.logs[0].isUnauthorized === true,
    `越权日志可查询: ${allAuditLogs.logs.length > 0}`);

  if (allAuditLogs.logs.length > 0) {
    const log = allAuditLogs.logs[0];
    logTest('审计日志包含完整上下文',
      log.ipAddress !== null && log.userAgent !== null && log.details !== null,
      `日志包含IP: ${log.ipAddress}, 详情: ${log.details?.substring(0, 30)}`);
  }
}

async function testFeedbackVersionConsistency(testData: any) {
  console.log('\n=== 测试5: 课后反馈版本一致性 ===\n');

  const { therapist, baby1, course1 } = testData;

  const feedbackV1 = await feedbackService.createFeedback({
    babyId: baby1.id,
    courseId: course1.id,
    content: 'v1: 今天表现很好，能完成5个动作',
    source: 'THERAPIST',
    createdById: therapist.id,
  });

  logTest('反馈v1创建成功，版本号为1',
    feedbackV1.version === 1 && feedbackV1.isLatest === true,
    `版本: ${feedbackV1.version}, 是否最新: ${feedbackV1.isLatest}`);

  const feedbackV2 = await feedbackService.updateFeedback(
    feedbackV1.id,
    'v2: 今天表现很好，能完成8个动作，比上次进步',
    therapist.id
  );

  logTest('更新反馈创建新版本v2',
    feedbackV2.version === 2 && feedbackV2.isLatest === true,
    `新版本: ${feedbackV2.version}, 是否最新: ${feedbackV2.isLatest}`);

  const latestFromReception = await feedbackService.getLatestFeedback(
    baby1.id,
    course1.id,
    'RECEPTION' as UserRoleType
  );

  const latestFromTherapist = await feedbackService.getLatestFeedback(
    baby1.id,
    course1.id,
    'THERAPIST' as UserRoleType
  );

  logTest('前台和治疗师读到同一个最新版本',
    latestFromReception?.version === latestFromTherapist?.version &&
    latestFromReception?.content === latestFromTherapist?.content,
    `前台版本: ${latestFromReception?.version}, 治疗师版本: ${latestFromTherapist?.version}`);

  const v1History = await feedbackService.getFeedbackVersion(baby1.id, 1, course1.id);
  logTest('历史版本v1仍然保留',
    v1History !== null && v1History.version === 1 && v1History.isLatest === false,
    `v1存在: ${v1History !== null}, 内容: ${v1History?.content?.substring(0, 20)}`);

  const compareResult = await feedbackService.compareVersions(baby1.id, 1, 2, course1.id);
  logTest('版本对比功能正常',
    compareResult.diff.length > 0 && compareResult.v1 !== null && compareResult.v2 !== null,
    `差异数: ${compareResult.diff.length}`);
}

async function testManualEntryAndExport(testData: any) {
  console.log('\n=== 测试6: 手工补录和导出功能 ===\n');

  const { reception, general, baby2, classA } = testData;

  const item = await prisma.disinfectionItem.findUnique({ where: { barcode: 'TEST003' } });

  const beforeRecords = await disinfectionService.getClassRecords(
    classA.id,
    'RECEPTION' as UserRoleType
  );
  const beforeCount = beforeRecords.records.filter(r => r.isManualEntry).length;

  const manualRecord = await disinfectionService.manualEntry({
    itemId: item!.id,
    babyId: baby2.id,
    classId: classA.id,
    borrowTime: new Date(Date.now() - 86400000),
    returnTime: new Date(Date.now() - 82800000),
    scanResult: '消毒合格',
    userId: reception.id,
    note: '扫码枪故障，手工补录昨日记录',
  });

  logTest('手工补录记录创建成功',
    manualRecord.isManualEntry === true && manualRecord.manualEntryNote !== null,
    `手工补录标记: ${manualRecord.isManualEntry}, 备注: ${manualRecord.manualEntryNote}`);

  logTest('手工补录记录有处理人',
    manualRecord.handledById === reception.id,
    `处理人ID: ${manualRecord.handledById}`);

  const afterRecords = await disinfectionService.getClassRecords(
    classA.id,
    'RECEPTION' as UserRoleType
  );
  const afterCount = afterRecords.records.filter(r => r.isManualEntry).length;

  logTest('补录前后班级页可看到差异',
    afterCount === beforeCount + 1,
    `补录前手工记录数: ${beforeCount}, 补录后: ${afterCount}`);

  const exportResult = await exportService.exportToCsv(
    { classId: classA.id },
    reception.id,
    'RECEPTION' as UserRoleType
  );

  logTest('CSV导出成功',
    exportResult.recordCount > 0 && fs.existsSync(exportResult.filePath),
    `导出记录数: ${exportResult.recordCount}, 文件存在: ${fs.existsSync(exportResult.filePath)}`);

  const jsonResult = await exportService.exportToJson(
    {},
    reception.id,
    'RECEPTION' as UserRoleType
  );

  logTest('JSON导出成功',
    jsonResult.recordCount > 0 && fs.existsSync(jsonResult.filePath),
    `导出记录数: ${jsonResult.recordCount}`);

  const jsonResultGeneral = await exportService.exportToJson(
    {},
    general.id,
    'GENERAL' as UserRoleType
  );

  const exportedData = JSON.parse(fs.readFileSync(jsonResultGeneral.filePath, 'utf-8'));
  const exportedBaby = exportedData.records.find((r: any) => r.babyId === baby2.id)?.baby;

  const phoneMasked = exportedBaby?.phone?.includes('*') || exportedBaby?.phone?.includes('***');
  logTest('导出数据中隐私字段按角色脱敏',
    phoneMasked,
    `导出电话: ${exportedBaby?.phone}, 已脱敏: ${phoneMasked}`);

  const exportHistory = await exportService.getExportHistory(reception.id);
  logTest('导出历史已记录',
    exportHistory.logs.length >= 2,
    `导出历史记录数: ${exportHistory.logs.length}`);

  if (fs.existsSync(exportResult.filePath)) {
    fs.unlinkSync(exportResult.filePath);
  }
  if (fs.existsSync(jsonResult.filePath)) {
    fs.unlinkSync(jsonResult.filePath);
  }
  if (fs.existsSync(jsonResultGeneral.filePath)) {
    fs.unlinkSync(jsonResultGeneral.filePath);
  }
}

async function testHandledByVisibility(testData: any) {
  console.log('\n=== 测试7: 处理人在所有视图可见 ===\n');

  const { supervisor, baby1, classA } = testData;

  const abnormalRecord = await prisma.disinfectionRecord.findFirst({
    where: { babyId: baby1.id, status: 'RESOLVED' },
    include: { handledBy: true },
  });

  if (!abnormalRecord || !abnormalRecord.handledById) {
    logTest('跳过处理人测试', false, '没有找到已处理的异常记录');
    return;
  }

  logTest('数据库记录有处理人信息',
    abnormalRecord.handledById !== null && abnormalRecord.handledBy !== null,
    `处理人: ${abnormalRecord.handledBy?.name}`);

  const recordDetail = await disinfectionService.getRecordWithPrivacy(
    abnormalRecord.id,
    'RECEPTION' as UserRoleType,
    'json'
  );

  logTest('前台能在记录详情看到处理人',
    recordDetail?.handledBy !== null && recordDetail?.handledBy?.name !== null,
    `详情处理人: ${recordDetail?.handledBy?.name}`);

  const classView = await disinfectionService.getClassRecords(
    classA.id,
    'RECEPTION' as UserRoleType
  );
  const classRecord = classView.records.find(r => r.id === abnormalRecord.id);

  logTest('前台能在班级页看到处理人',
    classRecord?.handledBy !== null && classRecord?.handledBy?.name !== null,
    `班级页处理人: ${classRecord?.handledBy?.name}`);

  const babyView = await disinfectionService.getBabyRecords(
    baby1.id,
    'RECEPTION' as UserRoleType
  );
  const babyRecord = babyView.records.find(r => r.id === abnormalRecord.id);

  logTest('前台能在宝宝详情看到处理人',
    babyRecord?.handledBy !== null && babyRecord?.handledBy?.name !== null,
    `宝宝详情处理人: ${babyRecord?.handledBy?.name}`);
}

async function runAllTests() {
  console.log('==============================================');
  console.log('婴幼儿用品消毒复核墙康复课务版 - 业务场景测试');
  console.log('==============================================');

  try {
    const testData = await setupTestData();
    console.log('测试数据准备完成');

    await testPrivacyFieldProtection(testData);
    const anomalyTestResult = await testAnomalyProcessingAndSync(testData);
    await testCrossClassPartialSuccess(testData);
    await testUnauthorizedAudit(testData);
    await testFeedbackVersionConsistency(testData);
    await testManualEntryAndExport(testData);
    await testHandledByVisibility(testData);

    console.log('\n==============================================');
    console.log('测试结果汇总');
    console.log('==============================================');

    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    const failed = total - passed;

    console.log(`\n总计: ${total} 项测试, 通过: ${passed} 项, 失败: ${failed} 项`);

    if (failed > 0) {
      console.log('\n失败的测试:');
      results.filter(r => !r.passed).forEach(r => {
        console.log(`  ✗ ${r.name}: ${r.message}`);
      });
      process.exit(1);
    } else {
      console.log('\n✓ 所有测试通过!');
      process.exit(0);
    }
  } catch (error) {
    console.error('测试执行失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAllTests();
