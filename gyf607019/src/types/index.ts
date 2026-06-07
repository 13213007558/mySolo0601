export type AuthorizationStatus = 'pending' | 'approved' | 'rejected' | 'partial';

export type MaterialType = 'id_card' | 'household' | 'authorization_letter' | 'birth_certificate';
export type MaterialStatus = 'verified' | 'pending' | 'rejected';
export type AuditActionType = 'export' | 'view' | 'edit' | 'access_privacy';
export type ExportFormat = 'csv' | 'markdown';
export type UserRole = 'nurse' | 'manager' | 'director';

export interface CurrentUser {
  id: string;
  name: string;
  role: UserRole;
  employeeId: string;
}

export interface AuthorizationRecord {
  id: string;
  nickname: string;
  babyName: string;
  babyIdCard: string;
  babyBirthDate: string;
  authorizerName: string;
  authorizerIdCard: string;
  authorizerPhone: string;
  relationship: string;
  status: AuthorizationStatus;
  emergencyContact: string;
  handledBy: string;
  handledByName: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewTime?: string;
  isSupplemented: boolean;
  supplementSource?: string;
  remark?: string;
  phoneValidationIssues?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface HistoryChange {
  id: string;
  recordId: string;
  fieldName: string;
  fieldLabel: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  changedByName: string;
  changeReason: string;
  changedAt: string;
}

export interface MaterialAttachment {
  id: string;
  recordId: string;
  materialType: MaterialType;
  materialName: string;
  status: MaterialStatus;
  uploader: string;
  uploadedAt: string;
}

export interface AuditLog {
  id: string;
  recordId?: string;
  actionType: AuditActionType;
  operatorId: string;
  operatorName: string;
  exportFormat?: ExportFormat;
  containsPrivateData: boolean;
  desensitized: boolean;
  fieldsInvolved: string[];
  ipAddress: string;
  createdAt: string;
}

export interface PhoneValidationResult {
  valid: boolean;
  partialSuccess: boolean;
  originalValue: string;
  normalizedValue: string;
  issues: string[];
}

export interface ExportConfig {
  format: ExportFormat;
  fields: string[];
  desensitizePrivate: boolean;
  includeHistory: boolean;
  recordIds?: string[];
}

export interface FieldDiff {
  fieldName: string;
  fieldLabel: string;
  oldValue: string;
  newValue: string;
  changed: boolean;
}

export const STATUS_LABEL: Record<AuthorizationStatus, string> = {
  pending: '待复核',
  approved: '已通过',
  rejected: '已驳回',
  partial: '部分通过',
};

export const STATUS_COLOR: Record<AuthorizationStatus, string> = {
  pending: 'bg-warning-100 text-warning-600 border-warning-200',
  approved: 'bg-safety-100 text-safety-600 border-safety-200',
  rejected: 'bg-danger-100 text-danger-600 border-danger-200',
  partial: 'bg-medical-100 text-medical-600 border-medical-200',
};

export const MATERIAL_TYPE_LABEL: Record<MaterialType, string> = {
  id_card: '身份证',
  household: '户口本',
  authorization_letter: '授权书',
  birth_certificate: '出生证明',
};

export const MATERIAL_STATUS_LABEL: Record<MaterialStatus, string> = {
  verified: '已核验',
  pending: '待核验',
  rejected: '已驳回',
};

export const FIELD_LABELS: Record<string, string> = {
  nickname: '昵称',
  babyName: '婴幼儿姓名',
  babyIdCard: '婴幼儿身份证号',
  babyBirthDate: '出生日期',
  authorizerName: '授权人姓名',
  authorizerIdCard: '授权人身份证号',
  authorizerPhone: '授权人手机号',
  relationship: '与婴幼儿关系',
  status: '授权状态',
  emergencyContact: '紧急联系人',
  remark: '备注',
};

export const PRIVATE_FIELDS = ['babyIdCard', 'authorizerIdCard', 'emergencyContact', 'authorizerPhone'];

export const EXPORTABLE_FIELDS = [
  { key: 'nickname', label: '昵称', isPrivate: false },
  { key: 'babyName', label: '婴幼儿姓名', isPrivate: false },
  { key: 'babyIdCard', label: '婴幼儿身份证号', isPrivate: true },
  { key: 'babyBirthDate', label: '出生日期', isPrivate: false },
  { key: 'authorizerName', label: '授权人姓名', isPrivate: false },
  { key: 'authorizerIdCard', label: '授权人身份证号', isPrivate: true },
  { key: 'authorizerPhone', label: '授权人手机号', isPrivate: true },
  { key: 'relationship', label: '与婴幼儿关系', isPrivate: false },
  { key: 'status', label: '授权状态', isPrivate: false },
  { key: 'emergencyContact', label: '紧急联系人', isPrivate: true },
  { key: 'handledByName', label: '处理护士', isPrivate: false },
  { key: 'reviewedByName', label: '复核人', isPrivate: false },
  { key: 'reviewTime', label: '复核时间', isPrivate: false },
  { key: 'isSupplemented', label: '是否补录', isPrivate: false },
  { key: 'createdAt', label: '创建时间', isPrivate: false },
];
