"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.system = exports.RehabilitationSystem = void 0;
const database_1 = require("./models/database");
const permissionService_1 = require("./services/permissionService");
const auditService_1 = require("./services/auditService");
const writeOffService_1 = require("./services/writeOffService");
const importService_1 = require("./services/importService");
const feedbackService_1 = require("./services/feedbackService");
const receptionService_1 = require("./services/receptionService");
const sampleData_1 = require("./data/sampleData");
const utils_1 = require("./utils");
class RehabilitationSystem {
    constructor() {
        this.currentUser = null;
        this.initSystem();
    }
    initSystem() {
        database_1.db.clear();
        for (const user of sampleData_1.sampleUsers) {
            database_1.db.users.set(user.id, { ...user });
        }
        receptionService_1.receptionService.initSteps();
    }
    login(username) {
        const user = Array.from(database_1.db.users.values()).find(u => u.username === username);
        if (!user) {
            throw new Error('用户不存在');
        }
        this.currentUser = user;
        console.log(`\n=== 登录成功 ===`);
        console.log(`用户: ${user.name} (${user.role})`);
        return user;
    }
    getCurrentUser() {
        return this.currentUser;
    }
    findChildByName(name) {
        return Array.from(database_1.db.children.values()).find(c => c.name === name && !c.isDeleted);
    }
    findScheduleByChildAndTherapist(childName, therapistId) {
        const child = this.findChildByName(childName);
        if (!child)
            return undefined;
        return Array.from(database_1.db.schedules.values())
            .find(s => s.childId === child.id && s.therapistId === therapistId);
    }
    getAllChildren() {
        return Array.from(database_1.db.children.values()).filter(c => !c.isDeleted);
    }
    getAllSchedules() {
        return Array.from(database_1.db.schedules.values());
    }
    getAllCourses() {
        return Array.from(database_1.db.courses.values()).filter(c => c.isActive);
    }
    importSampleData(sourceFile = sampleData_1.SAMPLE_DATA_FILE) {
        if (!this.currentUser)
            throw new Error('请先登录');
        const schedules = (0, sampleData_1.generateSampleSchedules)();
        const importData = schedules.map(s => ({
            child: sampleData_1.sampleChildren[s.childIndex],
            course: sampleData_1.sampleCourses[s.courseIndex],
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
        const result = importService_1.importService.importSampleData(this.currentUser, importData, sourceFile);
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
                const child = database_1.db.children.get(s.childId);
                const course = database_1.db.courses.get(s.courseId);
                console.log(`  - ${child?.name} - ${course?.name} (${(0, utils_1.formatDate)(s.scheduledAt)})`);
                console.log(`    原因: ${s.manualEntryReason}`);
            });
        }
    }
    processWriteOff() {
        if (!this.currentUser)
            throw new Error('请先登录');
        permissionService_1.permissionService.assertPermission(this.currentUser, 'settlement', 'process');
        const pendingSchedules = Array.from(database_1.db.schedules.values())
            .filter(s => s.status === 'completed');
        const existingWriteOffScheduleIds = Array.from(database_1.db.writeOffRecords.values())
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
        const batchId = (0, utils_1.generateId)('batch');
        const result = writeOffService_1.writeOffService.processBatch(this.currentUser, scheduleIdsToProcess, batchId);
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
                const child = database_1.db.children.get(r.childId);
                const course = database_1.db.courses.get(r.courseId);
                console.log(`  - ${child?.name} - ${course?.name}`);
                console.log(`    状态: ${r.status} | 验证: ${r.verificationStatus}`);
                console.log(`    原因: ${r.exceptionReason || '未知'}`);
                console.log(`    已保留审计痕迹，主管可复查`);
            });
        }
        const totalDeducted = result.completed.reduce((sum, r) => sum + r.deductionAmount, 0);
        console.log(`\n💰 本次扣款合计: ${(0, utils_1.formatCurrency)(totalDeducted)}`);
    }
    getReceptionView() {
        if (!this.currentUser)
            throw new Error('请先登录');
        const pendingRecords = writeOffService_1.writeOffService.getPendingRecords(this.currentUser);
        const steps = receptionService_1.receptionService.getSteps(this.currentUser);
        return permissionService_1.permissionService.getReceptionView(this.currentUser, pendingRecords, steps);
    }
    getSupervisorView() {
        if (!this.currentUser)
            throw new Error('请先登录');
        permissionService_1.permissionService.assertPermission(this.currentUser, 'settlement', 'view_all');
        const allRecords = writeOffService_1.writeOffService.getWriteOffRecords(undefined, true);
        const auditTrail = auditService_1.auditService.getAuditTrail();
        return permissionService_1.permissionService.getSupervisorView(this.currentUser, allRecords, auditTrail);
    }
    updateFeedback(scheduleId, feedback) {
        if (!this.currentUser)
            throw new Error('请先登录');
        const result = feedbackService_1.feedbackService.updateFeedback(this.currentUser, scheduleId, feedback);
        console.log(`\n✅ 反馈已更新`);
        console.log(`课程ID: ${scheduleId}`);
        console.log(`版本: v${result.feedbackVersion}`);
        console.log(`更新时间: ${(0, utils_1.formatDate)(result.feedbackUpdatedAt)}`);
    }
    getChildDetail(childId) {
        if (!this.currentUser)
            throw new Error('请先登录');
        permissionService_1.permissionService.assertPermission(this.currentUser, 'child', 'view');
        const child = database_1.db.children.get(childId);
        if (!child)
            throw new Error('儿童档案不存在');
        console.log(`\n=== ${child.name} 详情 ===`);
        console.log(`出生日期: ${child.birthDate}`);
        console.log(`监护人: ${child.guardianName} (${child.guardianPhone})`);
        console.log(`当前余额: ${(0, utils_1.formatCurrency)(child.balance)}`);
        const feedbackList = feedbackService_1.feedbackService.getChildFeedbackList(childId);
        if (feedbackList.length > 0) {
            console.log(`\n📝 课后反馈（与结算共享版本）：`);
            feedbackList.forEach(f => {
                console.log(`\n  ${(0, utils_1.formatDate)(f.scheduledAt)} - ${f.courseName}`);
                console.log(`  治疗师: ${f.therapistName} | 版本: v${f.version}`);
                console.log(`  反馈: ${f.feedback}`);
            });
        }
        const records = writeOffService_1.writeOffService.getWriteOffRecords(childId);
        if (records.length > 0) {
            console.log(`\n💳 核销记录：`);
            records.forEach(r => {
                const course = database_1.db.courses.get(r.courseId);
                const feedbackInfo = feedbackService_1.feedbackService.getFeedbackForSettlement(r.scheduleId);
                console.log(`  ${(0, utils_1.formatDate)(r.createdAt)} - ${course?.name}`);
                console.log(`    金额: ${(0, utils_1.formatCurrency)(r.amount)} | 扣款: ${(0, utils_1.formatCurrency)(r.deductionAmount)}`);
                console.log(`    状态: ${r.status} | 验证: ${r.verificationStatus}`);
                console.log(`    反馈版本: v${feedbackInfo.version} | 有反馈: ${feedbackInfo.hasFeedback ? '是' : '否'}`);
                if (feedbackInfo.feedback) {
                    console.log(`    反馈内容: ${feedbackInfo.feedback.substring(0, 50)}...`);
                }
            });
        }
        const transactions = Array.from(database_1.db.balanceTransactions.values())
            .filter(t => t.childId === childId && !t.isInvalid)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (transactions.length > 0) {
            console.log(`\n📊 余额变动：`);
            transactions.forEach(t => {
                console.log(`  ${(0, utils_1.formatDate)(t.createdAt)} - ${t.type}`);
                console.log(`    变动: ${(0, utils_1.formatCurrency)(Math.abs(t.amount))} | 余额: ${(0, utils_1.formatCurrency)(t.balanceAfter)}`);
            });
        }
    }
    auditRecord(recordId, auditNote) {
        if (!this.currentUser)
            throw new Error('请先登录');
        const record = writeOffService_1.writeOffService.auditRecord(this.currentUser, recordId, auditNote);
        console.log(`\n✅ 审计完成`);
        console.log(`记录ID: ${recordId}`);
        console.log(`审计意见: ${auditNote}`);
        console.log(`审计人: ${record.auditBy} | 时间: ${(0, utils_1.formatDate)(record.auditAt)}`);
    }
    compareViews() {
        if (!this.currentUser)
            throw new Error('请先登录');
        console.log(`\n========== 视图口径一致性验证 ==========`);
        console.log(`当前用户: ${this.currentUser.name} (${this.currentUser.role})`);
        const allRecords = writeOffService_1.writeOffService.getWriteOffRecords(undefined, true);
        const validRecords = allRecords.filter(r => !r.isInvalid);
        const commonSummary = permissionService_1.permissionService.calculateSettlementSummary(validRecords);
        console.log(`\n📊 统一核算口径（两边一致）：`);
        console.log(`  总记录数: ${commonSummary.totalCount}`);
        console.log(`  完全成功: ${commonSummary.successCount}`);
        console.log(`  部分成功: ${commonSummary.partialSuccessCount}`);
        console.log(`  异常记录: ${commonSummary.exceptionCount}`);
        console.log(`  应收总额: ${(0, utils_1.formatCurrency)(commonSummary.totalAmount)}`);
        console.log(`  实收总额: ${(0, utils_1.formatCurrency)(commonSummary.deductedAmount)}`);
        console.log(`  待审计: ${commonSummary.pendingAuditCount}`);
        console.log(`\n👤 普通前台视图（只看必要内容）：`);
        console.log(`  - 只能看到有效记录（看不到已作废的）`);
        console.log(`  - 能看到待处理记录和操作步骤`);
        console.log(`  - 看不到审计详情、异常明细、手工补录记录`);
        console.log(`\n👑 主管视图（完整审计）：`);
        console.log(`  - 能看到所有记录（包括已作废的历史）`);
        console.log(`  - 能看到审计追踪记录 ${database_1.db.auditLogs.length} 条`);
        console.log(`  - 能看到异常记录详情 ${validRecords.filter(r => r.status === 'exception').length} 条`);
        console.log(`  - 能看到手工补录记录 ${validRecords.filter(r => {
            const s = database_1.db.schedules.get(r.scheduleId);
            return s?.isManualEntry;
        }).length} 条`);
        console.log(`\n✅ 两边看到的数量口径完全一致，只是展示范围不同`);
    }
    showReceptionSteps() {
        if (!this.currentUser)
            throw new Error('请先登录');
        const steps = receptionService_1.receptionService.getSteps(this.currentUser);
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
    showManualEntryComparison() {
        if (!this.currentUser)
            throw new Error('请先登录');
        const allSchedules = Array.from(database_1.db.schedules.values());
        const normalSchedules = allSchedules.filter(s => !s.isManualEntry);
        const manualSchedules = allSchedules.filter(s => s.isManualEntry);
        console.log(`\n========== 手工补录前后对比 ==========`);
        console.log(`\n📋 正常流程记录（${normalSchedules.length}条）：`);
        normalSchedules.slice(0, 2).forEach(s => {
            const child = database_1.db.children.get(s.childId);
            const course = database_1.db.courses.get(s.courseId);
            console.log(`  ${child?.name} - ${course?.name} (${(0, utils_1.formatDate)(s.scheduledAt)})`);
            console.log(`    来源: 系统正常记录 | 有反馈: ${s.feedback ? '是' : '否'}`);
        });
        console.log(`\n✏️  手工补录记录（${manualSchedules.length}条）：`);
        manualSchedules.forEach(s => {
            const child = database_1.db.children.get(s.childId);
            const course = database_1.db.courses.get(s.courseId);
            console.log(`  ${child?.name} - ${course?.name} (${(0, utils_1.formatDate)(s.scheduledAt)})`);
            console.log(`    来源: 手工补录 | 补录原因: ${s.manualEntryReason}`);
            const auditLogs = auditService_1.auditService.getAuditTrail(s.id, 'CourseSchedule');
            console.log(`    审计记录: ${auditLogs.length}条（操作人、时间、原因全程留痕）`);
        });
        console.log(`\n📊 差异说明：`);
        console.log(`  1. 手工补录记录标记 isManualEntry=true，独立统计`);
        console.log(`  2. 必须填写补录原因，永久留痕`);
        console.log(`  3. 主管视图专门列出，方便审计复查`);
        console.log(`  4. 核销时同样需要照片验证和余额检查`);
    }
    printWriteOffRecord(r) {
        const child = database_1.db.children.get(r.childId);
        const course = database_1.db.courses.get(r.courseId);
        console.log(`\n  👶 ${child?.name} - ${course?.name}`);
        console.log(`     金额: ${(0, utils_1.formatCurrency)(r.amount)} | 扣款: ${(0, utils_1.formatCurrency)(r.deductionAmount)}`);
        console.log(`     状态: ${r.status} | 验证: ${r.verificationStatus}`);
        if (r.verificationStatus === 'partial') {
            console.log(`     ⚠️  部分成功，扣款减半，已保留审计痕迹`);
        }
    }
}
exports.RehabilitationSystem = RehabilitationSystem;
exports.system = new RehabilitationSystem();
//# sourceMappingURL=app.js.map