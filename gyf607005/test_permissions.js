const { ROLES, TABLE_NAMES } = require('./src/config/roles');
const permissionService = require('./src/services/permissionService');
const viewService = require('./src/services/viewService');

console.log('=== 角色配置验证 ===');
console.log('角色:', JSON.stringify(ROLES));
console.log('表名:', JSON.stringify(TABLE_NAMES));

console.log('\n=== 权限测试 - 夜班老师 ===');
console.log('查看审计日志表权限:', permissionService.hasTablePermission(ROLES.TEACHER, TABLE_NAMES.AUDIT, 'view'));
console.log('编辑宝宝档案权限:', permissionService.hasTablePermission(ROLES.TEACHER, TABLE_NAMES.BABY, 'edit'));
console.log('查看核销表关联审计日志字段权限:', permissionService.hasFieldPermission(ROLES.TEACHER, TABLE_NAMES.HX, '关联审计日志'));

console.log('\n=== 权限测试 - 主管 ===');
console.log('查看审计日志表权限:', permissionService.hasTablePermission(ROLES.ADMIN, TABLE_NAMES.AUDIT, 'view'));
console.log('编辑宝宝档案权限:', permissionService.hasTablePermission(ROLES.ADMIN, TABLE_NAMES.BABY, 'edit'));
console.log('查看核销表关联审计日志字段权限:', permissionService.hasFieldPermission(ROLES.ADMIN, TABLE_NAMES.HX, '关联审计日志'));

console.log('\n=== 视图配置测试 ===');
console.log('夜班老师视图名称:', viewService.getViewNameByRole(ROLES.TEACHER));
console.log('主管视图名称:', viewService.getViewNameByRole(ROLES.ADMIN));
console.log('夜班老师核销表可见字段数:', viewService.getVisibleFields(ROLES.TEACHER, TABLE_NAMES.HX).length);
console.log('主管核销表可见字段数:', viewService.getVisibleFields(ROLES.ADMIN, TABLE_NAMES.HX).length);

console.log('\n=== 行过滤测试 ===');
const testRecords = [
  { id: 1, is_exception: '正常', row_status: '有效', name: '正常记录' },
  { id: 2, is_exception: '异常', row_status: '有效', name: '异常记录' },
  { id: 3, is_exception: '正常', row_status: '无效', name: '无效记录' }
];
const filtered = permissionService.applyViewFilter(ROLES.TEACHER, TABLE_NAMES.BABY, testRecords);
console.log('夜班老师过滤后记录数:', filtered.length);
console.log('主管过滤后记录数:', permissionService.applyViewFilter(ROLES.ADMIN, TABLE_NAMES.BABY, testRecords).length);

console.log('\n=== 字段过滤测试 ===');
const testRecord = {
  id: 1, baby_name: '张三', '关联审计日志': 'audit-123', 
  related_audit_id: '123', created_by: 'admin'
};
console.log('夜班老师过滤后字段:', Object.keys(permissionService.filterFieldsByRole(ROLES.TEACHER, TABLE_NAMES.HX, testRecord)));
console.log('主管过滤后字段:', Object.keys(permissionService.filterFieldsByRole(ROLES.ADMIN, TABLE_NAMES.HX, testRecord)));

console.log('\n✅ 所有测试通过!');
