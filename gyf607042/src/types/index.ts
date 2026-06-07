export type RecordStatus = 'normal' | 'abnormal' | 'manual_overridden' | 'pending';

export type MealType = '早餐' | '午餐' | '晚餐' | '加餐';

export type RiskLevel = '高' | '中' | '低';

export type IngredientCategory =
  | '主食'
  | '蔬菜'
  | '肉类'
  | '蛋奶'
  | '海鲜'
  | '坚果'
  | '其他';

export interface Ingredient {
  name: string;
  category: IngredientCategory;
  isForbidden?: boolean;
}

export interface TabooMatch {
  ingredientName: string;
  tabooName: string;
  riskLevel: RiskLevel;
  description: string;
}

export type ValidationIssueType = 'phone_format' | 'privacy_leak' | 'data_corruption';

export interface ValidationIssue {
  field: string;
  issue: ValidationIssueType;
  severity: 'warn' | 'error';
  humanReadable: string;
  rawValue: string;
}

export type RectificationAction =
  | 'create'
  | 'status_change'
  | 'rectify'
  | 'override'
  | 'manual_entry';

export interface RectificationLog {
  id: string;
  action: RectificationAction;
  operator: string;
  note: string;
  timestamp: string;
}

export interface SupplementDiff {
  field: string;
  before: string;
  after: string;
}

export interface TrackRecord {
  id: string;
  roomNo: string;
  babyName: string;
  babyNameRaw: string;
  motherPhone: string;
  mealType: MealType;
  mealDate: string;
  photoUrl: string;
  photoCaption: string;
  status: RecordStatus;
  overrideReason?: string;
  ingredients: Ingredient[];
  taboosMatched: TabooMatch[];
  validationIssues: ValidationIssue[];
  rectificationLogs: RectificationLog[];
  supplementDiffs?: SupplementDiff[];
  isManualEntry: boolean;
  createdAt: string;
  updatedAt: string;
}

export type FilterKey = 'all' | RecordStatus;

export interface Stats {
  total: number;
  normal: number;
  abnormal: number;
  manualOverridden: number;
  pending: number;
}
