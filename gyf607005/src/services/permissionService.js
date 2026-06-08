const { ROLES, TABLE_NAMES, PERMISSIONS } = require('../config/roles');

function hasTablePermission(role, tableName, action = 'read') {
  const rolePerm = PERMISSIONS[role];
  if (!rolePerm) return false;
  
  const tablePerm = rolePerm.tables[tableName];
  if (!tablePerm || tablePerm === 'no_perm') return false;
  
  if (action === 'read') {
    return tablePerm === 'read' || tablePerm === 'edit' || tablePerm === 'manage';
  }
  if (action === 'edit') {
    return tablePerm === 'edit' || tablePerm === 'manage';
  }
  if (action === 'delete') {
    return tablePerm === 'manage';
  }
  
  return true;
}

function hasFieldPermission(role, tableName, fieldName) {
  const rolePerm = PERMISSIONS[role];
  if (!rolePerm) return false;
  
  if (!hasTablePermission(role, tableName, 'read')) return false;
  
  const fieldPerms = rolePerm.fields[tableName];
  if (!fieldPerms) return true;
  
  if (fieldPerms['*'] === 'no_perm') return false;
  
  const fieldPerm = fieldPerms[fieldName];
  if (fieldPerm === 'no_perm') return false;
  if (fieldPerm === 'read' || fieldPerm === 'edit') return true;
  
  return true;
}

function filterFieldsByRole(role, tableName, record) {
  if (!record) return record;
  
  const rolePerm = PERMISSIONS[role];
  if (!rolePerm) return record;
  
  if (role === ROLES.ADMIN) return record;
  
  const fieldPerms = rolePerm.fields[tableName];
  if (!fieldPerms) return record;
  
  if (fieldPerms['*'] === 'no_perm') return null;
  
  const filtered = {};
  for (const [key, value] of Object.entries(record)) {
    const perm = fieldPerms[key];
    if (perm && perm !== 'no_perm') {
      filtered[key] = value;
    }
  }
  
  return filtered;
}

function filterRecordsByRole(role, tableName, records) {
  if (!records || !Array.isArray(records)) return records;
  
  const rolePerm = PERMISSIONS[role];
  if (!rolePerm) return records;
  
  if (role === ROLES.ADMIN) return records;
  
  const filters = rolePerm.filters[tableName];
  if (!filters) return records;
  
  return records.filter(record => {
    for (const [key, expectedValue] of Object.entries(filters)) {
      if (record[key] !== expectedValue) {
        return false;
      }
    }
    return true;
  });
}

function applyViewFilter(role, tableName, records) {
  let filtered = filterRecordsByRole(role, tableName, records);
  return filtered.map(r => filterFieldsByRole(role, tableName, r)).filter(Boolean);
}

function getFieldPermission(role, tableName, fieldName) {
  const rolePerm = PERMISSIONS[role];
  if (!rolePerm) return 'no_perm';
  
  const fieldPerms = rolePerm.fields[tableName];
  if (!fieldPerms) return 'edit';
  
  if (fieldPerms['*']) return fieldPerms['*'];
  
  return fieldPerms[fieldName] || 'edit';
}

function getTablePermissions(role) {
  const rolePerm = PERMISSIONS[role];
  if (!rolePerm) return {};
  return rolePerm.tables;
}

module.exports = {
  hasTablePermission,
  hasFieldPermission,
  filterFieldsByRole,
  filterRecordsByRole,
  applyViewFilter,
  getFieldPermission,
  getTablePermissions
};
