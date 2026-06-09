import type { RoleConfig, UserRole } from '@/types';

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  engineer: {
    role: 'engineer',
    roleName: '现场工程师',
    allowedFields: [
      'id', 'componentId', 'stationName', 'location', 'hotSpotLevel',
      'status', 'detectedDate', 'processedDate', 'processedBy',
      'supplierQuoteVersion', 'recheckImages', 'isManuallySupplemented'
    ],
    allowedOperations: ['view', 'create', 'uploadImage'],
    canViewSensitiveData: false,
    canExport: false,
    canSupplement: false,
    sensitiveFieldMask: {
      componentCost: true,
      repairCost: true,
      supplierContact: true,
      internalComments: true,
    },
  },
  admin: {
    role: 'admin',
    roleName: '管理员（老何）',
    allowedFields: [
      'id', 'componentId', 'stationName', 'location', 'hotSpotLevel',
      'status', 'detectedDate', 'processedDate', 'processedBy',
      'supplierQuoteVersion', 'currentWithdrawReason', 'originalWithdrawReason',
      'internalFieldCode', 'isManuallySupplemented', 'supplementedBy',
      'supplementedAt', 'sensitiveData', 'recheckImages', 'versionHistory',
      'supplementalRecord'
    ],
    allowedOperations: ['view', 'create', 'edit', 'delete', 'export', 'supplement', 'withdraw'],
    canViewSensitiveData: true,
    canExport: true,
    canSupplement: true,
    sensitiveFieldMask: {},
  },
  supplier: {
    role: 'supplier',
    roleName: '供应商',
    allowedFields: [
      'id', 'componentId', 'stationName', 'location', 'hotSpotLevel',
      'status', 'detectedDate', 'supplierQuoteVersion', 'recheckImages'
    ],
    allowedOperations: ['view', 'compareVersions'],
    canViewSensitiveData: false,
    canExport: true,
    canSupplement: false,
    sensitiveFieldMask: {
      componentCost: true,
      repairCost: true,
      supplierContact: true,
      internalComments: true,
    },
  },
};

export const STATION_NAMES = [
  '宁夏光伏电站A区',
  '内蒙古风电基地',
  '新疆哈密光伏园',
  '青海格尔木电站',
  '甘肃酒泉风电场',
];

export const HOT_SPOT_LEVELS = ['严重', '中等', '轻微'] as const;

export const RECORD_STATUSES = ['待处理', '处理中', '已完成', '已撤回'] as const;

export const IMAGE_TYPES = ['红外热成像', '可见光', '无人机航拍'] as const;

export const CHANGE_TYPES = ['撤回原因变更', '状态变更', '补录', '报价版本更新'] as const;
