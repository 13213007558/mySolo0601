import { User, Child, Course, CourseSchedule, Photo, WriteOffRecord, ImportBatch } from '../types';
import { db } from '../models/database';
import { generateId, now } from '../utils';
import { permissionService } from './permissionService';
import { auditService } from './auditService';
import { writeOffService } from './writeOffService';

interface SampleDataItem {
  child: Partial<Child>;
  course: Partial<Course>;
  schedule: Partial<CourseSchedule>;
  photos: Array<{ isMissing: boolean }>;
}

export class ImportService {
  private generateScheduleKey(schedule: Partial<CourseSchedule>): string {
    return `${schedule.childId}_${schedule.courseId}_${schedule.scheduledAt}`;
  }

  private findExistingBatch(sourceFile: string): ImportBatch | undefined {
    return Array.from(db.importBatches.values())
      .find(b => b.sourceFile === sourceFile);
  }

  private invalidateOldBatchRecords(oldBatch: ImportBatch, operator: User): string[] {
    const invalidatedIds: string[] = [];
    const oldRecords = Array.from(db.writeOffRecords.values())
      .filter(r => r.batchId === oldBatch.id && !r.isInvalid);

    for (const record of oldRecords) {
      try {
        writeOffService.invalidateRecord(operator, record.id, '重新导入样例数据，旧记录作废');
        invalidatedIds.push(record.id);
      } catch (e) {
        record.isInvalid = true;
        record.invalidReason = '重新导入样例数据，旧记录作废';
        record.invalidAt = now();
        db.writeOffRecords.set(record.id, record);
        invalidatedIds.push(record.id);
      }
    }

    const oldSchedules = Array.from(db.schedules.values())
      .filter(s => s.createdAt === oldBatch.importedAt);
    for (const s of oldSchedules) {
      const oldRecordsForSchedule = Array.from(db.writeOffRecords.values())
        .filter(r => r.scheduleId === s.id && !r.isInvalid);
      for (const r of oldRecordsForSchedule) {
        if (!invalidatedIds.includes(r.id)) {
          r.isInvalid = true;
          r.invalidReason = '重新导入样例数据，旧记录作废';
          r.invalidAt = now();
          db.writeOffRecords.set(r.id, r);
          invalidatedIds.push(r.id);
        }
      }
    }

    return invalidatedIds;
  }

  public importSampleData(operator: User, sampleData: SampleDataItem[], sourceFile: string): {
    batch: ImportBatch;
    children: Child[];
    schedules: CourseSchedule[];
    isReimport: boolean;
    invalidatedCount: number;
  } {
    permissionService.assertPermission(operator, 'import', 'import');

    const existingBatch = this.findExistingBatch(sourceFile);
    const isReimport = !!existingBatch;

    let invalidatedOldRecords: string[] = [];
    let previousBatchId: string | undefined;

    if (existingBatch) {
      permissionService.assertPermission(operator, 'import', 'reimport');
      invalidatedOldRecords = this.invalidateOldBatchRecords(existingBatch, operator);
      previousBatchId = existingBatch.id;
    }

    const batchId = generateId('batch');
    const children: Child[] = [];
    const schedules: CourseSchedule[] = [];
    const processedKeys = new Set<string>();

    for (const item of sampleData) {
      let child: Child | undefined;
      if (item.child.id) {
        child = db.children.get(item.child.id);
      }
      if (!child && item.child.name) {
        child = Array.from(db.children.values())
          .find(c => c.name === item.child.name && !c.isDeleted);
      }
      if (!child) {
        child = {
          id: item.child.id || generateId('child'),
          name: item.child.name || '未命名',
          birthDate: item.child.birthDate || '2023-01-01',
          guardianName: item.child.guardianName || '未填写',
          guardianPhone: item.child.guardianPhone || '未填写',
          balance: item.child.balance ?? 5000,
          createdAt: now(),
          isDeleted: false
        };
        db.children.set(child.id, child);
      }
      children.push(child);

      let course: Course | undefined;
      if (item.course.id) {
        course = db.courses.get(item.course.id);
      }
      if (!course && item.course.name) {
        course = Array.from(db.courses.values())
          .find(c => c.name === item.course.name && c.isActive);
      }
      if (!course) {
        course = {
          id: item.course.id || generateId('course'),
          name: item.course.name || '康复训练课',
          price: item.course.price ?? 300,
          durationMinutes: item.course.durationMinutes ?? 45,
          type: item.course.type || 'rehabilitation',
          isActive: true
        };
        db.courses.set(course.id, course);
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

      let schedule = Array.from(db.schedules.values())
        .find(s => 
          s.childId === child!.id && 
          s.courseId === course!.id && 
          s.scheduledAt === item.schedule.scheduledAt &&
          !s.isManualEntry
        );

      if (schedule) {
        const existingSchedule = schedule;
        const hasValidRecord = Array.from(db.writeOffRecords.values())
          .some(r => r.scheduleId === existingSchedule.id && !r.isInvalid);
        if (!hasValidRecord) {
          existingSchedule.isManualEntry = item.schedule.isManualEntry || false;
          existingSchedule.manualEntryReason = item.schedule.manualEntryReason;
          existingSchedule.status = item.schedule.status || 'completed';
          db.schedules.set(existingSchedule.id, existingSchedule);
        }
        schedule = existingSchedule;
      } else {
        schedule = {
          id: item.schedule.id || generateId('sched'),
          childId: child.id,
          courseId: course.id,
          therapistId: item.schedule.therapistId || 'therapist_001',
          scheduledAt: item.schedule.scheduledAt || now(),
          status: item.schedule.status || 'completed',
          isManualEntry: item.schedule.isManualEntry || false,
          manualEntryReason: item.schedule.manualEntryReason,
          createdAt: now(),
          feedback: item.schedule.feedback,
          feedbackVersion: item.schedule.feedback ? 1 : undefined,
          feedbackUpdatedAt: item.schedule.feedback ? now() : undefined
        };
        db.schedules.set(schedule.id, schedule);
      }
      schedules.push(schedule);

      for (let i = 0; i < item.photos.length; i++) {
        const photo: Photo = {
          id: generateId('photo'),
          scheduleId: schedule.id,
          uploadedAt: now(),
          uploadedBy: operator.id,
          url: `/photos/${schedule.id}_${i + 1}.jpg`,
          isMissing: item.photos[i].isMissing
        };
        db.photos.set(photo.id, photo);
      }

      if (schedule.isManualEntry) {
        auditService.logManualEntry(operator, schedule.id, schedule.manualEntryReason || '系统补录');
      }
    }

    const batch: ImportBatch = {
      id: batchId,
      importedAt: now(),
      importedBy: operator.id,
      recordCount: schedules.length,
      sourceFile,
      isReimport,
      previousBatchId,
      invalidatedOldRecords
    };
    db.importBatches.set(batchId, batch);

    auditService.logImport(operator, batchId, schedules.length, isReimport);

    return {
      batch,
      children,
      schedules,
      isReimport,
      invalidatedCount: invalidatedOldRecords.length
    };
  }

  public getImportBatches(): ImportBatch[] {
    return Array.from(db.importBatches.values())
      .sort((a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime());
  }

  public getBatchRecords(batchId: string): WriteOffRecord[] {
    return Array.from(db.writeOffRecords.values())
      .filter(r => r.batchId === batchId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const importService = new ImportService();
