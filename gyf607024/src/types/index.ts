export type RecordStatus = 'pending' | 'processed' | 'abnormal';
export type IssueSeverity = 'warning' | 'error';
export type IssueType = 'unit_mismatch' | 'boundary_value' | 'invalid_phone' | 'empty_name' | 'same_course';

export interface DataQualityIssue {
  id: string; recordId: string; type: IssueType; field: string; reason: string; severity: IssueSeverity;
}

export interface OperationLog {
  id: string; recordId: string; action: string; operator: string; note: string; timestamp: string;
}

export interface RescheduleRecord {
  id: string; sourceFile: string; handler: string; status: RecordStatus; latestNote: string;
  babyName: string; phone: string; originalCourse: string; targetCourse: string; reason: string;
  unit: string; hours: number; operator: string; createdAt: string; updatedAt: string;
  isManual: boolean; issues: DataQualityIssue[]; logs: OperationLog[];
}

export interface RecordFormData {
  babyName: string; phone: string; originalCourse: string; targetCourse: string; reason: string;
  unit: string; hours: number | ''; latestNote: string; handler: string; sourceFile: string;
}
  note: string;
  timestamp: string;
}

export interface RescheduleRecord {
  id: string;
  sourceFile: string;
  handler: string;
  status: RecordStatus;
  latestNote: string;
  babyName: string;
  phone: string;
  originalCourse: string;
  targetCourse: string;
  reason: string;
  unit: string;
  hours: number;
  operator: string;
  createdAt: string;
  updatedAt: string;
  isManual: boolean;
  issues: DataQualityIssue[];
  logs: OperationLog[];
}

export interface RecordFormData {
  babyName: string;
  phone: string;
  originalCourse: string;
  targetCourse: string;
  reason: string;
  unit: string;
  hours: number | '';
  latestNote: string;
  handler: string;
  sourceFile: string;
}
  note: string;
  timestamp: string;
}

export interface RescheduleRecord {
  id: string;
  sourceFile: string;
  handler: string;
  status: RecordStatus;
  latestNote: string;
  babyName: string;
  phone: string;
  originalCourse: string;
  targetCourse: string;
  reason: string;
  unit: string;
  hours: number;
  operator: string;
  createdAt: string;
  updatedAt: string;
  isManual: boolean;
  issues: DataQualityIssue[];
  logs: OperationLog[];
}

export interface RecordFormData {
  babyName: string;
  phone: string;
  originalCourse: string;
  targetCourse: string;
  reason: string;
  unit: string;
  hours: number | '';
  latestNote: string;
  handler: string;
  sourceFile: string;
}
