import { User, Child, Course, CourseSchedule, WriteOffRecord, ImportBatch } from '../types';
interface SampleDataItem {
    child: Partial<Child>;
    course: Partial<Course>;
    schedule: Partial<CourseSchedule>;
    photos: Array<{
        isMissing: boolean;
    }>;
}
export declare class ImportService {
    private generateScheduleKey;
    private findExistingBatch;
    private invalidateOldBatchRecords;
    importSampleData(operator: User, sampleData: SampleDataItem[], sourceFile: string): {
        batch: ImportBatch;
        children: Child[];
        schedules: CourseSchedule[];
        isReimport: boolean;
        invalidatedCount: number;
    };
    getImportBatches(): ImportBatch[];
    getBatchRecords(batchId: string): WriteOffRecord[];
}
export declare const importService: ImportService;
export {};
