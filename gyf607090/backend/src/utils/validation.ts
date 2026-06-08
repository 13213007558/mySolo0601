import { z } from 'zod';

export const RecordSource = {
  PARENT_MESSAGE: 'PARENT_MESSAGE',
  PAPER_RECEIPT: 'PAPER_RECEIPT',
} as const;

export const RecordStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  REVIEWED: 'REVIEWED',
  REJECTED: 'REJECTED',
  SUSPICIOUS: 'SUSPICIOUS',
} as const;

export type RecordSourceType = typeof RecordSource[keyof typeof RecordSource];
export type RecordStatusType = typeof RecordStatus[keyof typeof RecordStatus];

export const createMilkRecordSchema = z.object({
  childId: z.number().int().positive(),
  recordDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  amount: z.number().int().min(0).max(1000),
  source: z.enum(['PARENT_MESSAGE', 'PAPER_RECEIPT']),
  parentMessage: z.string().optional(),
  paperNote: z.string().optional(),
  operator: z.string(),
});

export const updateMilkRecordSchema = z.object({
  amount: z.number().int().min(0).max(1000).optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'REVIEWED', 'REJECTED', 'SUSPICIOUS']).optional(),
  reason: z.string().optional(),
  changeNote: z.string(),
  operator: z.string(),
});

export const reviewRecordSchema = z.object({
  newStatus: z.enum(['CONFIRMED', 'REVIEWED', 'REJECTED']),
  newAmount: z.number().int().min(0).max(1000).optional(),
  newReason: z.string(),
  reviewNote: z.string(),
  reviewer: z.string(),
});

export const feedbackSchema = z.object({
  recordId: z.number().int().positive(),
  childId: z.number().int().positive(),
  content: z.string().min(1),
  therapist: z.string(),
});

export const filterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  childId: z.coerce.number().int().positive().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'REVIEWED', 'REJECTED', 'SUSPICIOUS']).optional(),
  source: z.enum(['PARENT_MESSAGE', 'PAPER_RECEIPT']).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().optional().default(20),
});
