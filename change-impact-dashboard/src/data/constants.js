export const FLOORS = [
  { id: 'B2', name: '地下2层', type: 'basement' },
  { id: 'B1', name: '地下1层', type: 'basement' },
  { id: 'F1', name: '1层', type: 'ground' },
  { id: 'F2', name: '2层', type: 'above' },
  { id: 'F3', name: '3层', type: 'above' },
  { id: 'F4', name: '4层', type: 'above' },
  { id: 'F5', name: '5层', type: 'above' },
  { id: 'F6', name: '6层', type: 'above' },
  { id: 'F7', name: '7层', type: 'above' },
  { id: 'F8', name: '8层', type: 'above' },
  { id: 'F9', name: '9层', type: 'above' },
  { id: 'F10', name: '10层', type: 'above' },
  { id: 'roof', name: '屋面层', type: 'roof' }
];

export const MAJORS = [
  { id: 'architecture', name: '建筑', color: 'bg-blue-500' },
  { id: 'structure', name: '结构', color: 'bg-red-500' },
  { id: 'mechanical', name: '机电', color: 'bg-green-500' },
  { id: 'electrical', name: '电气', color: 'bg-yellow-500' },
  { id: 'plumbing', name: '给排水', color: 'bg-cyan-500' },
  { id: 'hvac', name: '暖通', color: 'bg-purple-500' },
  { id: 'fire', name: '消防', color: 'bg-orange-500' }
];

export const CONSTRUCTION_STATUS = [
  { id: 'constructed', name: '已施工', color: 'border-red-500', bgColor: 'bg-red-50', textColor: 'text-red-700' },
  { id: 'partial', name: '部分施工', color: 'border-yellow-500', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700' },
  { id: 'drawing', name: '仅图纸', color: 'border-blue-500', bgColor: 'bg-blue-50', textColor: 'text-blue-700' }
];

export const IMPACT_LEVEL = [
  { id: 'high', name: '高', color: 'bg-red-500', textColor: 'text-red-700', bgLight: 'bg-red-100' },
  { id: 'medium', name: '中', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgLight: 'bg-yellow-100' },
  { id: 'low', name: '低', color: 'bg-blue-500', textColor: 'text-blue-700', bgLight: 'bg-blue-100' },
  { id: 'none', name: '无', color: 'bg-gray-400', textColor: 'text-gray-600', bgLight: 'bg-gray-100' }
];

export const CHANGE_STATUS = [
  { id: 'pending', name: '待确认', color: 'bg-orange-500', textColor: 'text-orange-700' },
  { id: 'confirmed', name: '已确认', color: 'bg-blue-500', textColor: 'text-blue-700' },
  { id: 'implemented', name: '已实施', color: 'bg-green-500', textColor: 'text-green-700' },
  { id: 'rejected', name: '已驳回', color: 'bg-red-500', textColor: 'text-red-700' },
  { id: 'closed', name: '已关闭', color: 'bg-gray-500', textColor: 'text-gray-700' }
];

export const RESPONSIBLE_PERSONS = [
  { id: 'sun', name: '孙工', role: '项目技术员' },
  { id: 'zhang', name: '张工', role: '结构工程师' },
  { id: 'li', name: '李工', role: '建筑工程师' },
  { id: 'wang', name: '王工', role: '机电工程师' },
  { id: 'zhao', name: '赵工', role: '给排水工程师' },
  { id: 'chen', name: '陈工', role: '暖通工程师' },
  { id: 'zhou', name: '周工', role: '消防工程师' },
  { id: 'liu', name: '刘工', role: '电气工程师' },
  { id: 'qian', name: '钱工', role: '预算员' }
];

export const SOURCE_TYPES = [
  { id: 'design_letter', name: '设计院函件' },
  { id: 'site_photo', name: '现场照片' },
  { id: 'change_ledger', name: '变更台账' },
  { id: 'verbal', name: '口头通知' }
];

export const STORAGE_KEYS = {
  CHANGES: 'change_dashboard_changes',
  FILTERS: 'change_dashboard_filters',
  SELECTED_FLOOR: 'change_dashboard_selected_floor',
  LAST_SYNC: 'change_dashboard_last_sync',
  INIT_FLAG: 'change_dashboard_initialized'
};

export const FLOOR_GROUPS = [
  { id: 'all', name: '全部楼层' },
  { id: 'basement', name: '地下层' },
  { id: 'above', name: '地上层' },
  { id: 'roof', name: '屋面层' }
];
