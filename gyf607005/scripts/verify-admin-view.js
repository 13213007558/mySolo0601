const { ROLES, TABLE_NAMES } = require('../src/config/roles');
const { hasTablePermission, hasFieldPermission } = require('../src/services/permissionService');
const { getViewData } = require('../src/services/viewService');
const { getAllHxRecords } = require('../src/services/hxService');
const { getAllAudits, getAuditStats, getAuditsNeedReview } = require('../src/services/auditService');

function runAdminViewCheck() {
  console.log('\n' + '='.repeat(70));
  console.log('  👨‍💼 主管视角权限验证');
  console.log('='.repeat(70) + '\n');
  
  const role = ROLES.ADMIN;
  console.log(`当前角色：${role}\n`);
  
  const checks = [];
  
  const canSeeAudit = hasTablePermission(role, TABLE_NAMES.AUDIT_LOGS);
  checks.push({
    name: '审计日志表权限',
    passed: canSeeAudit,
    expected: '完整权限',
    actual: canSeeAudit ? '完整权限 ✓' : '无权限'
  });
  
  const canSeeAuditField = hasFieldPermission(role, TABLE_NAMES.HX_RECORDS, 'audit_ids');
  checks.push({
    name: '核销记录-关联审计日志字段',
    passed: canSeeAuditField,
    expected: '可见',
    actual: canSeeAuditField ? '可见 ✓' : '隐藏'
  });
  
  const canSeeAbnormalReason = hasFieldPermission(role, TABLE_NAMES.HX_RECORDS, 'abnormal_reason');
  checks.push({
    name: '核销记录-异常原因字段',
    passed: canSeeAbnormalReason,
    expected: '可见',
    actual: canSeeAbnormalReason ? '可见 ✓' : '隐藏'
  });
  
  const hxRecords = getAllHxRecords();
  const adminView = getViewData(role, TABLE_NAMES.HX_RECORDS, hxRecords);
  
  checks.push({
    name: '异常隔离行可见',
    passed: adminView.hiddenCount === 0,
    expected: '不过滤，全部可见',
    actual: `显示全部${adminView.recordCount}条记录，包含异常隔离行 ✓`
  });
  
  const auditStats = getAuditStats();
  checks.push({
    name: '审计保留（处理人注销）',
    passed: auditStats.operatorNamePreserved >= 1,
    expected: '处理人ID为空但姓名冗余保留的审计记录>=1',
    actual: `${auditStats.operatorNamePreserved} 条审计记录处理人ID为空，但姓名冗余已保留 ✓`
  });
  
  const needReview = getAuditsNeedReview();
  checks.push({
    name: '需要复查的审计可见',
    passed: needReview.length >= 1,
    expected: '可见需要复查的审计记录',
    actual: `${needReview.length} 条审计需要主管复查 ✓`
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
  
  const audits = getAllAudits();
  console.log('\n📋 主管可见的审计日志示例（前3条）：');
  audits.slice(0, 3).forEach(a => {
    const preserved = !a.operator_id && a.operator_name ? '🔒 姓名冗余保留' : '✅ 账号存在';
    console.log(`   ${a.audit_no} | ${a.operation_type} | ${a.operator_name} | ${preserved}`);
  });
  
  console.log('\n🔍 需要复查的审计：');
  needReview.forEach(a => {
    console.log(`   ⚠️  ${a.audit_no} | ${a.operation_type} | ${a.review_remark?.substring(0, 50)}...`);
  });
  
  if (allPassed) {
    console.log('\n✅ 主管权限验证全部通过');
    process.exit(0);
  } else {
    console.log('\n❌ 部分权限验证失败');
    process.exit(1);
  }
}

if (require.main === module) {
  runAdminViewCheck();
}

module.exports = runAdminViewCheck;
