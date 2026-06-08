const { ROLES, TABLE_NAMES, VISIBLE_FIELDS, VIEW_CONFIGS } = require('../config/roles');
const { applyViewFilter, hasTablePermission } = require('./permissionService');

function getViewConfig(role) {
  return VIEW_CONFIGS[role] || null;
}

function getVisibleFields(role, tableName) {
  const roleFields = VISIBLE_FIELDS[role];
  if (!roleFields) return '*';
  
  const fields = roleFields[tableName];
  if (!fields || fields === '*') return '*';
  
  return fields;
}

function getViewData(role, tableName, records) {
  if (!hasTablePermission(role, tableName, 'read')) {
    return {
      error: '无权限访问该表',
      role,
      tableName,
      data: []
    };
  }
  
  const visibleFields = getVisibleFields(role, tableName);
  const filteredRecords = applyViewFilter(role, tableName, records);
  
  let data = filteredRecords;
  if (visibleFields !== '*' && Array.isArray(filteredRecords)) {
    data = filteredRecords.map(record => {
      const result = {};
      visibleFields.forEach(field => {
        if (record.hasOwnProperty(field)) {
          result[field] = record[field];
        }
      });
      return result;
    });
  }
  
  return {
    role,
    viewName: getViewConfig(role)?.name,
    tableName,
    visibleFields,
    recordCount: data.length,
    totalRecordCount: records?.length || 0,
    hiddenCount: (records?.length || 0) - data.length,
    data
  };
}

function compareViews(tableName, records) {
  const teacherView = getViewData(ROLES.TEACHER, tableName, records);
  const adminView = getViewData(ROLES.ADMIN, tableName, records);
  
  const teacherFieldCount = Array.isArray(teacherView.visibleFields) 
    ? teacherView.visibleFields.length 
    : '全部';
  const adminFieldCount = Array.isArray(adminView.visibleFields) 
    ? adminView.visibleFields.length 
    : '全部';
  
  return {
    tableName,
    views: {
      [ROLES.TEACHER]: {
        name: teacherView.viewName,
        visibleFields: teacherView.visibleFields,
        fieldCount: teacherFieldCount,
        recordCount: teacherView.recordCount,
        hiddenFields: teacherFieldCount !== '全部' 
          ? `隐藏 ${adminFieldCount - teacherFieldCount} 个审计/敏感字段` 
          : '无隐藏',
        hiddenRecords: teacherView.hiddenCount > 0 
          ? `过滤 ${teacherView.hiddenCount} 条异常隔离/作废记录` 
          : '无过滤'
      },
      [ROLES.ADMIN]: {
        name: adminView.viewName,
        visibleFields: adminView.visibleFields,
        fieldCount: adminFieldCount,
        recordCount: adminView.recordCount,
        hiddenFields: '无隐藏，全部可见',
        hiddenRecords: '无过滤，全部可见'
      }
    },
    dataConsistency: '口径一致：聚合计算逻辑相同，仅可见范围不同'
  };
}

function getAllViewConfigs() {
  return {
    [ROLES.TEACHER]: {
      ...VIEW_CONFIGS[ROLES.TEACHER],
      visibleFields: VISIBLE_FIELDS[ROLES.TEACHER],
      permissions: {
        审计日志表: '无权限',
        核销记录表: '可编辑，隐藏关联审计日志、异常原因字段',
        课包流水表: '可编辑，只看有效记录',
        宝宝信息表: '可编辑',
        补录材料表: '可编辑'
      }
    },
    [ROLES.ADMIN]: {
      ...VIEW_CONFIGS[ROLES.ADMIN],
      visibleFields: VISIBLE_FIELDS[ROLES.ADMIN],
      permissions: {
        审计日志表: '完整权限，可复查',
        核销记录表: '完整权限，可看审计链路',
        课包流水表: '完整权限，可看重重复作废记录',
        宝宝信息表: '完整权限',
        补录材料表: '完整权限'
      }
    }
  };
}

module.exports = {
  getViewConfig,
  getVisibleFields,
  getViewData,
  compareViews,
  getAllViewConfigs
};
