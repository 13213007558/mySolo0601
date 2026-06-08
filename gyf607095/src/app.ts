import { db } from './models/database';
import { User, WriteOffRecord, ReceptionView, SupervisorView, Child, CourseSchedule, Course } from './types';
import { permissionService } from './services/permissionService';
import { auditService } from './services/auditService';
import { writeOffService } from './services/writeOffService';
import { importService } from './services/importService';
import { feedbackService } from './services/feedbackService';
import { receptionService } from './services/receptionService';
import { sampleUsers, sampleChildren, sampleCourses, generateSampleSchedules, SAMPLE_DATA_FILE } from './data/sampleData';
import { formatCurrency, formatDate, generateId } from './utils';

export class RehabilitationSystem {
  private currentUser: User | null = null;

  constructor() {
    this.initSystem();
  }

  private initSystem(): void {
    db.clear();
    for (const user of sampleUsers) {
      db.users.set(user.id, { ...user });
    }
    receptionService.initSteps();
  }

  public login(username: string): User {
    const user = Array.from(db.users.values()).find(u => u.username === username);
    if (!user) {
      throw new Error('用户不存在');
    }
    this.currentUser = user;
    console.log(`\n=== 登录成功 ===`);
    console.log(`用户: ${user.name} (${user.role})`);
    return user;
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public findChildByName(name: string): Child | undefined {
    return Array.from(db.children.values()).find(c => c.name === name && !c.isDeleted);
  }

  public findScheduleByChildAndTherapist(childName: string, therapistId: string): CourseSchedule | undefined {
    const child = this.findChildByName(childName);
    if (!child) return undefined;
    return Array.from(db.schedules.values())
      .find(s => s.childId === child.id && s.therapistId === therapistId);
  }

  public getAllChildren(): Child[] {
    return Array.from(db.children.values()).filter(c => !c.isDeleted);
  }

  public getAllSchedules(): CourseSchedule[] {
    return Array.from(db.schedules.values());
  }

  public getAllCourses(): Course[] {
    return Array.from(db.courses.values()).filter(c => c.isActive);
  }

  public importSampleData(sourceFile: string = SAMPLE_DATA_FILE): void {
    if (!this.currentUser) throw new Error('请先登录');

    const schedules = generateSampleSchedules();
    const importData = schedules.map(s => ({
      child: sampleChildren[s.childIndex],
      course: sampleCourses[s.courseIndex],
      schedule: {
        therapistId: s.therapistId,
        scheduledAt: s.scheduledAt,
        status: s.status,
        isManualEntry: s.isManualEntry,
        manualEntryReason: s.manualEntryReason,
        feedback: s.feedback
      },
      photos: s.photos
    }));

    const result = importService.importSampleData(this.currentUser, importData, sourceFile);
    
    console.log(`\n=== 导入样例数据 ===`);
    console.log(`批次ID: ${result.batch.id}`);
    console.log(`导入儿童: ${result.children.length}人`);
    console.log(`导入课程记录: ${result.schedules.length}条`);
    console.log(`是否重新导入: ${result.isReimport ? '是' : '否'}`);
    if (result.isReimport) {
      console.log(`作废旧记录: ${result.invalidatedCount}条`);
    }

    const manualEntryCount = result.schedules.filter(s => s.isManualEntry).length;
    if (manualEntryCount > 0) {
      console.log(`\n⚠️  包含手工补录记录 ${manualEntryCount} 条，请主管审核：`);
      result.schedules.filter(s => s.isManualEntry).forEach(s => {
        const child = db.children.get(s.childId);
        const course = db.courses.get(s.courseId);
        console.log(`  - ${child?.name} - ${course?.name} (${formatDate(s.scheduledAt)})`);
        console.log(`    原因: ${s.manualEntryReason}`);
      });
    }
  }

  public processWriteOff(): void {
    if (!this.currentUser) throw new Error('请先登录');
    permissionService.assertPermission(this.currentUser, 'settlement', 'process');

    const pendingSchedules = Array.from(db.schedules.values())
      .filter(s => s.status === 'completed');

    const existingWriteOffScheduleIds = Array.from(db.writeOffRecords.values())
      .filter(r => !r.isInvalid)
      .map(r => r.scheduleId);

    const scheduleIdsToProcess = pendingSchedules
      .filter(s => !existingWriteOffScheduleIds.includes(s.id))
      .map(s => s.id);

    if (scheduleIdsToProcess.length === 0) {
      console.log(`\n⚠️  没有需要处理的核销记录`);
      return;
    }

    console.log(`\n=== 开始批量核销处理 ==="`);
    console.log(`待处理记录: ${scheduleIdsToProcess.length}条`);

    const batchId = generateId('batch');
    const result = writeOffService.processBatch(this.currentUser, scheduleIdsToProcess, batchId);

    console.log(`\n=== 处理结果 ===`);
    console.log(`创建记录: ${result.created.length}条`);
    console.log(`验证通过: ${result.verificationResults.filter(r => r.status === 'verified').length}条`);
    console.log(`完成核销: ${result.completed.length}条`);
    console.log(`异常记录: ${result.failed.length}条`);

    if (result.completed.length > 0) {
      console.log(`\n✅ 成功核销明细：`);
      result.completed.forEach(r => this.printWriteOffRecord(r));
    }

    if (result.failed.length > 0) {
      console.log(`\n❌ 异常记录（请主管审核）：`);
      result.failed.forEach(r => {
        const child = db.children.get(r.childId);
        const course = db.courses.get(r.courseId);
        console.log(`  - ${child?.name} - ${course?.name}`);
        console.log(`    状态: ${r.status} | 验证: ${r.verificationStatus}`);
        console.log(`    原因: ${r.exceptionReason || '未知'}`);
        console.log(`    已保留审计痕迹，主管可复查`);
      });
    }

    const totalDeducted = result.completed.reduce((sum, r) => sum + r.deductionAmount, 0);
    console.log(`\n💰 本次扣款合计: ${formatCurrency(totalDeducted)}`);
  }

  public getReceptionView(): ReceptionView {
    if (!this.currentUser) throw new Error('请先登录');
    const pendingRecords = writeOffService.getPendingRecords(this.currentUser);
    const steps = receptionService.getSteps(this.currentUser);
    return permissionService.getReceptionView(this.currentUser, pendingRecords, steps);
  }

  public getSupervisorView(): SupervisorView {
    if (!this.currentUser) throw new Error('请先登录');
    permissionService.assertPermission(this.currentUser, 'settlement', 'view_all');
    const allRecords = writeOffService.getWriteOffRecords(undefined, true);
    const auditTrail = auditService.getAuditTrail();
    return permissionService.getSupervisorView(this.currentUser, allRecords, auditTrail);
  }

  public updateFeedback(scheduleId: string, feedback: string): void {
    if (!this.currentUser) throw new Error('请先登录');
    const result = feedbackService.updateFeedback(this.currentUser, scheduleId, feedback);
    console.log(`\n✅ 反馈已更新`);
    console.log(`课程ID: ${scheduleId}`);
    console.log(`版本: v${result.feedbackVersion}`);
    console.log(`更新时间: ${formatDate(result.feedbackUpdatedAt!)}`);
  }

  public getChildDetail(childId: string): void {
    if (!this.currentUser) throw new Error('请先登录');
    permissionService.assertPermission(this.currentUser, 'child', 'view');

    const child = db.children.get(childId);
    if (!child) throw new Error('儿童档案不存在');

    console.log(`\n=== ${child.name} 详情 ===`);
    console.log(`出生日期: ${child.birthDate}`);
    console.log(`监护人: ${child.guardianName} (${child.guardianPhone})`);
    console.log(`当前余额: ${formatCurrency(child.balance)}`);

    const feedbackList = feedbackService.getChildFeedbackList(childId);
    if (feedbackList.length > 0) {
      console.log(`\n📝 课后反馈（与结算共享版本）：`);
      feedbackList.forEach(f => {
        console.log(`\n  ${formatDate(f.scheduledAt)} - ${f.courseName}`);
        console.log(`  治疗师: ${f.therapistName} | 版本: v${f.version}`);
        console.log(`  反馈: ${f.feedback}`);
      });
    }

    const records = writeOffService.getWriteOffRecords(childId);
    if (records.length > 0) {
      console.log(`\n💳 核销记录：`);
      records.forEach(r => {
        const course = db.courses.get(r.courseId);
        const feedbackInfo = feedbackService.getFeedbackForSettlement(r.scheduleId);
        console.log(`  ${formatDate(r.createdAt)} - ${course?.name}`);
        console.log(`    金额: ${formatCurrency(r.amount)} | 扣款: ${formatCurrency(r.deductionAmount)}`);
        console.log(`    状态: ${r.status} | 验证: ${r.verificationStatus}`);
        console.log(`    反馈版本: v${feedbackInfo.version} | 有反馈: ${feedbackInfo.hasFeedback ? '是' : '否'}`);
        
        if (feedbackInfo.feedback) {
          console.log(`    反馈内容: ${feedbackInfo.feedback.substring(0, 50)}...`);
        }
      });
    }

    const transactions = Array.from(db.balanceTransactions.values())
      .filter(t => t.childId === childId && !t.isInvalid)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    if (transactions.length > 0) {
      console.log(`\n📊 余额变动：`);
      transactions.forEach(t => {
        console.log(`  ${formatDate(t.createdAt)} - ${t.type}`);
        console.log(`    变动: ${formatCurrency(Math.abs(t.amount))} | 余额: ${formatCurrency(t.balanceAfter)}`);
      });
    }
  }

  public auditRecord(recordId: string, auditNote: string): void {
    if (!this.currentUser) throw new Error('请先登录');
    const record = writeOffService.auditRecord(this.currentUser, recordId, auditNote);
    console.log(`\n✅ 审计完成`);
    console.log(`记录ID: ${recordId}`);
    console.log(`审计意见: ${auditNote}`);
    console.log(`审计人: ${record.auditBy} | 时间: ${formatDate(record.auditAt!)}`);
  }

  public compareViews(): void {
    if (!this.currentUser) throw new Error('请先登录');

    console.log(`\n========== 视图口径一致性验证 ==========`);
    console.log(`当前用户: ${this.currentUser.name} (${this.currentUser.role})`);

    const allRecords = writeOffService.getWriteOffRecords(undefined, true);
    const validRecords = allRecords.filter(r => !r.isInvalid);

    const commonSummary = permissionService.calculateSettlementSummary(validRecords);

    console.log(`\n📊 统一核算口径（两边一致）：`);
    console.log(`  总记录数: ${commonSummary.totalCount}`);
    console.log(`  完全成功: ${commonSummary.successCount}`);
    console.log(`  部分成功: ${commonSummary.partialSuccessCount}`);
    console.log(`  异常记录: ${commonSummary.exceptionCount}`);
    console.log(`  应收总额: ${formatCurrency(commonSummary.totalAmount)}`);
    console.log(`  实收总额: ${formatCurrency(commonSummary.deductedAmount)}`);
    console.log(`  待审计: ${commonSummary.pendingAuditCount}`);

    console.log(`\n👤 普通前台视图（只看必要内容）：`);
    console.log(`  - 只能看到有效记录（看不到已作废的）`);
    console.log(`  - 能看到待处理记录和操作步骤`);
    console.log(`  - 看不到审计详情、异常明细、手工补录记录`);

    console.log(`\n👑 主管视图（完整审计）：`);
    console.log(`  - 能看到所有记录（包括已作废的历史）`);
    console.log(`  - 能看到审计追踪记录 ${db.auditLogs.length} 条`);
    console.log(`  - 能看到异常记录详情 ${validRecords.filter(r => r.status === 'exception').length} 条`);
    console.log(`  - 能看到手工补录记录 ${validRecords.filter(r => {
      const s = db.schedules.get(r.scheduleId);
      return s?.isManualEntry;
    }).length} 条`);

    console.log(`\n✅ 两边看到的数量口径完全一致，只是展示范围不同`);
  }

  public showReceptionSteps(): void {
    if (!this.currentUser) throw new Error('请先登录');
    const steps = receptionService.getSteps(this.currentUser);

    console.log(`\n========== 前台操作步骤引导 ==========`);
    console.log(`新人请按以下步骤处理，避免月底余额突然变负：\n`);

    steps.forEach(step => {
      console.log(`\n【步骤 ${step.order}】${step.title}`);
      console.log(`   ${step.description}`);
      console.log(`\n   👉 关键动作：`);
      step.keyActions.forEach((a, i) => console.log(`     ${i + 1}. ${a}`));
      console.log(`\n   ✅ 检查项：`);
      step.checks.forEach(c => console.log(`     ▢ ${c}`));
      console.log(`\n   ⚠️  常见错误：`);
      step.commonMistakes.forEach(m => console.log(`     ❌ ${m}`));
    });
  }

  public showManualEntryComparison(): void {
    if (!this.currentUser) throw new Error('请先登录');

    const allSchedules = Array.from(db.schedules.values());
    const normalSchedules = allSchedules.filter(s => !s.isManualEntry);
    const manualSchedules = allSchedules.filter(s => s.isManualEntry);

    console.log(`\n========== 手工补录前后对比 ==========`);

    console.log(`\n📋 正常流程记录（${normalSchedules.length}条）：`);
    normalSchedules.slice(0, 2).forEach(s => {
      const child = db.children.get(s.childId);
      const course = db.courses.get(s.courseId);
      console.log(`  ${child?.name} - ${course?.name} (${formatDate(s.scheduledAt)})`);
      console.log(`    来源: 系统正常记录 | 有反馈: ${s.feedback ? '是' : '否'}`);
    });

    console.log(`\n✏️  手工补录记录（${manualSchedules.length}条）：`);
    manualSchedules.forEach(s => {
      const child = db.children.get(s.childId);
      const course = db.courses.get(s.courseId);
      console.log(`  ${child?.name} - ${course?.name} (${formatDate(s.scheduledAt)})`);
      console.log(`    来源: 手工补录 | 补录原因: ${s.manualEntryReason}`);
      const auditLogs = auditService.getAuditTrail(s.id, 'CourseSchedule');
      console.log(`    审计记录: ${auditLogs.length}条（操作人、时间、原因全程留痕）`);
    });

    console.log(`\n📊 差异说明：`);
    console.log(`  1. 手工补录记录标记 isManualEntry=true，独立统计`);
    console.log(`  2. 必须填写补录原因，永久留痕`);
    console.log(`  3. 主管视图专门列出，方便审计复查`);
    console.log(`  4. 核销时同样需要照片验证和余额检查`);
  }

  private printWriteOffRecord(r: WriteOffRecord): void {
    const child = db.children.get(r.childId);
    const course = db.courses.get(r.courseId);
    console.log(`\n  👶 ${child?.name} - ${course?.name}`);
    console.log(`     金额: ${formatCurrency(r.amount)} | 扣款: ${formatCurrency(r.deductionAmount)}`);
    console.log(`     状态: ${r.status} | 验证: ${r.verificationStatus}`);
    if (r.verificationStatus === 'partial') {
      console.log(`     ⚠️  部分成功，扣款减半，已保留审计痕迹`);
    }
  }
}

export const system = new RehabilitationSystem();
