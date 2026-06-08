export type RecordSource = 'PARENT_MESSAGE' | 'PAPER_RECEIPT';
export type RecordStatus = 'PENDING' | 'CONFIRMED' | 'REVIEWED' | 'REJECTED' | 'SUSPICIOUS';

export interface Child {
  id: number;
  name: string;
  age: number;
  guardianName: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export interface MilkRecord {
  id: number;
  childId: number;
  child: Child;
  recordDate: string;
  amount: number;
  source: RecordSource;
  status: RecordStatus;
  parentMessage?: string | null;
  paperNote?: string | null;
  reason?: string | null;
  handledBy?: string | null;
  handledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  feedback?: TherapyFeedback | null;
}

export interface MilkRecordHistory {
  id: number;
  recordId: number;
  oldStatus: RecordStatus;
  newStatus: RecordStatus;
  oldAmount?: number | null;
  newAmount?: number | null;
  oldReason?: string | null;
  newReason?: string | null;
  changeNote: string;
  operator: string;
  operatedAt: string;
}

export interface ReviewRecord {
  id: number;
  recordId: number;
  reviewNote: string;
  reviewer: string;
  reviewedAt: string;
}

export interface TherapyFeedback {
  id: number;
  recordId: number;
  childId: number;
  content: string;
  therapist: string;
  createdAt: string;
  updatedAt: string;
}

export interface SuspiciousRecord {
  id: number;
  originalId?: number | null;
  childId: number;
  childName: string;
  recordDate: string;
  amount: number;
  source: RecordSource;
  parentMessage?: string | null;
  paperNote?: string | null;
  suspiciousReason: string;
  detectedAt: string;
  handled: boolean;
  handledNote?: string | null;
  handledBy?: string | null;
  handledAt?: string | null;
}

export interface RecordDetail extends MilkRecord {
  histories: MilkRecordHistory[];
  reviews: ReviewRecord[];
}

export const STATUS_TEXT: Record<RecordStatus, string> = {
  PENDING: '待确认',
  CONFIRMED: '已确认',
  REVIEWED: '已复核',
  REJECTED: '已驳回',
  SUSPICIOUS: '可疑',
};

export const SOURCE_TEXT: Record<RecordSource, string> = {
  PARENT_MESSAGE: '家长群留言',
  PAPER_RECEIPT: '纸质交接单',
};

export const STATUS_COLOR: Record<RecordStatus, string> = {
  PENDING: 'gold',
  CONFIRMED: 'blue',
  REVIEWED: 'green',
  REJECTED: 'red',
  SUSPICIOUS: 'orange',
};
