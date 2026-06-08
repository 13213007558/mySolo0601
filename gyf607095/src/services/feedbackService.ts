import { User, CourseSchedule } from '../types';
import { db } from '../models/database';
import { now } from '../utils';
import { permissionService } from './permissionService';
import { auditService } from './auditService';

export class FeedbackService {
  public updateFeedback(
    operator: User,
    scheduleId: string,
    feedback: string
  ): CourseSchedule {
    permissionService.assertPermission(operator, 'schedule', 'addFeedback');

    const schedule = db.schedules.get(scheduleId);
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
    schedule.feedbackUpdatedAt = now();

    db.schedules.set(scheduleId, schedule);
    auditService.logFeedbackUpdate(operator, scheduleId, schedule.feedbackVersion, feedback);

    return schedule;
  }

  public getFeedback(scheduleId: string): {
    feedback: string | undefined;
    version: number | undefined;
    updatedAt: string | undefined;
    therapistName: string | undefined;
  } {
    const schedule = db.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error(`课程记录不存在: ${scheduleId}`);
    }

    const therapist = db.users.get(schedule.therapistId);

    return {
      feedback: schedule.feedback,
      version: schedule.feedbackVersion,
      updatedAt: schedule.feedbackUpdatedAt,
      therapistName: therapist?.name
    };
  }

  public getChildFeedbackList(childId: string): Array<{
    scheduleId: string;
    courseName: string | undefined;
    scheduledAt: string;
    feedback: string | undefined;
    version: number | undefined;
    updatedAt: string | undefined;
    therapistName: string | undefined;
  }> {
    const childSchedules = Array.from(db.schedules.values())
      .filter(s => s.childId === childId && s.status === 'completed')
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

    return childSchedules.map(schedule => {
      const course = db.courses.get(schedule.courseId);
      const therapist = db.users.get(schedule.therapistId);
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

  public getFeedbackForSettlement(scheduleId: string): {
    feedback: string | undefined;
    version: number | undefined;
    hasFeedback: boolean;
  } {
    const schedule = db.schedules.get(scheduleId);
    if (!schedule) {
      return { feedback: undefined, version: undefined, hasFeedback: false };
    }

    return {
      feedback: schedule.feedback,
      version: schedule.feedbackVersion,
      hasFeedback: !!schedule.feedback && schedule.feedback.trim().length > 0
    };
  }

  public verifyFeedbackConsistency(scheduleId: string, expectedVersion: number): {
    consistent: boolean;
    currentVersion: number | undefined;
    expectedVersion: number;
  } {
    const schedule = db.schedules.get(scheduleId);
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

export const feedbackService = new FeedbackService();
