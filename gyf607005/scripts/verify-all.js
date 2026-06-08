const { runAllVerifications } = require('../src/server');

function runCLI() {
  console.log('\n' + '='.repeat(70));
  console.log('  🧪 婴幼儿费用核销排程板 - 核心流程一键验证');
  console.log('='.repeat(70) + '\n');
  
  const results = runAllVerifications();
  
  console.log(`📊 验证结果：${results.summary.passed}/${results.summary.total} 通过\n`);
  
  results.checks.forEach((check, index) => {
    const status = check.passed ? '✅' : '❌';
    console.log(`${status} 需求 ${index + 1}：${check.name}`);
    console.log(`   预期：${check.expected}`);
    if (!check.passed && check.error) {
      console.log(`   错误：${check.error}`);
    }
    console.log();
  });
  
  console.log('='.repeat(70));
  
  if (results.summary.allPassed) {
    console.log('\n🎉 恭喜！所有 7 项核心需求全部通过验证！');
    console.log('\n📋 验证覆盖：');
    console.log('   1. ✅ 完整链路追踪（课包流水→核销→补录→审计）');
    console.log('   2. ✅ 权限隔离（普通老师看不到审计表和审计字段）');
    console.log('   3. ✅ 权限隔离（主管有完整审计权限）');
    console.log('   4. ✅ 数量口径一致（不打架，排除异常隔离行）');
    console.log('   5. ✅ 幂等导入（防重复，重标记重复作废）');
    console.log('   6. ✅ 坏行隔离（异常行不影响正常宝宝）');
    console.log('   7. ✅ 已关闭后补录允许部分成功');
    console.log('   8. ✅ 审计保留（处理人注销仍有姓名冗余）');
    process.exit(0);
  } else {
    console.log(`\n⚠️  有 ${results.summary.failed} 项验证失败，请检查数据或代码`);
    process.exit(1);
  }
}

if (require.main === module) {
  runCLI();
}

module.exports = runCLI;
