"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditService = exports.AuditService = void 0;
const database_1 = require("../models/database");
const utils_1 = require("../utils");
class AuditService {
    logAction(operator, action, targetType, targetId, note, oldValue, newValue) {
        const log = {
            id: (0, utils_1.generateId)('audit'),
            operatorId: operator.id,
            operatorName: operator.name,
            operatorRole: operator.role,
            action,
            targetType,
            targetId,
            oldValue,
            newValue,
            note,
            createdAt: (0, utils_1.now)(),
            ipAddress: '127.0.0.1'
        };
        database_1.db.auditLogs.push(log);
        return log;
    }
    logWriteOffCreation(operator, record) {
        this.logAction(operator, 'CREATE_WRITEOFF', 'WriteOffRecord', record.id, `创建核销记录，金额: ¥${record.amount}`, undefined, record);
    }
    logWriteOffVerification(operator, record, oldStatus) {
        this.logAction(operator, 'VERIFY_WRITEOFF', 'WriteOffRecord', record.id, `核销记录状态从 ${oldStatus} 变更为 ${record.status}`, { status: oldStatus }, { status: record.status, verificationStatus: record.verificationStatus });
    }
    logWriteOffPartialSuccess(operator, record, missingPhotos) {
        this.logAction(operator, 'PARTIAL_SUCCESS', 'WriteOffRecord', record.id, `部分成功，缺失照片: ${missingPhotos.join(', ')}。异常纳入汇总但保留审计痕迹。`, { hasPhoto: true, verificationStatus: 'success' }, { hasPhoto: false, verificationStatus: 'partial', missingPhotoIds: missingPhotos });
    }
    logWriteOffException(operator, record, reason) {
        this.logAction(operator, 'MARK_EXCEPTION', 'WriteOffRecord', record.id, `标记异常: ${reason}`, { status: record.status }, { status: 'exception', exceptionReason: reason });
    }
    logWriteOffAudit(operator, record, auditNote) {
        this.logAction(operator, 'AUDIT_WRITEOFF', 'WriteOffRecord', record.id, `主管审计: ${auditNote}`, { isAudited: false }, { isAudited: true, auditNote, auditBy: operator.name, auditAt: (0, utils_1.now)() });
    }
    logBalanceDeduction(operator, childId, amount, balanceBefore, balanceAfter) {
        this.logAction(operator, 'BALANCE_DEDUCT', 'Child', childId, `余额扣款 ¥${amount}，扣款前: ¥${balanceBefore}，扣款后: ¥${balanceAfter}`, { balance: balanceBefore }, { balance: balanceAfter });
    }
    logInvalidateRecord(operator, record, reason) {
        this.logAction(operator, 'INVALIDATE_RECORD', 'WriteOffRecord', record.id, `作废记录: ${reason}`, { isInvalid: false }, { isInvalid: true, invalidReason: reason, invalidAt: (0, utils_1.now)() });
    }
    logImport(operator, batchId, recordCount, isReimport) {
        const action = isReimport ? 'REIMPORT_DATA' : 'IMPORT_DATA';
        this.logAction(operator, action, 'ImportBatch', batchId, isReimport ? `重新导入样例数据，共 ${recordCount} 条，旧记录已作废` : `导入样例数据，共 ${recordCount} 条`);
    }
    logFeedbackUpdate(operator, scheduleId, version, feedback) {
        this.logAction(operator, 'UPDATE_FEEDBACK', 'CourseSchedule', scheduleId, `更新课后反馈，版本 v${version}`, undefined, { feedback, feedbackVersion: version, feedbackUpdatedAt: (0, utils_1.now)() });
    }
    logManualEntry(operator, scheduleId, reason) {
        this.logAction(operator, 'MANUAL_ENTRY', 'CourseSchedule', scheduleId, `手工补录课程记录，原因: ${reason}`);
    }
    getAuditTrail(targetId, targetType) {
        let logs = [...database_1.db.auditLogs];
        if (targetId) {
            logs = logs.filter(l => l.targetId === targetId);
        }
        if (targetType) {
            logs = logs.filter(l => l.targetType === targetType);
        }
        return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    getWriteOffAuditInfo(recordId) {
        const logs = this.getAuditTrail(recordId, 'WriteOffRecord');
        return {
            hasAuditTrail: logs.length > 0,
            auditLogs: logs
        };
    }
}
exports.AuditService = AuditService;
exports.auditService = new AuditService();
//# sourceMappingURL=auditService.js.map