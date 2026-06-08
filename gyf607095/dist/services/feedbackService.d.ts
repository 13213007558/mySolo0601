import { User, CourseSchedule } from '../types';
export declare class FeedbackService {
    updateFeedback(operator: User, scheduleId: string, feedback: string): CourseSchedule;
    getFeedback(scheduleId: string): {
        feedback: string | undefined;
        version: number | undefined;
        updatedAt: string | undefined;
        therapistName: string | undefined;
    };
    getChildFeedbackList(childId: string): Array<{
        scheduleId: string;
        courseName: string | undefined;
        scheduledAt: string;
        feedback: string | undefined;
        version: number | undefined;
        updatedAt: string | undefined;
        therapistName: string | undefined;
    }>;
    getFeedbackForSettlement(scheduleId: string): {
        feedback: string | undefined;
        version: number | undefined;
        hasFeedback: boolean;
    };
    verifyFeedbackConsistency(scheduleId: string, expectedVersion: number): {
        consistent: boolean;
        currentVersion: number | undefined;
        expectedVersion: number;
    };
}
export declare const feedbackService: FeedbackService;
