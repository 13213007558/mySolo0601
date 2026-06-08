const { getDb } = require('./src/db');
const flowService = require('./src/services/flowService');
const hxService = require('./src/services/hxService');
const auditService = require('./src/services/auditService');

try {
  const db = getDb();
  console.log('1. 数据库连接成功');

  const result = flowService.importFlowRecords([
    { lsNo: 'TEST-001', packageName: '测试课包', totalHours: 10, totalAmount: 1000 }
  ], 'BATCH-TEST');
  console.log('2. flowService.importFlowRecords:', JSON.stringify(result, null, 2));

  const stats = flowService.getFlowStats(1);
  console.log('3. flowService.getFlowStats:', JSON.stringify(stats, null, 2));

  const valid = flowService.isValidFlow(1);
  console.log('4. flowService.isValidFlow:', valid);

  const hxResult = hxService.createHxRecord({
    flowId: 1, hxHours: 2, hxAmount: 200, operatorName: '测试老师'
  });
  console.log('5. hxService.createHxRecord:', JSON.stringify(hxResult, null, 2));

  const trace = hxService.getCompleteTrace(hxResult.id);
  console.log('6. hxService.getCompleteTrace summary:', JSON.stringify(trace.summary, null, 2));

  const needReview = auditService.getAuditsNeedReview();
  console.log('7. auditService.getAuditsNeedReview 数量:', needReview.length);

  console.log('\n=== 所有服务冒烟测试通过! ===');
} catch (err) {
  console.error('测试失败:', err);
  process.exit(1);
}
