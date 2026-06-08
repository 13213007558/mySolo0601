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

function buildLarkIdToDbIdMap(dataRows, dbRows, dataIdIndex, dbFieldName) {
  const map = {};
  for (let i = 0; i < dataRows.length; i++) {
    const dataRow = dataRows[i];
    const dbRow = dbRows[i];
    const larkId = dataRow[dataIdIndex][0].id;
    map[larkId] = dbRow.id;
  }
  return map;
}

function seedAllData() {
  const db = getDb();
  
  console.log('=== 导入样例数据 ===\n');
  
  const babyStmt = db.prepare(`
    INSERT INTO ${TABLE_NAMES.BABIES} (baby_name, baby_code, parent_name, phone, class_name, enrollment_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  console.log('1. 导入宝宝信息...');
  const babyDbRows = [];
  const babyIdByCode = {};
  for (let i = 0; i < babyData.rows.length; i++) {
    const row = babyData.rows[i];
    const result = babyStmt.run(row[0], row[1], row[2], row[3], row[4], row[5], row[6]);
    babyDbRows.push({ id: result.lastInsertRowid, baby_code: row[1] });
    babyIdByCode[row[1]] = result.lastInsertRowid;
    console.log(`   ✓ ${row[0]} (${row[1]}) -> id=${result.lastInsertRowid}`);
  }
  
  const larkBabyIdToDbId = buildLarkIdToDbIdMap(babyData.rows, babyDbRows, 1, 'baby_code');
  
  console.log('\n2. 导入课包流水（含幂等验证）...');
  const flowsBatch1 = [];
  const flowLarkIdToFlowNo = {};
  for (let i = 0; i < flowData.rows.length; i++) {
    const row = flowData.rows[i];
    const flowNo = row[0];
    const larkFlowId = row[1][0].id;
    flowLarkIdToFlowNo[larkFlowId] = flowNo;
    
    if (row[10] === '有效') {
      flowsBatch1.push({
        flow_no: flowNo,
        baby_id: larkBabyIdToDbId[row[1][0].id],
        package_name: row[2],
        package_type: row[3],
        total_hours: row[4],
        total_amount: row[5],
        purchase_date: row[6],
        valid_until: row[7],
        data_source: row[8],
        batch_no: row[9],
        record_status: row[10],
        data_abnormal: row[11],
        abnormal_reason: row[12]
      });
    }
  }
  
  const importResult1 = importFlowRecords(flowsBatch1, 'BATCH-SEED-001', '系统初始化');
  console.log(`   ✓ 批次1：导入 ${importResult1.total} 条，有效 ${importResult1.valid} 条，重复作废 ${importResult1.duplicate_invalid} 条`);
  
  console.log('\n   测试幂等导入：同一流水号再次导入应标记为重复作废...');
  const importResult2 = importFlowRecords([flowsBatch1[1]], 'BATCH-SEED-002-DUP', '幂等测试');
  console.log(`   ✓ 批次2(幂等测试)：导入 ${importResult2.total} 条，有效 ${importResult2.valid} 条，重复作废 ${importResult2.duplicate_invalid} 条`);
  
  const flowsFromDb = db.prepare(`SELECT id, flow_no FROM ${TABLE_NAMES.FLOWS}`).all();
  const flowNoToDbId = {};
  flowsFromDb.forEach(f => { flowNoToDbId[f.flow_no] = f.id; });
  
  console.log('\n3. 导入核销记录...');
  const hxDbRows = [];
  const hxNoToDbId = {};
  const hxLarkIdToHxNo = {};
  
  for (let i = 0; i < hxData.rows.length; i++) {
    const row = hxData.rows[i];
    const hxNo = row[0];
    const larkHxId = row[0];
    hxLarkIdToHxNo[larkHxId] = hxNo;
    
    const larkFlowId = row[1][0].id;
    const flowNo = flowLarkIdToFlowNo[larkFlowId];
    const flowDbId = flowNoToDbId[flowNo];
    
    const larkBabyId = row[2][0].id;
    const babyDbId = larkBabyIdToDbId[larkBabyId];
    
    const hxDataObj = {
      hx_no: hxNo,
      flow_id: flowDbId,
      baby_id: babyDbId,
      hx_date: row[3],
      hx_hours: row[4],
      hx_amount: row[5],
      process_status: row[6],
      process_result: row[7],
      process_time: row[8],
      is_closed: row[9],
      allow_partial_success: row[10],
      row_abnormal: row[11],
      abnormal_reason: row[12],
      is_manual: row[13],
      remark: row[15]
    };
    
    const operatorName = row[0].includes('BAD') ? '系统自动' : '李老师';
    
    try {
      const result = createHxRecord(hxDataObj, operatorName);
      hxDbRows.push({ id: result.id, hx_no: hxNo });
      hxNoToDbId[hxNo] = result.id;
      console.log(`   ✓ ${hxNo} -> id=${result.id}, 状态=${row[6]}`);
      
      if (row[0].includes('BAD')) {
        markBadRow(result.id, row[12], '王老师');
        console.log(`     → 已标记为异常隔离行`);
      }
      
      if (row[9] === 1 || row[0].includes('003')) {
        closeHxRecord(result.id, null, '赵老师');
        console.log(`     → 已关闭核销记录`);
      }
    } catch (e) {
      console.log(`   ✗ ${hxNo} 导入失败: ${e.message}`);
    }
  }
  
  console.log('\n4. 导入补录材料（测试已关闭后追加，部分成功）...');
  for (let i = 0; i < blData.rows.length; i++) {
    const row = blData.rows[i];
    const larkHxId = row[1][0].id;
    const hxNo = hxLarkIdToHxNo[larkHxId] || larkHxId;
    const hxDbId = hxNoToDbId[hxNo];
    
    if (!hxDbId) {
      console.log(`   ✗ ${row[0]}: 找不到关联的核销记录 ${larkHxId}`);
      continue;
    }
    
    try {
      const result = addBlToClosedHx(
        hxDbId,
        {
          bl_no: row[0],
          material_type: row[3],
          material_desc: row[4],
          submit_time: row[5],
          process_status: row[7],
          process_result: row[8]
        },
        null,
        '赵老师'
      );
      console.log(`   ✓ ${row[0]} -> id=${result.bl_id}, 状态=${row[7]}`);
    } catch (e) {
      console.log(`   ✗ ${row[0]} 导入失败: ${e.message}`);
    }
  }
  
  console.log('\n5. 导入审计日志（含处理人注销场景）...');
  for (let i = 0; i < sjData.rows.length; i++) {
    const row = sjData.rows[i];
    let hxDbId = null;
    
    if (row[1] && row[1][0] && row[1][0].id) {
      const larkHxId = row[1][0].id;
      const hxNo = hxLarkIdToHxNo[larkHxId] || larkHxId;
      hxDbId = hxNoToDbId[hxNo] || null;
    }
    
    const operatorName = row[5];
    const operatorId = operatorName === '张老师(已离职)' ? null : row[5];
    
    const auditData = {
      audit_no: row[0],
      hx_id: hxDbId,
      operation_type: row[2],
      before_status: row[3],
      after_status: row[4],
      operator_id: operatorId,
      operator_name: operatorName,
      operation_time: row[6],
      operation_source: row[7],
      need_review: row[8],
      review_status: row[9],
      review_remark: row[10]
    };
    
    if (operatorName === '张老师(已离职)') {
      console.log(`   ✓ ${row[0]} - 【关键测试】处理人ID为空，姓名冗余保留：${operatorName}`);
    } else {
      console.log(`   ✓ ${row[0]} - ${row[2]}`);
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
