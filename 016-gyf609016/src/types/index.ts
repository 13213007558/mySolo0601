export type ColorGrade = 'A' | 'B' | 'C' | 'D';

export type WallStatus = 'normal' | 'replaced' | 'pending' | 'conflict';

export type ConfirmResult = 'approved' | 'rejected' | 'pending';

export interface StoneRecord {
  id: string;
  batchNo: string;
  stoneNo: string;
  facadeZone: string;
  colorGrade: ColorGrade;
  wallStatus: WallStatus;
  operator: string;
  createdAt: string;
  updatedAt: string;
}

export interface PhotoAttachment {
  id: string;
  stoneId: string;
  photoData: string | null;
  fileName: string;
  isMissing: boolean;
  uploadedAt: string;
}

export interface ReplacementRecord {
  id: string;
  stoneId: string;
  targetStoneNo: string;
  reason: string;
  suggestion: string;
  confirmedBy: string;
  confirmedAt: string;
  confirmResult: ConfirmResult;
}

export interface OperationHistory {
  id: string;
  stoneId: string;
  operator: string;
  action: string;
  oldValue: string;
  newValue: string;
  operatedAt: string;
}

export interface StoneDetail extends StoneRecord {
  photos: PhotoAttachment[];
  replacements: ReplacementRecord[];
  histories: OperationHistory[];
}

export interface FilterState {
  batchNo: string;
  facadeZone: string;
  colorGrade: string;
  missingPhoto: boolean;
  searchText: string;
}

export const COLOR_GRADE_LABELS: Record<ColorGrade, string> = {
  A: 'A-无色差',
  B: 'B-轻微色差',
  C: 'C-明显色差',
  D: 'D-严重色差',
};

export const WALL_STATUS_LABELS: Record<WallStatus, string> = {
  normal: '正常上墙',
  replaced: '已替换',
  pending: '待确认',
  conflict: '分区冲突',
};

export const CONFIRM_RESULT_LABELS: Record<ConfirmResult, string> = {
  approved: '通过',
  rejected: '不通过',
  pending: '待确认',
};

export const FACADE_ZONES = [
  '东立面-1区',
  '东立面-2区',
  '南立面-1区',
  '南立面-2区',
  '西立面-1区',
  '西立面-2区',
  '北立面-1区',
  '北立面-2区',
];

export const COLOR_GRADE_COLORS: Record<ColorGrade, string> = {
  A: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  B: 'bg-amber-100 text-amber-800 border-amber-300',
  C: 'bg-orange-100 text-orange-800 border-orange-300',
  D: 'bg-red-100 text-red-800 border-red-300',
};

export const WALL_STATUS_COLORS: Record<WallStatus, string> = {
  normal: 'bg-emerald-100 text-emerald-800',
  replaced: 'bg-blue-100 text-blue-800',
  pending: 'bg-amber-100 text-amber-800',
  conflict: 'bg-red-100 text-red-800',
};
