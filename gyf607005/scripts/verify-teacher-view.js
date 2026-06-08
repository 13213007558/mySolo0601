const { ROLES, TABLE_NAMES } = require('../src/config/roles');
const { applyViewFilter, hasTablePermission, hasFieldPermission } = require('../src/services/permissionService');
const { getViewData } = require('../src/services/viewService');
const { getAllHxRecords } = require('../src/services/hxService');
const { getAllFlows } = require('../src/services/flowService');
const { getAllAudits, getAuditStats } = require('../src/services/auditService');

function runTeacherViewCheck() {
  console.log('\n' + '='.repeat(70));
  console.log('  👨‍🏫 夜班老师视角权限验证');
  console.log('='.repeat(70) + '\n');
  
  const role = ROLES.TEACHER;
  console.log(`当前角色：${role}\n`);
  
  const checks = [];
  
  const canSeeAudit = hasTablePermission(role, TABLE_NAMES.AUDIT_LOGS);
  checks.push({
    name: '审计日志表权限',
    passed: !canSeeAudit,
    expected: '无权限',
    actual: canSeeAudit ? '可访问' : '无权限 ✓'
  });
  
  const canSeeAuditField = hasFieldPermission(role, TABLE_NAMES.HX_RECORDS, 'audit_ids');
  checks.push({
    name: '核销记录-关联审计日志字段',
    passed: !canSeeAuditField,
    expected: '隐藏',
    actual: canSeeAuditField ? '可见' : '隐藏 ✓'
  });
  
  const canSeeAbnormalReason = hasFieldPermission(role, TABLE_NAMES.HX_RECORDS, 'abnormal_reason');
  checks.push({
    name: '核销记录-异常原因字段',
    passed: !canSeeAbnormalReason,
    expected: '隐藏',
    actual: canSeeAbnormalReason ? '可见' : '隐藏 ✓'
  });
  
  const hxRecords = getAllHxRecords();
  const teacherView = getViewData(role, TABLE_NAMES.HX_RECORDS, hxRecords);
  
  checks.push({
    name: '异常隔离行过滤',
    passed: teacherView.hiddenCount > 0,
    expected: '自动过滤 row_abnormal!=正常 的记录',
    actual: `总记录${teacherView.totalRecordCount}条，过滤${teacherView.hiddenCount}条异常隔离行，显示${teacherView.recordCount}条 ✓`
  });
  
  const flows = getAllFlows();
  const flowView = getViewData(role, TABLE_NAMES.FLOWS, flows);
  
  checks.push({
    name: '重复作废记录过滤',
    passed: flowView.hiddenCount > 0,
    expected: '自动过滤 record_status!=有效 的记录',
    actual: `总记录${flowView.totalRecordCount}条，过滤${flowView.hiddenCount}条重复作废，显示${flowView.recordCount}条 ✓`
  });
  
  let allPassed = true;
  checks.forEach((check, i) => {
    const status = check.passed ? '✅' : '❌';
    console.log(`${status} ${i + 1}. ${check.name}`);
    console.log(`   预期：${check.expected}`);
    console.log(`   实际：${check.actual}`);
    if (!check.passed) allPassed = false;
    console.log();
  });
  
  console.log('='.repeat(70));
  console.log('\n👀 夜班老师可见字段示例（核销记录表）：');
  console.log(`   可见字段：${Array.isArray(teacherView.visibleFields) ? teacherView.visibleFields.join(', ') : '全部'}`);
  console.log(`   隐藏字段：audit_ids, abnormal_reason 等审计/敏感字段\n`);
  
  if (allPassed) {
    console.log('✅ 夜班老师权限验证全部通过');
    process.exit(0);
  } else {
    console.log('❌ 部分权限验证失败');
    process.exit(1);
  }
}

if (require.main === module) {
  runTeacherViewCheck();
}

module.exports = runTeacherViewCheck;
