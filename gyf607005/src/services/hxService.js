const { getDb } = require('../db');

function generateHxNo() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `HX-${year}${month}-${random}`;
}

function generateBlNo() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `BL-${year}${month}-${random}`;
}

function createHxRecord(data) {
  const db = getDb();
  const auditService = require('./auditService');

  const {
    hxNo,
    flowId,
    babyId,
    hxDate,
    hxHours,
    hxAmount,
    processStatus = '待处理',
    processResult,
    processTime,
    isClosed = false,
    allowPartialSuccess = false,
    isManual = false,
    remark,
    operator,
    operatorName
  } = data;

  if (!operatorName) {
    throw new Error('处理人姓名冗余(operatorName)不能为空');
  }

  const finalHxNo = hxNo || generateHxNo();

  const insertStmt = db.prepare(`
    INSERT INTO hx_records 
    (hx_no, flow_id, baby_id, hx_date, hx_hours, hx_amount, 
     process_status, process_result, process_time, is_closed, 
     allow_partial_success, row_status, is_manual, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '正常', ?, ?)
  `);

  const result = insertStmt.run(
    finalHxNo,
    flowId || null,
    babyId || null,
    hxDate || null,
    hxHours || 0,
    hxAmount || 0,
    processStatus,
    processResult || null,
    processTime || new Date().toISOString(),
    isClosed ? 1 : 0,
    allowPartialSuccess ? 1 : 0,
    isManual ? 1 : 0,
    remark || null
  );

  const hxId = result.lastInsertRowid;

  auditService.logAudit({
    hxId,
    operationType: '创建核销记录',
    statusBefore: '无',
    statusAfter: `无→${processStatus}`,
    operator,
    operatorName,
    operationSource: '人工操作',
    needReview: false
  });

  return {
    id: hxId,
    hxNo: finalHxNo,
    rowStatus: '正常'
  };
}

function addBlToClosedHx(hxId, blData) {
  const db = getDb();
  const auditService = require('./auditService');

  const {
    blNo,
    babyId,
    materialType,
    materialDesc,
    submitTime,
    processStatus = '处理中',
    processResult,
    processTime,
    operator,
    operatorName
  } = blData;

  if (!operatorName) {
    throw new Error('处理人姓名冗余(operatorName)不能为空');
  }

  const hxStmt = db.prepare(`
    SELECT id, hx_no, is_closed, allow_partial_success 
    FROM hx_records 
    WHERE id = ?
  `);

  const hxRecord = hxStmt.get(hxId);
  if (!hxRecord) {
    throw new Error(`核销记录 ${hxId} 不存在`);
  }

  const updateHxStmt = db.prepare(`
    UPDATE hx_records 
    SET allow_partial_success = 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  const insertBlStmt = db.prepare(`
    INSERT INTO bl_records 
    (bl_no, hx_id, baby_id, material_type, material_desc, 
     submit_time, process_status, process_result, process_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const finalBlNo = blNo || generateBlNo();
  const finalSubmitTime = submitTime || new Date().toISOString();
  const finalProcessTime = processTime || new Date().toISOString();

  const transaction = db.transaction(() => {
    if (!hxRecord.allow_partial_success) {
      updateHxStmt.run(hxId);
    }

    insertBlStmt.run(
      finalBlNo,
      hxId,
      babyId || null,
      materialType || null,
      materialDesc || null,
      finalSubmitTime,
      processStatus,
      processResult || null,
      finalProcessTime
    );

    auditService.logAudit({
      hxId,
      operationType: '追加补录材料',
      statusBefore: hxRecord.is_closed ? '已关闭' : '未关闭',
      statusAfter: hxRecord.is_closed ? '已关闭（已追加补录）' : '未关闭（已追加补录）',
      operator,
      operatorName,
      operationSource: '人工操作',
      needReview: false,
      remark: `已关闭核销${hxRecord.hx_no}后追加补录，自动勾选允许部分成功`
    });
  });

  transaction();

  return {
    blNo: finalBlNo,
    hxId,
    allowPartialSuccess: true
  };
}

function updateHxStatus(hxId, status, operator, operatorName) {
  const db = getDb();
  const auditService = require('./auditService');

  if (!operatorName) {
    throw new Error('处理人姓名冗余(operatorName)不能为空');
  }

  const getCurrentStmt = db.prepare(`
    SELECT process_status, process_time 
    FROM hx_records 
    WHERE id = ?
  `);

  const updateStmt = db.prepare(`
    UPDATE hx_records 
    SET process_status = ?, process_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  const current = getCurrentStmt.get(hxId);
  if (!current) {
    throw new Error(`核销记录 ${hxId} 不存在`);
  }

  const statusBefore = current.process_status || '未知';
  const statusAfter = status;

  const transaction = db.transaction(() => {
    updateStmt.run(status, hxId);

    auditService.logAudit({
      hxId,
      operationType: '更新核销状态',
      statusBefore,
      statusAfter: `${statusBefore}→${statusAfter}`,
      operator,
      operatorName,
      operationSource: '人工操作',
      needReview: false
    });
  });

  transaction();

  return {
    hxId,
    statusBefore,
    statusAfter
  };
}

function markBadRow(hxId, reason, operatorName) {
  const db = getDb();
  const auditService = require('./auditService');

  if (!operatorName) {
    throw new Error('处理人姓名冗余(operatorName)不能为空');
  }

  const getCurrentStmt = db.prepare(`
    SELECT row_status 
    FROM hx_records 
    WHERE id = ?
  `);

  const updateStmt = db.prepare(`
    UPDATE hx_records 
    SET row_status = '异常隔离', abnormal_reason = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  const current = getCurrentStmt.get(hxId);
  if (!current) {
    throw new Error(`核销记录 ${hxId} 不存在`);
  }

  const transaction = db.transaction(() => {
    updateStmt.run(reason, hxId);

    auditService.logAudit({
      hxId,
      operationType: '数据异常标记',
      statusBefore: current.row_status || '正常',
      statusAfter: '异常隔离',
      operator: null,
      operatorName,
      operationSource: '系统自动',
      needReview: true,
      remark: reason
    });
  });

  transaction();

  return {
    hxId,
    rowStatus: '异常隔离',
    reason
  };
}

function getCompleteTrace(hxId) {
  const db = getDb();

  const hxStmt = db.prepare(`
    SELECT h.*, b.baby_name, b.baby_no
    FROM hx_records h
    LEFT JOIN baby_records b ON h.baby_id = b.id
    WHERE h.id = ?
  `);

  const flowStmt = db.prepare(`
    SELECT f.*, b.baby_name as flow_baby_name
    FROM flow_records f
    LEFT JOIN baby_records b ON f.baby_id = b.id
    WHERE f.id = ?
  `);

  const blStmt = db.prepare(`
    SELECT * FROM bl_records 
    WHERE hx_id = ? 
    ORDER BY created_at ASC
  `);

  const auditStmt = db.prepare(`
    SELECT * FROM audit_records 
    WHERE hx_id = ? 
    ORDER BY operation_time ASC
  `);

  const hx = hxStmt.get(hxId);
  if (!hx) {
    return null;
  }

  const flow = hx.flow_id ? flowStmt.get(hx.flow_id) : null;
  const blRecords = blStmt.all(hxId);
  const audits = auditStmt.all(hxId);

  return {
    hx,
    flow,
    blRecords,
    audits,
    summary: {
      hxNo: hx.hx_no,
      rowStatus: hx.row_status,
      isClosed: !!hx.is_closed,
      allowPartialSuccess: !!hx.allow_partial_success,
      blCount: blRecords.length,
      auditCount: audits.length,
      hasBadRow: hx.row_status === '异常隔离'
    }
  };
}

module.exports = {
  createHxRecord,
  addBlToClosedHx,
  updateHxStatus,
  markBadRow,
  getCompleteTrace
};
