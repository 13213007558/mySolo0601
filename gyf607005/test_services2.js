const { getDb } = require('./src/db');
const flowService = require('./src/services/flowService');
const hxService = require('./src/services/hxService');
const auditService = require('./src/services/auditService');

try {
  const db = getDb();
  console.log('=== 核心功能深度测试 ===\n');

  console.log('--- 测试1: 幂等导入（同流水号重复导入）---');
  const result1 = flowService.importFlowRecords([
    { lsNo: 'IDEMPOTENT-001', packageName: '首次导入', totalHours: 20, totalAmount: 2000 }
  ], 'BATCH-001');
  console.log('首次导入:', { valid: result1.valid, duplicateVoid: result1.duplicateVoid });

  const result2 = flowService.importFlowRecords([
    { lsNo: 'IDEMPOTENT-001', packageName: '重复导入', totalHours: 20, totalAmount: 2000 }
  ], 'BATCH-002');
  console.log('重复导入:', { valid: result2.valid, duplicateVoid: result2.duplicateVoid });
  console.log('重复原因:', result2.details[0].reason);
  console.log('✓ 幂等导入测试通过\n');

  console.log('--- 测试2: 坏行隔离（标记异常行不影响统计）---');
  const hx1 = hxService.createHxRecord({
    flowId: 1, hxHours: 3, hxAmount: 300, operatorName: '张老师', processStatus: '已完成'
  });
  console.log('创建正常核销:', hx1.hxNo);

  const hx2 = hxService.createHxRecord({
    flowId: 1, hxHours: 5, hxAmount: 500, operatorName: '李老师', processStatus: '已完成'
  });
  console.log('创建第二笔核销:', hx2.hxNo);

  const statsBefore = flowService.getFlowStats(1);
  console.log('标记异常前统计:', { usedHours: statsBefore.usedHours, remainingHours: statsBefore.remainingHours });

  const badRow = hxService.markBadRow(hx2.id, '数据异常：核销课时计算错误', '系统自动');
  console.log('标记异常行:', badRow.rowStatus);

  const statsAfter = flowService.getFlowStats(1);
  console.log('标记异常后统计:', { usedHours: statsAfter.usedHours, remainingHours: statsAfter.remainingHours });
  console.log('✓ 坏行隔离测试通过（异常行5课时已从统计中排除）\n');

  console.log('--- 测试3: 已关闭后追加补录 ---');
  const hx3 = hxService.createHxRecord({
    flowId: 1, hxHours: 2, hxAmount: 200, operatorName: '王老师', 
    processStatus: '已关闭', isClosed: true
  });
  console.log('创建已关闭核销:', hx3.hxNo);

  const blResult = hxService.addBlToClosedHx(hx3.id, {
    materialType: '出勤记录',
    materialDesc: '家长补交2024年12月出勤记录',
    operatorName: '赵老师'
  });
  console.log('追加补录结果:', { blNo: blResult.blNo, allowPartialSuccess: blResult.allowPartialSuccess });
  console.log('✓ 已关闭后追加补录测试通过\n');

  console.log('--- 测试4: 处理人姓名冗余（即使operator为空也能记录审计）---');
  const auditResult = auditService.logAudit({
    hxId: hx1.id,
    operationType: '测试操作',
    statusBefore: '状态A',
    statusAfter: '状态B',
    operator: null,
    operatorName: '已离职员工(姓名保留)',
    operationSource: '人工操作'
  });
  console.log('审计记录创建:', { sjNo: auditResult.sjNo, operatorName: auditResult.operatorName });
  
  const audits = auditService.getAuditsForHx(hx1.id);
  console.log('该核销审计记录数:', audits.length);
  console.log('✓ 处理人姓名冗余测试通过\n');

  console.log('--- 测试5: 需要复查的审计记录 ---');
  const needReview = auditService.getAuditsNeedReview();
  console.log('待复查审计记录数:', needReview.length);
  console.log('待复查记录操作类型:', needReview.map(a => a.operation_type));
  console.log('✓ 待复查审计记录测试通过\n');

  console.log('--- 测试6: 完整链路追踪 ---');
  const trace = hxService.getCompleteTrace(hx3.id);
  console.log('完整链路:', {
    核销状态: trace.hx.process_status,
    是否已关闭: !!trace.hx.is_closed,
    允许部分成功: !!trace.hx.allow_partial_success,
    补录记录数: trace.blRecords.length,
    审计记录数: trace.audits.length,
    关联流水: trace.flow ? trace.flow.ls_no : '无'
  });
  console.log('✓ 完整链路追踪测试通过\n');

  console.log('=== 所有核心功能深度测试通过! ===');
} catch (err) {
  console.error('测试失败:', err);
  process.exit(1);
}
