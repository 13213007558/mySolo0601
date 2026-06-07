export type RecordStatus =
  | 'normal'
  | 'abnormal'
  | 'pending'
  | 'overridden_normal'
  | 'overridden_abnormal';

export type ValidationStatus =
  | 'pass'
  | 'fail'
  | 'warning'
  | 'unit_mismatch'
  | 'boundary_triggered';

export type RestrictionType = 'allergy' | 'intolerance' | 'age_restriction' | 'other';

export type Unit = 'g' | 'ml' | 'mg' | 'piece';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface OverrideInfo {
  by: string;
  time: string;
  reason: string;
  fromStatus: RecordStatus;
  toStatus: RecordStatus;
}

export interface FoodRestriction {
  id: string;
  ingredientName: string;
  restrictionType: RestrictionType;
  maxAmount: number;
  unit: Unit;
  note?: string;
  synonyms?: string[];
}

export interface IngredientItem {
  id: string;
  name: string;
  amount: number;
  unit: Unit;
  mealType: MealType;
  dayOffset: 0 | 1 | 2;
}

export interface ValidationItem {
  id: string;
  ingredientId: string;
  restrictionId: string;
  ingredientName: string;
  status: ValidationStatus;
  reason: string;
  detail: string;
  amount?: number;
  unit?: Unit;
  maxAllowed?: number;
  maxUnit?: Unit;
  mealType?: MealType;
}

export interface BabyRecord {
  id: string;
  name: string;
  ageMonths: number;
  allergyHistory: string;
  createdAt: string;
  isSupplemented: boolean;
  supplementReason?: string;
  supplementedBy?: string;
  supplementTime?: string;
  status: RecordStatus;
  restrictions: FoodRestriction[];
  validations: ValidationItem[];
  override?: OverrideInfo;
}

export interface AppState {
  records: BabyRecord[];
  ingredients: IngredientItem[];
  activeDate: string;
  filter: RecordStatus | 'all' | 'supplemented';
  searchKeyword: string;
}

export const statusLabelMap: Record<RecordStatus | 'all' | 'supplemented', string> = {
  all: '全部',
  normal: '正常',
  abnormal: '异常',
  pending: '待复核',
  overridden_normal: '已改判·正常',
  overridden_abnormal: '已改判·异常',
  supplemented: '补录',
};

export const validationStatusLabelMap: Record<ValidationStatus, string> = {
  pass: '通过',
  fail: '未通过',
  warning: '警告',
  unit_mismatch: '单位不一致',
  boundary_triggered: '边界值触发',
};

export const mealTypeLabelMap: Record<MealType, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '点心',
};

export const restrictionTypeLabelMap: Record<RestrictionType, string> = {
  allergy: '过敏',
  intolerance: '不耐受',
  age_restriction: '月龄限制',
  other: '其他',
};
