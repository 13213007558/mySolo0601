"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedbackService = exports.FeedbackService = void 0;
const database_1 = require("../models/database");
const utils_1 = require("../utils");
const permissionService_1 = require("./permissionService");
const auditService_1 = require("./auditService");
class FeedbackService {
    updateFeedback(operator, scheduleId, feedback) {
        permissionService_1.permissionService.assertPermission(operator, 'schedule', 'addFeedback');
        const schedule = database_1.db.schedules.get(scheduleId);
        if (!schedule) {
            throw new Error(`课程记录不存在: ${scheduleId}`);
        }
        if (schedule.status !== 'completed' && schedule.status !== 'scheduled') {
            throw new Error(`当前状态 ${schedule.status} 无法更新反馈`);
        }
        if (schedule.therapistId !== operator.id && operator.role !== 'supervisor') {
            throw new Error('只有负责该课程的治疗师或主管可以更新反馈');
        }
        schedule.feedback = feedback;
        schedule.feedbackVersion = (schedule.feedbackVersion || 0) + 1;
        schedule.feedbackUpdatedAt = (0, utils_1.now)();
        database_1.db.schedules.set(scheduleId, schedule);
        auditService_1.auditService.logFeedbackUpdate(operator, scheduleId, schedule.feedbackVersion, feedback);
        return schedule;
    }
    getFeedback(scheduleId) {
        const schedule = database_1.db.schedules.get(scheduleId);
        if (!schedule) {
            throw new Error(`课程记录不存在: ${scheduleId}`);
        }
        const therapist = database_1.db.users.get(schedule.therapistId);
        return {
            feedback: schedule.feedback,
            version: schedule.feedbackVersion,
            updatedAt: schedule.feedbackUpdatedAt,
            therapistName: therapist?.name
        };
    }
    getChildFeedbackList(childId) {
        const childSchedules = Array.from(database_1.db.schedules.values())
            .filter(s => s.childId === childId && s.status === 'completed')
            .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
        return childSchedules.map(schedule => {
            const course = database_1.db.courses.get(schedule.courseId);
            const therapist = database_1.db.users.get(schedule.therapistId);
            return {
                scheduleId: schedule.id,
                courseName: course?.name,
                scheduledAt: schedule.scheduledAt,
                feedback: schedule.feedback,
                version: schedule.feedbackVersion,
                updatedAt: schedule.feedbackUpdatedAt,
                therapistName: therapist?.name
            };
        });
    }
    getFeedbackForSettlement(scheduleId) {
        const schedule = database_1.db.schedules.get(scheduleId);
        if (!schedule) {
            return { feedback: undefined, version: undefined, hasFeedback: false };
        }
        return {
            feedback: schedule.feedback,
            version: schedule.feedbackVersion,
            hasFeedback: !!schedule.feedback && schedule.feedback.trim().length > 0
        };
    }
    verifyFeedbackConsistency(scheduleId, expectedVersion) {
        const schedule = database_1.db.schedules.get(scheduleId);
        if (!schedule) {
            return { consistent: false, currentVersion: undefined, expectedVersion };
        }
        return {
            consistent: schedule.feedbackVersion === expectedVersion,
            currentVersion: schedule.feedbackVersion,
            expectedVersion
        };
    }
}
exports.FeedbackService = FeedbackService;
exports.feedbackService = new FeedbackService();
//# sourceMappingURL=feedbackService.js.map