"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.permissionService = exports.PermissionService = void 0;
const database_1 = require("../models/database");
class PermissionService {
    hasPermission(user, resource, action) {
        const permissions = {
            reception: {
                writeOff: ['create', 'view', 'verify'],
                child: ['view', 'search'],
                schedule: ['view'],
                settlement: ['view', 'process'],
                step: ['view'],
                audit: ['view_summary']
            },
            therapist: {
                schedule: ['view', 'complete', 'addFeedback'],
                child: ['view'],
                writeOff: ['view']
            },
            supervisor: {
                writeOff: ['view', 'audit', 'invalidate', 'view_all'],
                audit: ['view', 'view_all'],
                child: ['view', 'edit', 'create'],
                course: ['view', 'edit', 'create'],
                settlement: ['view', 'view_all', 'audit'],
                import: ['import', 'reimport'],
                manual: ['create', 'view']
            }
        };
        const rolePermissions = permissions[user.role];
        if (!rolePermissions)
            return false;
        const resourcePermissions = rolePermissions[resource];
        if (!resourcePermissions)
            return false;
        return resourcePermissions.includes(action);
    }
    filterRecordsByRole(user, records) {
        if (user.role === 'supervisor') {
            return records;
        }
        return records.filter(r => !r.isInvalid);
    }
    calculateSettlementSummary(records) {
        const validRecords = records.filter(r => !r.isInvalid);
        const successCount = validRecords.filter(r => r.verificationStatus === 'success' && r.status === 'completed').length;
        const partialSuccessCount = validRecords.filter(r => r.verificationStatus === 'partial' && r.status === 'completed').length;
        const exceptionCount = validRecords.filter(r => r.status === 'exception').length;
        const totalAmount = validRecords.reduce((sum, r) => sum + r.amount, 0);
        const deductedAmount = validRecords.reduce((sum, r) => sum + r.deductionAmount, 0);
        const pendingAuditCount = validRecords.filter(r => r.status !== 'completed' && !r.isAudited).length;
        return {
            totalCount: validRecords.length,
            successCount,
            partialSuccessCount,
            exceptionCount,
            totalAmount,
            deductedAmount,
            pendingAuditCount
        };
    }
    getReceptionView(user, pendingRecords, steps) {
        if (user.role !== 'reception' && user.role !== 'supervisor') {
            throw new Error('无权限访问前台视图');
        }
        const viewableRecords = this.filterRecordsByRole(user, pendingRecords);
        const summary = this.calculateSettlementSummary(viewableRecords);
        return {
            summary,
            pendingRecords: viewableRecords.filter(r => r.status === 'pending' || r.status === 'verified'),
            steps
        };
    }
    getSupervisorView(user, allRecords, auditTrail) {
        if (user.role !== 'supervisor') {
            throw new Error('无权限访问主管视图');
        }
        const validRecords = this.filterRecordsByRole(user, allRecords);
        const summary = this.calculateSettlementSummary(validRecords);
        return {
            ...summary,
            auditTrail: auditTrail.slice(-50),
            exceptionDetails: validRecords.filter(r => r.status === 'exception' || r.verificationStatus === 'partial'),
            manualEntryRecords: validRecords.filter(r => {
                const schedule = database_1.db.schedules.get(r.scheduleId);
                return schedule?.isManualEntry;
            })
        };
    }
    assertPermission(user, resource, action) {
        if (!this.hasPermission(user, resource, action)) {
            throw new Error(`用户 ${user.name} (${user.role}) 无权限执行 ${action} 操作于 ${resource}`);
        }
    }
}
exports.PermissionService = PermissionService;
exports.permissionService = new PermissionService();
//# sourceMappingURL=permissionService.js.map