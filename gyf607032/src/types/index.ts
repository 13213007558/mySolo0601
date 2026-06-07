export type RecordStatus =
  | 'normal'
  | 'abnormal'
  | 'overridden'
  | 'conflict'
  | 'withdrawn'
  | 'pending';

export type HistoryAction =
  | 'status_change'
  | 'note_add'
  | 'withdraw'
  | 'conflict'
  | 'manual_create'
  | 'override';

export interface MealItem {
  name: string;
  ingredients: string[];
  note?: string;
}

export interface DayPlan {
  date: string;
  breakfast: MealItem;
  lunch: MealItem;
  dinner: MealItem;
  snack: MealItem;
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  operator: string;
  action: HistoryAction;
  fromStatus?: RecordStatus;
  toStatus?: RecordStatus;
  reason?: string;
  note?: string;
  parentNote?: string;
}

export interface FoodRecord {
  id: string;
  babyName: string;
  babyAgeMonths: number;
  allergies: string[];
  parentName: string;
  parentPhone: string;
  consultant: string;
  appointmentId: string;
  trialCourse: string;
  threeDayPlan: DayPlan[];
  status: RecordStatus;
  conflictInfo?: {
    conflictingAppointmentId: string;
    conflictingCourse: string;
    conflictingTime: string;
  };
  withdrawInfo?: {
    withdrawReason: string;
    withdrawOperator: string;
    withdrawTime: string;
  };
  isManualEntry: boolean;
  isBadData?: boolean;
  detectedIssues?: string[];
  originalPromise?: string;
  history: HistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export const STATUS_LABEL: Record<RecordStatus, string> = {
  normal: '正常',
  abnormal: '异常',
  overridden: '人工改判',
  conflict: '预约冲突',
  withdrawn: '已撤回',
  pending: '待确认',
};

export const STATUS_COLOR: Record<RecordStatus, string> = {
  normal: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  abnormal: 'bg-rose-100 text-rose-800 border-rose-200',
  overridden: 'bg-amber-100 text-amber-800 border-amber-200',
  conflict: 'bg-orange-100 text-orange-800 border-orange-200',
  withdrawn: 'bg-slate-200 text-slate-600 border-slate-300',
  pending: 'bg-sky-100 text-sky-800 border-sky-200',
};

export const ACTION_LABEL: Record<HistoryAction, string> = {
  status_change: '状态变更',
  note_add: '补充备注',
  withdraw: '撤回确认',
  conflict: '预约冲突',
  manual_create: '手工补录',
  override: '人工改判',
};
