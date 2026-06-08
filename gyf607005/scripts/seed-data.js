const { getDb, closeDb } = require('../src/db');
const { TABLE_NAMES } = require('../src/config/roles');
const { importFlowRecords } = require('../src/services/flowService');
const { createHxRecord, closeHxRecord, addBlToClosedHx, markBadRow } = require('../src/services/hxService');
const { logAudit } = require('../src/services/auditService');

const babyData = require('../baby_records.json');
const flowData = require('../flow_records.json');
const hxData = require('../hx_records.json');
const blData = require('../bl_records.json');
const sjData = require('../sj_records.json');

function seedAllData() {
  const db = getDb();
  
  console.log('=== 导入样例数据 ===\n');
  
  const babyStmt = db.prepare(`
    INSERT INTO ${TABLE_NAMES.BABIES} (baby_name, baby_code, parent_name, phone, class_name, enrollment_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  console.log('1. 导入宝宝信息...');
  const babyCodeToId = {};
  for (let i = 0; i < babyData.rows.length; i++) {
    const row = babyData.rows[i];
    const result = babyStmt.run(row[0], row[1], row[2], row[3], row[4], row[5], row[6]);
    babyCodeToId[row[1]] = result.lastInsertRowid;
    console.log(`   ✓ ${row[0]} (${row[1]}) -> id=${result.lastInsertRowid}`);
  }
  
  const babyNameToId = {
    '小安（正常）': babyCodeToId['BB-A-001'],
    '小博（含异常坏行）': babyCodeToId['BB-B-002'],
    '小晨（含补录）': babyCodeToId['BB-C-003']
  };
  
  console.log('\n2. 导入课包流水（含幂等验证）...');
  const flowsBatch1 = [
    {
      flow_no: 'LS-A-20240901-001',
      baby_id: babyCodeToId['BB-A-001'],
      package_name: '全日托月卡-A班',
      package_type: '全日托',
      total_hours: 22,
      total_amount: 6600,
      purchase_date: '2024-09-01 09:00:00',
      valid_until: '2025-08-31 23:59:59',
      data_source: '系统导入',
      batch_no: 'BATCH-2024-09',
      record_status: '有效',
      data_abnormal: false,
      abnormal_reason: null
    },
    {
      flow_no: 'LS-B-20240901-002',
      baby_id: babyCodeToId['BB-B-002'],
      package_name: '半日托季卡-B班',
      package_type: '半日托',
      total_hours: 66,
      total_amount: 13200,
      purchase_date: '2024-09-01 09:00:00',
      valid_until: '2024-11-30 23:59:59',
      data_source: '系统导入',
      batch_no: 'BATCH-2024-09',
      record_status: '有效',
      data_abnormal: false,
      abnormal_reason: null
    },
    {
      flow_no: 'LS-C-20241015-003',
      baby_id: babyCodeToId['BB-C-003'],
      package_name: '计时托次卡-C班',
      package_type: '计时托',
      total_hours: 50,
      total_amount: 7500,
      purchase_date: '2024-10-15 10:00:00',
      valid_until: '2025-10-14 23:59:59',
      data_source: '历史迁移',
      batch_no: 'BATCH-2024-10',
      record_status: '有效',
      data_abnormal: false,
      abnormal_reason: null
    }
  ];
  
  const importResult1 = importFlowRecords(flowsBatch1, 'BATCH-SEED-001', '系统初始化');
  console.log(`   ✓ 批次1：导入 ${importResult1.total} 条，有效 ${importResult1.valid} 条，重复作废 ${importResult1.duplicate_invalid} 条`);
  
  console.log('\n   测试幂等导入：同一流水号再次导入应标记为重复作废...');
  const importResult2 = importFlowRecords([flowsBatch1[1]], 'BATCH-SEED-002-DUP', '幂等测试');
  console.log(`   ✓ 批次2(幂等测试)：导入 ${importResult2.total} 条，有效 ${importResult2.valid} 条，重复作废 ${importResult2.duplicate_invalid} 条`);
  
  const flowsFromDb = db.prepare(`SELECT id, flow_no, record_status FROM ${TABLE_NAMES.FLOWS}`).all();
  const flowNoToDbId = {};
  flowsFromDb.forEach(f => {
    if (f.record_status === '有效') {
      flowNoToDbId[f.flow_no] = f.id;
    }
  });
  
  console.log('\n3. 导入核销记录...');
  const hxNoToDbId = {};
  
  const hxRecords = [
    {
      hx_no: 'HX-A-202501-001',
      flow_no: 'LS-A-20240901-001',
      baby_code: 'BB-A-001',
      hx_date: '2025-01-15 14:00:00',
      hx_hours: 10,
      hx_amount: 3000,
      process_status: '已完成',
      process_result: '正常核销，家长签字确认',
      process_time: '2025-01-15 14:30:00',
      is_closed: false,
      allow_partial_success: false,
      row_abnormal: '正常',
      abnormal_reason: null,
      is_manual: false,
      remark: '小安-1月正常核销'
    },
    {
      hx_no: 'HX-B-202501-002',
      flow_no: 'LS-B-20240901-002',
      baby_code: 'BB-B-002',
      hx_date: '2025-01-16 10:00:00',
      hx_hours: 5,
      hx_amount: 1000,
      process_status: '已完成',
      process_result: '正常核销',
      process_time: '2025-01-16 10:30:00',
      is_closed: false,
      allow_partial_success: false,
      row_abnormal: '正常',
      abnormal_reason: null,
      is_manual: false,
      remark: '小博-1月正常核销（有效流水）'
    },
    {
      hx_no: 'HX-B-202501-002-BAD',
      flow_no: 'LS-B-20240901-002',
      baby_code: 'BB-B-002',
      hx_date: '2025-01-16 10:00:00',
      hx_hours: -999,
      hx_amount: -99999,
      process_status: '异常',
      process_result: null,
      process_time: null,
      is_closed: false,
      allow_partial_success: false,
      row_abnormal: '异常隔离',
      abnormal_reason: '数据异常：核销课时为负数，已隔离该行，不影响宝宝其他正常记录',
      is_manual: false,
      remark: '小博-异常坏行（验证隔离）',
      mark_bad: true
    },
    {
      hx_no: 'HX-C-202412-003',
      flow_no: 'LS-C-20241015-003',
      baby_code: 'BB-C-003',
      hx_date: '2024-12-20 15:00:00',
      hx_hours: 15,
      hx_amount: 2250,
      process_status: '已关闭',
      process_result: '当月核销完成后关闭，后家长补充新的出勤记录',
      process_time: '2024-12-20 16:00:00',
      is_closed: true,
      allow_partial_success: true,
      row_abnormal: '正常',
      abnormal_reason: null,
      is_manual: false,
      remark: '小晨-旧核销（已关闭，后追加补录）',
      close_hx: true
    },
    {
      hx_no: 'HX-C-202501-004-MANUAL',
      flow_no: 'LS-C-20241015-003',
      baby_code: 'BB-C-003',
      hx_date: '2025-01-20 09:00:00',
      hx_hours: 3,
      hx_amount: 450,
      process_status: '部分成功',
      process_result: '手工补录：家长新提交的12月多出勤3次，其中1次凭证待确认，2次通过',
      process_time: '2025-01-20 11:00:00',
      is_closed: false,
      allow_partial_success: true,
      row_abnormal: '正常',
      abnormal_reason: null,
      is_manual: true,
      remark: '小晨-手工补录（验证补录前后差异）'
    }
  ];
  
  for (const hx of hxRecords) {
    const flowDbId = flowNoToDbId[hx.flow_no];
    const babyDbId = babyCodeToId[hx.baby_code];
    
    if (!flowDbId) {
      console.log(`   ✗ ${hx.hx_no}: 找不到流水 ${hx.flow_no}`);
      continue;
    }
    
    const hxDataObj = {
      hx_no: hx.hx_no,
      flow_id: flowDbId,
      baby_id: babyDbId,
      hx_date: hx.hx_date,
      hx_hours: hx.hx_hours,
      hx_amount: hx.hx_amount,
      process_status: hx.process_status,
      process_result: hx.process_result,
      process_time: hx.process_time,
      is_closed: hx.is_closed,
      allow_partial_success: hx.allow_partial_success,
      row_abnormal: hx.row_abnormal,
      abnormal_reason: hx.abnormal_reason,
      is_manual: hx.is_manual,
      remark: hx.remark
    };
    
    const operatorName = hx.mark_bad ? '系统自动' : '李老师';
    
    try {
      const result = createHxRecord(hxDataObj, operatorName);
      hxNoToDbId[hx.hx_no] = result.id;
      console.log(`   ✓ ${hx.hx_no} -> id=${result.id}, 状态=${hx.process_status}`);
      
      if (hx.mark_bad) {
        markBadRow(result.id, hx.abnormal_reason, '王老师');
        console.log(`     → 已标记为异常隔离行`);
      }
      
      if (hx.close_hx) {
        closeHxRecord(result.id, null, '赵老师');
        console.log(`     → 已关闭核销记录`);
      }
    } catch (e) {
      console.log(`   ✗ ${hx.hx_no} 导入失败: ${e.message}`);
    }
  }
  
  console.log('\n4. 导入补录材料（测试已关闭后追加，部分成功）...');
  const blRecords = [
    {
      bl_no: 'BL-C-202501-001',
      hx_no: 'HX-C-202412-003',
      baby_code: 'BB-C-003',
      material_type: '出勤记录',
      material_desc: '家长补交2024年12月26、28、30日共3天的出勤确认单，其中12月26日无老师签字需进一步核实',
      submit_time: '2025-01-18 20:00:00',
      process_status: '部分成功',
      process_result: '已关闭核销HX-C-202412-003后追加补录：3天出勤中2天凭证完整通过，1天（12-26）待确认，按允许部分成功处理'
    }
  ];
  
  for (const bl of blRecords) {
    const hxDbId = hxNoToDbId[bl.hx_no];
    
    if (!hxDbId) {
      console.log(`   ✗ ${bl.bl_no}: 找不到关联的核销记录 ${bl.hx_no}`);
      continue;
    }
    
    try {
      const result = addBlToClosedHx(
        hxDbId,
        {
          bl_no: bl.bl_no,
          material_type: bl.material_type,
          material_desc: bl.material_desc,
          submit_time: bl.submit_time,
          process_status: bl.process_status,
          process_result: bl.process_result
        },
        null,
        '赵老师'
      );
      console.log(`   ✓ ${bl.bl_no} -> id=${result.bl_id}, 状态=${bl.process_status}`);
    } catch (e) {
      console.log(`   ✗ ${bl.bl_no} 导入失败: ${e.message}`);
    }
  }
  
  console.log('\n5. 导入审计日志（含处理人注销场景）...');
  const auditRecords = [
    { audit_no: 'SJ-A-001', hx_no: 'HX-A-202501-001', operation_type: '创建核销记录', before: '无', after: '待处理→已完成', operator_id: 'user-li', operator_name: '李老师', time: '2025-01-15 14:30:00', source: '人工操作', need_review: false, review_status: '未复查', remark: null },
    { audit_no: 'SJ-B-001', hx_no: 'HX-B-202501-002-BAD', operation_type: '数据异常标记', before: '正常', after: '异常隔离', operator_id: null, operator_name: '王老师', time: '2025-01-16 11:00:00', source: '系统自动', need_review: true, review_status: '未复查', remark: '检测到核销课时为负数，系统自动标记异常隔离，请主管复核是否影响其他记录' },
    { audit_no: 'SJ-B-002', hx_no: null, operation_type: '导入样例数据', before: '无', after: '重复作废', operator_id: 'user-wang', operator_name: '王老师', time: '2025-01-10 09:00:00', source: '批量导入', need_review: false, review_status: '复查通过', remark: '流水号LS-B-20240901-002重复导入检测，标记BATCH-2024-12批次为重复作废，历史保留清晰' },
    { audit_no: 'SJ-C-001', hx_no: 'HX-C-202412-003', operation_type: '关闭核销记录', before: '已完成', after: '已关闭', operator_id: 'user-zhao', operator_name: '赵老师', time: '2024-12-20 16:00:00', source: '人工操作', need_review: false, review_status: '未复查', remark: '当月核销完成后正常关闭' },
    { audit_no: 'SJ-C-002', hx_no: 'HX-C-202412-003', operation_type: '追加补录材料', before: '已关闭', after: '已关闭', operator_id: 'user-zhao', operator_name: '赵老师', time: '2025-01-18 20:10:00', source: '人工操作', need_review: false, review_status: '未复查', remark: '已关闭核销HX-C-202412-003后家长追加3天出勤记录，自动勾选允许部分成功' },
    { audit_no: 'SJ-C-003', hx_no: 'HX-C-202501-004-MANUAL', operation_type: '手工补录', before: '无', after: '部分成功', operator_id: 'user-zhang', operator_name: '张老师', time: '2025-01-20 09:30:00', source: '人工操作', need_review: false, review_status: '未复查', remark: '基于补录材料手工补录核销HX-C-202501-004-MANUAL' },
    { audit_no: 'SJ-C-004', hx_no: 'HX-C-202501-004-MANUAL', operation_type: '更新核销状态', before: '处理中', after: '部分成功', operator_id: null, operator_name: '张老师(已离职)', time: '2025-01-20 11:00:00', source: '人工操作', need_review: true, review_status: '未复查', remark: '【关键测试场景】处理人用户账号已注销，user字段为空，但处理人姓名冗余保留，审计记录不丢失，方便主管复查' }
  ];
  
  for (const audit of auditRecords) {
    const hxDbId = audit.hx_no ? hxNoToDbId[audit.hx_no] : null;
    
    const auditData = {
      audit_no: audit.audit_no,
      hx_id: hxDbId,
      operation_type: audit.operation_type,
      before_status: audit.before,
      after_status: audit.after,
      operator_id: audit.operator_id,
      operator_name: audit.operator_name,
      operation_time: audit.time,
      operation_source: audit.source,
      need_review: audit.need_review,
      review_status: audit.review_status,
      review_remark: audit.remark
    };
    
    if (!audit.operator_id && audit.operator_name) {
      console.log(`   ✓ ${audit.audit_no} - 【关键测试】处理人ID为空，姓名冗余保留：${audit.operator_name}`);
    } else {
      console.log(`   ✓ ${audit.audit_no} - ${audit.operation_type}`);
    }
    
    logAudit(auditData);
  }
  
  console.log('\n=== 样例数据导入完成 ===\n');
  
  const counts = {
    babies: db.prepare(`SELECT COUNT(*) as c FROM ${TABLE_NAMES.BABIES}`).get().c,
    flows: db.prepare(`SELECT COUNT(*) as c FROM ${TABLE_NAMES.FLOWS}`).get().c,
    hx: db.prepare(`SELECT COUNT(*) as c FROM ${TABLE_NAMES.HX_RECORDS}`).get().c,
    bl: db.prepare(`SELECT COUNT(*) as c FROM ${TABLE_NAMES.BL_RECORDS}`).get().c,
    audit: db.prepare(`SELECT COUNT(*) as c FROM ${TABLE_NAMES.AUDIT_LOGS}`).get().c
  };
  
  console.log('数据库记录统计：');
  console.log(`  宝宝信息：${counts.babies} 条`);
  console.log(`  课包流水：${counts.flows} 条`);
  console.log(`  核销记录：${counts.hx} 条`);
  console.log(`  补录材料：${counts.bl} 条`);
  console.log(`  审计日志：${counts.audit} 条`);
  
  closeDb();
}

if (require.main === module) {
  seedAllData();
}

module.exports = seedAllData;
