"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeOffService = exports.WriteOffService = void 0;
const database_1 = require("../models/database");
const utils_1 = require("../utils");
const permissionService_1 = require("./permissionService");
const auditService_1 = require("./auditService");
class WriteOffService {
    checkBalanceSafety(child, deductionAmount) {
        if (child.balance - deductionAmount < 0) {
            throw new Error(`余额不足！当前余额: ¥${child.balance.toFixed(2)}，需扣款: ¥${deductionAmount.toFixed(2)}。月底前请充值，避免余额变负！`);
        }
    }
    createBalanceTransaction(child, amount, type, writeOffRecordId, operator, note) {
        const balanceBefore = child.balance;
        const balanceAfter = child.balance + (type === 'deduct' ? -amount : amount);
        const transaction = {
            id: (0, utils_1.generateId)('tx'),
            childId: child.id,
            writeOffRecordId,
            amount: type === 'deduct' ? amount : -amount,
            balanceBefore,
            balanceAfter,
            type,
            operatorId: operator.id,
            note,
            createdAt: (0, utils_1.now)(),
            isInvalid: false
        };
        database_1.db.balanceTransactions.set(transaction.id, transaction);
        child.balance = balanceAfter;
        database_1.db.children.set(child.id, child);
        if (type === 'deduct') {
            auditService_1.auditService.logBalanceDeduction(operator, child.id, amount, balanceBefore, balanceAfter);
        }
        return transaction;
    }
    verifyPhotos(scheduleId) {
        const allPhotos = Array.from(database_1.db.photos.values()).filter(p => p.scheduleId === scheduleId);
        const missingPhotos = allPhotos.filter(p => p.isMissing);
        const hasPhoto = missingPhotos.length === 0 && allPhotos.length > 0;
        return {
            hasPhoto,
            missingPhotoIds: missingPhotos.map(p => p.id),
            allPhotos
        };
    }
    createWriteOffRecord(operator, scheduleId, batchId) {
        permissionService_1.permissionService.assertPermission(operator, 'writeOff', 'create');
        const schedule = database_1.db.schedules.get(scheduleId);
        if (!schedule) {
            throw new Error(`课程记录不存在: ${scheduleId}`);
        }
        const child = database_1.db.children.get(schedule.childId);
        if (!child) {
            throw new Error(`儿童档案不存在: ${schedule.childId}`);
        }
        const course = database_1.db.courses.get(schedule.courseId);
        if (!course) {
            throw new Error(`课程类型不存在: ${schedule.courseId}`);
        }
        const existingRecord = Array.from(database_1.db.writeOffRecords.values())
            .find(r => r.scheduleId === scheduleId && !r.isInvalid);
        if (existingRecord) {
            throw new Error(`该课程已有有效核销记录，请勿重复操作: ${existingRecord.id}`);
        }
        const { hasPhoto, missingPhotoIds } = this.verifyPhotos(scheduleId);
        const amount = course.price;
        const deductionAmount = course.price;
        const record = {
            id: (0, utils_1.generateId)('wo'),
            scheduleId,
            childId: schedule.childId,
            courseId: schedule.courseId,
            amount,
            deductionAmount,
            status: 'pending',
            verificationStatus: 'pending',
            hasPhoto,
            missingPhotoIds,
            operatorId: operator.id,
            createdAt: (0, utils_1.now)(),
            isAudited: false,
            isInvalid: false,
            batchId
        };
        database_1.db.writeOffRecords.set(record.id, record);
        auditService_1.auditService.logWriteOffCreation(operator, record);
        return record;
    }
    verifyWriteOff(operator, recordId) {
        permissionService_1.permissionService.assertPermission(operator, 'writeOff', 'verify');
        const record = database_1.db.writeOffRecords.get(recordId);
        if (!record) {
            throw new Error(`核销记录不存在: ${recordId}`);
        }
        if (record.isInvalid) {
            throw new Error('该记录已作废，无法验证');
        }
        if (record.status !== 'pending') {
            throw new Error(`当前状态 ${record.status} 无法验证`);
        }
        const child = database_1.db.children.get(record.childId);
        if (!child) {
            throw new Error(`儿童档案不存在: ${record.childId}`);
        }
        const oldStatus = record.status;
        const { hasPhoto, missingPhotoIds } = this.verifyPhotos(record.scheduleId);
        record.hasPhoto = hasPhoto;
        record.missingPhotoIds = missingPhotoIds;
        record.verifiedBy = operator.id;
        record.verifiedAt = (0, utils_1.now)();
        if (hasPhoto) {
            record.verificationStatus = 'success';
            record.status = 'verified';
        }
        else if (missingPhotoIds.length > 0 && missingPhotoIds.length < 3) {
            record.verificationStatus = 'partial';
            record.status = 'verified';
            auditService_1.auditService.logWriteOffPartialSuccess(operator, record, missingPhotoIds);
        }
        else if (missingPhotoIds.length >= 3) {
            record.verificationStatus = 'failed';
            record.status = 'exception';
            record.exceptionReason = `缺失照片过多(${missingPhotoIds.length}张)，请补充后重试`;
            auditService_1.auditService.logWriteOffException(operator, record, record.exceptionReason);
        }
        else {
            record.verificationStatus = 'failed';
            record.status = 'exception';
            record.exceptionReason = '未找到任何照片记录';
            auditService_1.auditService.logWriteOffException(operator, record, record.exceptionReason);
        }
        database_1.db.writeOffRecords.set(record.id, record);
        auditService_1.auditService.logWriteOffVerification(operator, record, oldStatus);
        return record;
    }
    completeWriteOff(operator, recordId) {
        permissionService_1.permissionService.assertPermission(operator, 'settlement', 'process');
        const record = database_1.db.writeOffRecords.get(recordId);
        if (!record) {
            throw new Error(`核销记录不存在: ${recordId}`);
        }
        if (record.isInvalid) {
            throw new Error('该记录已作废，无法完成核销');
        }
        if (record.status !== 'verified') {
            throw new Error(`当前状态 ${record.status} 无法完成核销，请先验证`);
        }
        if (record.verificationStatus === 'failed') {
            throw new Error('验证失败的记录无法完成核销，请先处理异常');
        }
        const child = database_1.db.children.get(record.childId);
        if (!child) {
            throw new Error(`儿童档案不存在: ${record.childId}`);
        }
        const deductionAmount = record.verificationStatus === 'partial'
            ? Math.ceil(record.deductionAmount * 0.5)
            : record.deductionAmount;
        record.deductionAmount = deductionAmount;
        this.checkBalanceSafety(child, deductionAmount);
        this.createBalanceTransaction(child, deductionAmount, 'deduct', record.id, operator, `核销扣费 - ${record.verificationStatus === 'partial' ? '部分成功(50%)' : '全部成功'}`);
        record.status = 'completed';
        record.completedAt = (0, utils_1.now)();
        database_1.db.writeOffRecords.set(record.id, record);
        auditService_1.auditService.logAction(operator, 'COMPLETE_WRITEOFF', 'WriteOffRecord', record.id, `完成核销，扣款: ¥${deductionAmount.toFixed(2)}${record.verificationStatus === 'partial' ? ' (部分成功减半)' : ''}`, { status: 'verified' }, { status: 'completed', deductionAmount, completedAt: record.completedAt });
        return record;
    }
    auditRecord(operator, recordId, auditNote) {
        permissionService_1.permissionService.assertPermission(operator, 'writeOff', 'audit');
        const record = database_1.db.writeOffRecords.get(recordId);
        if (!record) {
            throw new Error(`核销记录不存在: ${recordId}`);
        }
        if (record.isAudited) {
            throw new Error('该记录已审计，请勿重复操作');
        }
        record.isAudited = true;
        record.auditNote = auditNote;
        record.auditBy = operator.name;
        record.auditAt = (0, utils_1.now)();
        database_1.db.writeOffRecords.set(record.id, record);
        auditService_1.auditService.logWriteOffAudit(operator, record, auditNote);
        return record;
    }
    invalidateRecord(operator, recordId, reason) {
        permissionService_1.permissionService.assertPermission(operator, 'writeOff', 'invalidate');
        const record = database_1.db.writeOffRecords.get(recordId);
        if (!record) {
            throw new Error(`核销记录不存在: ${recordId}`);
        }
        if (record.isInvalid) {
            throw new Error('该记录已作废');
        }
        record.isInvalid = true;
        record.invalidReason = reason;
        record.invalidAt = (0, utils_1.now)();
        database_1.db.writeOffRecords.set(record.id, record);
        auditService_1.auditService.logInvalidateRecord(operator, record, reason);
        if (record.status === 'completed') {
            const child = database_1.db.children.get(record.childId);
            if (child) {
                const refundAmount = record.deductionAmount;
                this.createBalanceTransaction(child, refundAmount, 'refund', record.id, operator, `作废记录退款: ${reason}`);
            }
        }
        return record;
    }
    processBatch(operator, scheduleIds, batchId) {
        const created = [];
        const verificationResults = [];
        const completed = [];
        const failed = [];
        for (const scheduleId of scheduleIds) {
            try {
                const record = this.createWriteOffRecord(operator, scheduleId, batchId);
                created.push(record);
                const verified = this.verifyWriteOff(operator, record.id);
                verificationResults.push(verified);
                if (verified.status === 'verified' && verified.verificationStatus !== 'failed') {
                    const completedRecord = this.completeWriteOff(operator, record.id);
                    completed.push(completedRecord);
                }
                else {
                    failed.push(verified);
                }
            }
            catch (error) {
                const lastRecord = created[created.length - 1];
                if (lastRecord) {
                    lastRecord.status = 'exception';
                    lastRecord.exceptionReason = error instanceof Error ? error.message : '未知错误';
                    failed.push(lastRecord);
                }
            }
        }
        return { created, verificationResults, completed, failed };
    }
    getWriteOffRecords(childId, includeInvalid = false) {
        let records = Array.from(database_1.db.writeOffRecords.values());
        if (childId) {
            records = records.filter(r => r.childId === childId);
        }
        if (!includeInvalid) {
            records = records.filter(r => !r.isInvalid);
        }
        return records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    getPendingRecords(operator) {
        permissionService_1.permissionService.assertPermission(operator, 'writeOff', 'view');
        const allRecords = this.getWriteOffRecords();
        return permissionService_1.permissionService.filterRecordsByRole(operator, allRecords)
            .filter(r => r.status === 'pending' || r.status === 'verified');
    }
}
exports.WriteOffService = WriteOffService;
exports.writeOffService = new WriteOffService();
//# sourceMappingURL=writeOffService.js.map