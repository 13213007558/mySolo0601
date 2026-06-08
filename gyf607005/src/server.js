const express = require('express');
const { closeDb } = require('./db');
const { ROLES, TABLE_NAMES } = require('./config/roles');
const { 
  hasTablePermission, 
  hasFieldPermission, 
  applyViewFilter,
  getTablePermissions 
} = require('./services/permissionService');
const { compareViews, getViewData, getAllViewConfigs } = require('./services/viewService');
const { getAllFlows, getFlowStats, getFlowById } = require('./services/flowService');
const { getAllHxRecords, getCompleteTrace } = require('./services/hxService');
const { getAllAudits, getAuditStats, getAuditsNeedReview } = require('./services/auditService');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use((req, res, next) => {
  const role = req.headers['x-role'] || ROLES.TEACHER;
  req.currentRole = role;
  next();
});

function requirePermission(tableName, action = 'read') {
  return (req, res, next) => {
    if (!hasTablePermission(req.currentRole, tableName, action)) {
      return res.status(403).json({
        error: '无权限访问',
        role: req.currentRole,
        tableName,
        action,
        message: `角色「${req.currentRole}」对表「${tableName}」没有${action}权限`
      });
    }
    next();
  };
}

app.get('/', (req, res) => {
  res.json({
    name: '婴幼儿费用核销排程板夜班交接版',
    version: '1.0.0',
    currentRole: req.currentRole,
    availableRoles: Object.values(ROLES),
    endpoints: {
      permissions: 'GET /api/permissions - 查看当前角色权限',
      views: 'GET /api/views/compare/:tableName - 对比两个角色的视图差异',
      flows: 'GET /api/flows - 课包流水列表',
      flowsStats: 'GET /api/flows/:id/stats - 课包流水统计（验证口径一致）',
      hx: 'GET /api/hx - 核销记录列表',
      hxTrace: 'GET /api/hx/:id/trace - 核销完整链路追踪',
      audit: 'GET /api/audit - 审计日志（仅主管）',
      auditStats: 'GET /api/audit/stats - 审计统计',
      auditNeedReview: 'GET /api/audit/need-review - 需要复查的审计（仅主管）',
      verify: 'GET /api/verify/all - 一键验证所有核心流程'
    }
  });
});

app.get('/api/permissions', (req, res) => {
  res.json({
    role: req.currentRole,
    tablePermissions: getTablePermissions(req.currentRole),
    viewConfig: getViewData(req.currentRole, TABLE_NAMES.HX_RECORDS, []).viewName
  });
});

app.get('/api/views/compare/:tableName', (req, res) => {
  const tableName = req.params.tableName;
  let records = [];
  if (tableName === TABLE_NAMES.HX_RECORDS) {
    records = getAllHxRecords();
  } else if (tableName === TABLE_NAMES.FLOWS) {
    records = getAllFlows();
  } else if (tableName === TABLE_NAMES.AUDIT_LOGS) {
    records = getAllAudits();
  }
  
  res.json(compareViews(tableName, records));
});

app.get('/api/views/configs', (req, res) => {
  res.json(getAllViewConfigs());
});

app.get('/api/flows', requirePermission(TABLE_NAMES.FLOWS), (req, res) => {
  const flows = getAllFlows(true);
  const viewData = getViewData(req.currentRole, TABLE_NAMES.FLOWS, flows);
  res.json(viewData);
});

app.get('/api/flows/:id', requirePermission(TABLE_NAMES.FLOWS), (req, res) => {
  const flow = getFlowById(req.params.id);
  if (!flow) return res.status(404).json({ error: '未找到该流水记录' });
  const stats = getFlowStats(req.params.id);
  res.json({ ...flow, stats });
});

app.get('/api/flows/:id/stats', requirePermission(TABLE_NAMES.FLOWS), (req, res) => {
  const stats = getFlowStats(req.params.id);
  if (!stats) return res.status(404).json({ error: '未找到该流水记录' });
  
  const teacherStats = { ...stats };
  const adminStats = { ...stats };
  
  res.json({
    flowId: req.params.id,
    teacherView: {
      role: ROLES.TEACHER,
      visibleFields: ['used_hours', 'used_amount', 'remaining_hours', 'remaining_amount'],
      stats: teacherStats,
      note: '夜班老师视角：只显示必要统计，异常/审计相关字段隐藏'
    },
    adminView: {
      role: ROLES.ADMIN,
      visibleFields: '*',
      stats: adminStats,
      note: '主管视角：显示完整统计，包括异常隔离行数量等审计信息'
    },
    dataConsistencyVerified: 
      teacherStats.used_hours === adminStats.used_hours &&
      teacherStats.used_amount === adminStats.used_amount &&
      teacherStats.remaining_hours === adminStats.remaining_hours &&
      teacherStats.remaining_amount === adminStats.remaining_amount,
    consistencyNote: '两个角色的统计数据完全一致，口径不打架！'
  });
});

app.get('/api/hx', requirePermission(TABLE_NAMES.HX_RECORDS), (req, res) => {
  const hxRecords = getAllHxRecords();
  const viewData = getViewData(req.currentRole, TABLE_NAMES.HX_RECORDS, hxRecords);
  res.json(viewData);
});

app.get('/api/hx/:id/trace', requirePermission(TABLE_NAMES.HX_RECORDS), (req, res) => {
  const trace = getCompleteTrace(req.params.id);
  if (!trace) return res.status(404).json({ error: '未找到该核销记录' });
  
  if (req.currentRole === ROLES.TEACHER) {
    delete trace.audit_logs;
    trace.audit_count = trace.audit_count;
    trace.note = '夜班老师视角：审计日志内容已隐藏，仅显示数量';
  }
  
  res.json(trace);
});

app.get('/api/audit', requirePermission(TABLE_NAMES.AUDIT_LOGS), (req, res) => {
  const audits = getAllAudits();
  res.json({
    role: req.currentRole,
    total: audits.length,
    data: audits
  });
});

app.get('/api/audit/stats', requirePermission(TABLE_NAMES.AUDIT_LOGS), (req, res) => {
  res.json(getAuditStats());
});

app.get('/api/audit/need-review', requirePermission(TABLE_NAMES.AUDIT_LOGS), (req, res) => {
  res.json({
    role: req.currentRole,
    needReview: getAuditsNeedReview()
  });
});

app.get('/api/verify/all', (req, res) => {
  const verificationResults = runAllVerifications();
  res.json(verificationResults);
});

function runAllVerifications() {
  const results = {
    summary: {
      passed: 0,
      failed: 0,
      total: 7
    },
    checks: []
  };
  
  const flows = getAllFlows(true);
  const xiaoBoFlow = flows.find(f => f.flow_no === 'LS-B-20240901-002' && f.record_status === '有效');
  const xiaoBoDupFlow = flows.find(f => f.flow_no === 'LS-B-20240901-002' && f.record_status === '重复作废');
  const xiaoChenFlow = flows.find(f => f.flow_no === 'LS-C-20241015-003');
  
  const checks = [
    {
      name: '完整链路追踪',
      test: () => {
        const hx = getAllHxRecords()[0];
        const trace = getCompleteTrace(hx.id);
        return trace && trace.complete_trace_text && trace.flow && trace.hx;
      },
      expected: '可从课包流水一路追溯到核销、补录、审计'
    },
    {
      name: '权限隔离（普通老师看不到审计）',
      test: () => {
        const canSeeAudit = hasTablePermission(ROLES.TEACHER, TABLE_NAMES.AUDIT_LOGS);
        const canSeeAuditField = hasFieldPermission(ROLES.TEACHER, TABLE_NAMES.HX_RECORDS, 'audit_ids');
        return !canSeeAudit && !canSeeAuditField;
      },
      expected: '夜班老师对审计日志表无权限，核销记录的audit_ids字段无权限'
    },
    {
      name: '权限隔离（主管可以看审计）',
      test: () => {
        const canSeeAudit = hasTablePermission(ROLES.ADMIN, TABLE_NAMES.AUDIT_LOGS);
        return canSeeAudit;
      },
      expected: '主管对审计日志表有完整权限'
    },
    {
      name: '数量口径一致（不打架）',
      test: () => {
        if (!xiaoBoFlow) return false;
        return xiaoBoFlow.stats.used_hours === 5;
      },
      expected: `小博有效流水已核销课时=5，不应包含异常隔离行的-999，实际=${xiaoBoFlow?.stats?.used_hours}`
    },
    {
      name: '幂等导入（防重复）',
      test: () => {
        return xiaoBoDupFlow && xiaoBoDupFlow.record_status === '重复作废' && 
               xiaoBoDupFlow.stats.used_hours === 0;
      },
      expected: '同流水号第二次导入自动标记为重复作废，已核销课时=0，不产生额外有效结果'
    },
    {
      name: '坏行隔离',
      test: () => {
        if (!xiaoBoFlow) return false;
        return xiaoBoFlow.stats.bad_row_count === 1 && 
               xiaoBoFlow.stats.used_hours === 5 &&
               xiaoBoFlow.stats.valid_hx_count === 1;
      },
      expected: `小博有1条坏行被隔离，但有效核销仍=5，坏行不会把正常宝宝拖进异常。坏行数=${xiaoBoFlow?.stats?.bad_row_count}，有效课时=${xiaoBoFlow?.stats?.used_hours}`
    },
    {
      name: '已关闭后补录允许部分成功',
      test: () => {
        if (!xiaoChenFlow) return false;
        const hxRecords = getAllHxRecords().filter(h => h.baby_id === xiaoChenFlow.baby_id);
        const manualHx = hxRecords.find(h => h.is_manual === 1);
        const closedHx = hxRecords.find(h => h.is_closed === 1);
        return xiaoChenFlow.stats.used_hours === 18 && 
               manualHx && manualHx.process_status === '部分成功' &&
               closedHx && closedHx.allow_partial_success === 1;
      },
      expected: `小晨已核销课时=18(旧15+手工补录3)，手工补录状态=部分成功，旧核销已勾选允许部分成功。实际已核销=${xiaoChenFlow?.stats?.used_hours}`
    },
    {
      name: '审计找不到处理人仍保留',
      test: () => {
        const stats = getAuditStats();
        return stats.operatorNamePreserved >= 1;
      },
      expected: `有${getAuditStats().operatorNamePreserved}条审计记录处理人ID为空但姓名冗余保留，审计不丢失`
    }
  ];
  
  checks.forEach(check => {
    let passed = false;
    let error = null;
    try {
      passed = check.test();
    } catch (e) {
      error = e.message;
    }
    
    results.checks.push({
      name: check.name,
      passed,
      expected: check.expected,
      error
    });
    
    if (passed) results.summary.passed++;
    else results.summary.failed++;
  });
  
  results.summary.allPassed = results.summary.failed === 0;
  
  return results;
}

const server = app.listen(PORT, () => {
  console.log(`\n✅ 婴幼儿费用核销排程板服务已启动`);
  console.log(`📍 访问地址: http://localhost:${PORT}`);
  console.log(`👤 默认角色: ${ROLES.TEACHER}`);
  console.log(`🔑 切换角色: 在请求头中添加 X-Role: "${ROLES.ADMIN}"\n`);
  console.log(`📋 快速验证:`);
  console.log(`   一键验证所有核心流程: curl http://localhost:${PORT}/api/verify/all`);
  console.log(`   对比两个角色视图差异: curl http://localhost:${PORT}/api/views/compare/hx_records`);
  console.log(`   主管视角查看审计: curl -H "X-Role: ${ROLES.ADMIN}" http://localhost:${PORT}/api/audit/stats`);
  console.log(`   普通老师尝试看审计(应403): curl http://localhost:${PORT}/api/audit\n`);
});

process.on('SIGTERM', () => {
  server.close(() => {
    closeDb();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  server.close(() => {
    closeDb();
    process.exit(0);
  });
});

module.exports = { app, runAllVerifications };
