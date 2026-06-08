import { User, ReceptionView, SupervisorView, Child, CourseSchedule, Course } from './types';
export declare class RehabilitationSystem {
    private currentUser;
    constructor();
    private initSystem;
    login(username: string): User;
    getCurrentUser(): User | null;
    findChildByName(name: string): Child | undefined;
    findScheduleByChildAndTherapist(childName: string, therapistId: string): CourseSchedule | undefined;
    getAllChildren(): Child[];
    getAllSchedules(): CourseSchedule[];
    getAllCourses(): Course[];
    importSampleData(sourceFile?: string): void;
    processWriteOff(): void;
    getReceptionView(): ReceptionView;
    getSupervisorView(): SupervisorView;
    updateFeedback(scheduleId: string, feedback: string): void;
    getChildDetail(childId: string): void;
    auditRecord(recordId: string, auditNote: string): void;
    compareViews(): void;
    showReceptionSteps(): void;
    showManualEntryComparison(): void;
    private printWriteOffRecord;
}
export declare const system: RehabilitationSystem;
