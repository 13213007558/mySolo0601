"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importService = exports.ImportService = void 0;
const database_1 = require("../models/database");
const utils_1 = require("../utils");
const permissionService_1 = require("./permissionService");
const auditService_1 = require("./auditService");
const writeOffService_1 = require("./writeOffService");
class ImportService {
    generateScheduleKey(schedule) {
        return `${schedule.childId}_${schedule.courseId}_${schedule.scheduledAt}`;
    }
    findExistingBatch(sourceFile) {
        return Array.from(database_1.db.importBatches.values())
            .find(b => b.sourceFile === sourceFile);
    }
    invalidateOldBatchRecords(oldBatch, operator) {
        const invalidatedIds = [];
        const oldRecords = Array.from(database_1.db.writeOffRecords.values())
            .filter(r => r.batchId === oldBatch.id && !r.isInvalid);
        for (const record of oldRecords) {
            try {
                writeOffService_1.writeOffService.invalidateRecord(operator, record.id, '重新导入样例数据，旧记录作废');
                invalidatedIds.push(record.id);
            }
            catch (e) {
                record.isInvalid = true;
                record.invalidReason = '重新导入样例数据，旧记录作废';
                record.invalidAt = (0, utils_1.now)();
                database_1.db.writeOffRecords.set(record.id, record);
                invalidatedIds.push(record.id);
            }
        }
        const oldSchedules = Array.from(database_1.db.schedules.values())
            .filter(s => s.createdAt === oldBatch.importedAt);
        for (const s of oldSchedules) {
            const oldRecordsForSchedule = Array.from(database_1.db.writeOffRecords.values())
                .filter(r => r.scheduleId === s.id && !r.isInvalid);
            for (const r of oldRecordsForSchedule) {
                if (!invalidatedIds.includes(r.id)) {
                    r.isInvalid = true;
                    r.invalidReason = '重新导入样例数据，旧记录作废';
                    r.invalidAt = (0, utils_1.now)();
                    database_1.db.writeOffRecords.set(r.id, r);
                    invalidatedIds.push(r.id);
                }
            }
        }
        return invalidatedIds;
    }
    importSampleData(operator, sampleData, sourceFile) {
        permissionService_1.permissionService.assertPermission(operator, 'import', 'import');
        const existingBatch = this.findExistingBatch(sourceFile);
        const isReimport = !!existingBatch;
        let invalidatedOldRecords = [];
        let previousBatchId;
        if (existingBatch) {
            permissionService_1.permissionService.assertPermission(operator, 'import', 'reimport');
            invalidatedOldRecords = this.invalidateOldBatchRecords(existingBatch, operator);
            previousBatchId = existingBatch.id;
        }
        const batchId = (0, utils_1.generateId)('batch');
        const children = [];
        const schedules = [];
        const processedKeys = new Set();
        for (const item of sampleData) {
            let child;
            if (item.child.id) {
                child = database_1.db.children.get(item.child.id);
            }
            if (!child && item.child.name) {
                child = Array.from(database_1.db.children.values())
                    .find(c => c.name === item.child.name && !c.isDeleted);
            }
            if (!child) {
                child = {
                    id: item.child.id || (0, utils_1.generateId)('child'),
                    name: item.child.name || '未命名',
                    birthDate: item.child.birthDate || '2023-01-01',
                    guardianName: item.child.guardianName || '未填写',
                    guardianPhone: item.child.guardianPhone || '未填写',
                    balance: item.child.balance ?? 5000,
                    createdAt: (0, utils_1.now)(),
                    isDeleted: false
                };
                database_1.db.children.set(child.id, child);
            }
            children.push(child);
            let course;
            if (item.course.id) {
                course = database_1.db.courses.get(item.course.id);
            }
            if (!course && item.course.name) {
                course = Array.from(database_1.db.courses.values())
                    .find(c => c.name === item.course.name && c.isActive);
            }
            if (!course) {
                course = {
                    id: item.course.id || (0, utils_1.generateId)('course'),
                    name: item.course.name || '康复训练课',
                    price: item.course.price ?? 300,
                    durationMinutes: item.course.durationMinutes ?? 45,
                    type: item.course.type || 'rehabilitation',
                    isActive: true
                };
                database_1.db.courses.set(course.id, course);
            }
            const scheduleKey = this.generateScheduleKey({
                ...item.schedule,
                childId: child.id,
                courseId: course.id
            });
            if (processedKeys.has(scheduleKey)) {
                continue;
            }
            processedKeys.add(scheduleKey);
            let schedule = Array.from(database_1.db.schedules.values())
                .find(s => s.childId === child.id &&
                s.courseId === course.id &&
                s.scheduledAt === item.schedule.scheduledAt &&
                !s.isManualEntry);
            if (schedule) {
                const existingSchedule = schedule;
                const hasValidRecord = Array.from(database_1.db.writeOffRecords.values())
                    .some(r => r.scheduleId === existingSchedule.id && !r.isInvalid);
                if (!hasValidRecord) {
                    existingSchedule.isManualEntry = item.schedule.isManualEntry || false;
                    existingSchedule.manualEntryReason = item.schedule.manualEntryReason;
                    existingSchedule.status = item.schedule.status || 'completed';
                    database_1.db.schedules.set(existingSchedule.id, existingSchedule);
                }
                schedule = existingSchedule;
            }
            else {
                schedule = {
                    id: item.schedule.id || (0, utils_1.generateId)('sched'),
                    childId: child.id,
                    courseId: course.id,
                    therapistId: item.schedule.therapistId || 'therapist_001',
                    scheduledAt: item.schedule.scheduledAt || (0, utils_1.now)(),
                    status: item.schedule.status || 'completed',
                    isManualEntry: item.schedule.isManualEntry || false,
                    manualEntryReason: item.schedule.manualEntryReason,
                    createdAt: (0, utils_1.now)(),
                    feedback: item.schedule.feedback,
                    feedbackVersion: item.schedule.feedback ? 1 : undefined,
                    feedbackUpdatedAt: item.schedule.feedback ? (0, utils_1.now)() : undefined
                };
                database_1.db.schedules.set(schedule.id, schedule);
            }
            schedules.push(schedule);
            for (let i = 0; i < item.photos.length; i++) {
                const photo = {
                    id: (0, utils_1.generateId)('photo'),
                    scheduleId: schedule.id,
                    uploadedAt: (0, utils_1.now)(),
                    uploadedBy: operator.id,
                    url: `/photos/${schedule.id}_${i + 1}.jpg`,
                    isMissing: item.photos[i].isMissing
                };
                database_1.db.photos.set(photo.id, photo);
            }
            if (schedule.isManualEntry) {
                auditService_1.auditService.logManualEntry(operator, schedule.id, schedule.manualEntryReason || '系统补录');
            }
        }
        const batch = {
            id: batchId,
            importedAt: (0, utils_1.now)(),
            importedBy: operator.id,
            recordCount: schedules.length,
            sourceFile,
            isReimport,
            previousBatchId,
            invalidatedOldRecords
        };
        database_1.db.importBatches.set(batchId, batch);
        auditService_1.auditService.logImport(operator, batchId, schedules.length, isReimport);
        return {
            batch,
            children,
            schedules,
            isReimport,
            invalidatedCount: invalidatedOldRecords.length
        };
    }
    getImportBatches() {
        return Array.from(database_1.db.importBatches.values())
            .sort((a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime());
    }
    getBatchRecords(batchId) {
        return Array.from(database_1.db.writeOffRecords.values())
            .filter(r => r.batchId === batchId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
}
exports.ImportService = ImportService;
exports.importService = new ImportService();
//# sourceMappingURL=importService.js.map