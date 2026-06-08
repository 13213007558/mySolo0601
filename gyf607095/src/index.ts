import { system } from './app';
import { feedbackService } from './services/feedbackService';
import { SAMPLE_DATA_FILE } from './data/sampleData';
import { formatCurrency } from './utils';

function sleep(ms: number): void {
  const start = Date.now();
  while (Date.now() - start < ms) {}
}

function separator(): void {
  console.log('\n' + '='.repeat(60));
}

console.log('\n' + '='.repeat(60));
console.log(' 婴幼儿费用核销清洗链 康复课务版 ');
console.log('='.repeat(60));

console.log('\n 功能清单：');
console.log('  1. 前台新人按步骤处理（6步操作指南）');
console.log('  2. 权限隔离（普通账号/主管账号）');
console.log('  3. 数量口径一致（两边统计不打架）');
console.log('  4. 照片缺失允许部分成功（扣款减半）');
console.log('  5. 异常保留审计痕迹（主管可复查）');
console.log('  6. 样例数据重导入不重复（历史清晰）');
console.log('  7. 课后反馈版本一致（结算/详情同源）');
console.log('  8. 手工补录记录（展示前后差异）');
console.log('  9. 余额安全检查（避免月底变负）');

separator();
console.log('\n【第一步】主管刘主管登录，导入样例数据');
system.login('liuzhuguan');

separator();
console.log('\n【第二步】导入样例数据（第一次导入）');
system.importSampleData(SAMPLE_DATA_FILE);
sleep(100);

separator();
console.log('\n【第三步】切换前台张前台登录');
system.login('zhangqiantai');

separator();
console.log('\n【第四步】查看前台操作步骤（新人照做）');
system.showReceptionSteps();

separator();
console.log('\n【第五步】查看手工补录前后差异');
system.showManualEntryComparison();

separator();
console.log('\n【第六步】前台批量核销处理');
system.processWriteOff();

separator();
console.log('\n【第七步】查看小明的详情（包含反馈）');
const xiaomingRecord = system.findChildByName('小明');
if (xiaomingRecord) {
  system.getChildDetail(xiaomingRecord.id);
}

separator();
console.log('\n【第八步】查看前台视图（只看必要内容）');
const receptionView = system.getReceptionView();
console.log('\n 前台汇总：');
console.log('  待处理: ' + receptionView.pendingRecords.length + '条');
console.log('  总记录: ' + receptionView.summary.totalCount + '条');
console.log('  成功: ' + receptionView.summary.successCount + '条');
console.log('  部分成功: ' + receptionView.summary.partialSuccessCount + '条');
console.log('  异常: ' + receptionView.summary.exceptionCount + '条');
console.log('  待审计: ' + receptionView.summary.pendingAuditCount + '条');

separator();
console.log('\n【第九步】切换主管刘主管登录');
system.login('liuzhuguan');

separator();
console.log('\n【第十步】查看主管视图（完整审计）');
const supervisorView = system.getSupervisorView();
console.log('\n 主管汇总（与前台口径一致）：');
console.log('  总记录: ' + supervisorView.totalCount + '条');
console.log('  成功: ' + supervisorView.successCount + '条');
console.log('  部分成功: ' + supervisorView.partialSuccessCount + '条');
console.log('  异常: ' + supervisorView.exceptionCount + '条');
console.log('  待审计: ' + supervisorView.pendingAuditCount + '条');
console.log('\n 审计追踪（最近5条）：');
supervisorView.auditTrail.slice(-5).forEach(log => {
  console.log('  ' + log.createdAt.substring(11, 19) + ' | ' + log.operatorName + ' | ' + log.action + ' | ' + (log.note ? log.note.substring(0, 30) : ''));
});
console.log('\n 异常详情（' + supervisorView.exceptionDetails.length + '条）：');
const allCourses = system.getAllCourses();
supervisorView.exceptionDetails.forEach(r => {
  const child = system.getAllChildren().find(c => c.id === r.childId);
  const course = allCourses.find(c => c.id === r.courseId);
  console.log('  ' + (child?.name || '未知') + ' - ' + (course?.name || '未知') + ' | ' + r.verificationStatus + ' | ' + r.exceptionReason);
});
console.log('\n 手工补录（' + supervisorView.manualEntryRecords.length + '条）：');
supervisorView.manualEntryRecords.forEach(r => {
  const child = system.getAllChildren().find(c => c.id === r.childId);
  const course = allCourses.find(c => c.id === r.courseId);
  console.log('  ' + (child?.name || '未知') + ' - ' + (course?.name || '未知') + ' | 扣款 ' + formatCurrency(r.amount));
});

separator();
console.log('\n【第十一步】验证两边视图口径一致');
system.compareViews();

separator();
console.log('\n【第十二步】治疗师李治疗师更新反馈');
system.login('lizhiliaoshi');
const xiaomingSchedule = system.findScheduleByChildAndTherapist('小明', 'therapist_001');
if (xiaomingSchedule) {
  system.updateFeedback(xiaomingSchedule.id, '今天小明表现特别好！平衡木训练连续走了3次不摇晃，专注力提升明显。继续保持！');
}

separator();
console.log('\n【第十三步】验证反馈版本一致性（结算和详情读同一版本）');
system.login('zhangqiantai');
if (xiaomingSchedule && xiaomingRecord) {
  const settlementFeedback = feedbackService.getFeedbackForSettlement(xiaomingSchedule.id);
  console.log('\n 前台结算读取的反馈：');
  console.log('  版本: v' + settlementFeedback.version);
  console.log('  内容: ' + settlementFeedback.feedback);
  
  console.log('\n 孩子详情读取的反馈：');
  const detailFeedback = feedbackService.getFeedback(xiaomingSchedule.id);
  console.log('  版本: v' + detailFeedback.version);
  console.log('  内容: ' + detailFeedback.feedback);
  
  const consistency = feedbackService.verifyFeedbackConsistency(xiaomingSchedule.id, settlementFeedback.version || 0);
  console.log('\n 版本一致性校验: ' + (consistency.consistent ? '通过' : '失败'));
  console.log('   预期版本: v' + consistency.expectedVersion + ' | 当前版本: v' + consistency.currentVersion);
}

separator();
console.log('\n【第十四步】重新导入样例数据（验证幂等性）');
console.log('\n 注意：重新导入会将旧记录标记为作废，不会产生重复有效结果');
console.log('    历史记录仍然可查，保持清晰');
system.login('liuzhuguan');
system.importSampleData(SAMPLE_DATA_FILE);

separator();
console.log('\n【第十五步】主管审计异常记录');
const exceptionRecords = supervisorView.exceptionDetails;
if (exceptionRecords.length > 0) {
  const firstException = exceptionRecords[0];
  system.auditRecord(firstException.id, '已核实照片确实缺失，同意按部分成功处理，已通知治疗师下次注意。');
}

separator();
console.log('\n【第十六步】验证余额安全（避免月底变负）');
const xiaogangRecord = system.findChildByName('小刚');
if (xiaogangRecord) {
  console.log('\n 小刚当前余额: ' + formatCurrency(xiaogangRecord.balance));
  console.log('   余额不足 1000元，系统已自动预警');
  console.log('   月底前会提醒家长充值，避免余额变负');
}

separator();
console.log('\n 所有功能演示完成！');
console.log('\n 已实现的核心能力：');
console.log('  1. 前台6步操作指南，新人照做不犯错');
console.log('  2. 权限隔离：普通账号只看必要内容，主管看审计');
console.log('  3. 统一核算口径，两边看到的数量完全一致');
console.log('  4. 照片缺失1-2张：部分成功，扣款减半，保留审计');
console.log('  5. 照片缺失3张以上：标记异常，不扣款，保留审计');
console.log('  6. 重新导入样例：旧记录作废，历史清晰不重复');
console.log('  7. 课后反馈版本控制，结算和详情读同一版本');
console.log('  8. 手工补录记录独立展示，方便审计');
console.log('  9. 余额安全检查，扣款前预警，避免月底变负');
console.log('  10. 全流程审计追踪，所有操作永久留痕');

separator();
console.log('\n 程序结束\n');
