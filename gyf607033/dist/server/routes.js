import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import { db } from './db.js';
import { filterBabyByRole, filterRecordByRole, filterAuditByRole, sanitizeLogData } from './privacy.js';
const router = Router();
function getRole(req) {
    const roleHeader = req.headers['x-user-role'] || 'consultant';
    const validRoles = ['consultant', 'store_staff', 'supervisor', 'admin'];
    return validRoles.includes(roleHeader) ? roleHeader : 'consultant';
}
function getOperatorInfo(req) {
    const role = getRole(req);
    const id = req.headers['x-user-id'] || 'u_consultant_1';
    const name = req.headers['x-user-name'] || '李老师';
    const user = db.findUser(id);
    return {
        id: user?.id || id,
        name: user?.name || name,
        role: user?.role || role
    };
}
function getClientIp(req) {
    return (req.headers['x-forwarded-for']?.split(',')[0].trim() ||
        req.headers['x-real-ip'] ||
        req.ip ||
        'unknown');
}
router.get('/me', (req, res) => {
    const op = getOperatorInfo(req);
    res.json({ success: true, data: op });
});
router.get('/records', (req, res) => {
    const role = getRole(req);
    const { babyId, className, status } = req.query;
    const babiesMap = new Map(db.babies.map(b => [b.id, b]));
    let list = db.records.slice();
    if (babyId)
        list = list.filter(r => r.babyId === babyId);
    if (className)
        list = list.filter(r => r.className === className);
    if (status)
        list = list.filter(r => r.status === status);
    const filtered = list.map(r => filterRecordByRole(r, role, babiesMap));
    const filteredBabies = db.babies.map(b => filterBabyByRole(b, role));
    res.json({
        success: true,
        data: { records: filtered, babies: filteredBabies }
    });
});
router.get('/records/:id', (req, res) => {
    const role = getRole(req);
    const record = db.records.find(r => r.id === req.params.id);
    if (!record) {
        return res.status(404).json({ success: false, error: '记录不存在' });
    }
    const babiesMap = new Map(db.babies.map(b => [b.id, b]));
    const baby = db.findBaby(record.babyId);
    const scans = db.scans.filter(s => s.recordId === record.id);
    const audits = db.auditLogs
        .filter(a => a.recordId === record.id)
        .map(a => filterAuditByRole(a, role))
        .sort((a, b) => b.timestamp - a.timestamp);
    res.json({
        success: true,
        data: {
            record: filterRecordByRole(record, role, babiesMap),
            baby: baby ? filterBabyByRole(baby, role) : null,
            scans,
            audits
        }
    });
});
router.post('/records/:id/handle', (req, res) => {
    const op = getOperatorInfo(req);
    const body = req.body;
    const record = db.records.find(r => r.id === req.params.id);
    if (!record) {
        return res.status(404).json({ success: false, error: '记录不存在' });
    }
    if (!body.status) {
        return res.status(400).json({ success: false, error: '缺少 status 参数' });
    }
    const validTransitions = {
        pending: ['abnormal', 'processing'],
        abnormal: ['processing', 'processed', 'reverted'],
        processing: ['processed', 'reverted', 'abnormal'],
        processed: ['reverted'],
        reverted: ['processing', 'abnormal']
    };
    if (!validTransitions[record.status].includes(body.status)) {
        return res.status(400).json({
            success: false,
            error: `不允许从 ${record.status} 变更为 ${body.status}`
        });
    }
    const oldStatus = record.status;
    const diff = {};
    diff.status = { old: oldStatus, new: body.status };
    record.status = body.status;
    record.processorId = op.id;
    record.processorName = op.name;
    record.processTime = Date.now();
    if (body.handleResult) {
        diff.handleResult = { old: record.handleResult, new: body.handleResult };
        record.handleResult = body.handleResult;
    }
    record.remarks.push({
        id: 'rm_' + uuidv4().slice(0, 8),
        timestamp: Date.now(),
        operatorId: op.id,
        operatorName: op.name,
        content: `状态变更：${oldStatus} → ${body.status}${body.handleResult ? '；处理结果：' + body.handleResult : ''}`,
        source: 'status_change'
    });
    if (body.supplementRemark) {
        record.remarks.push({
            id: 'rm_' + uuidv4().slice(0, 8),
            timestamp: Date.now(),
            operatorId: op.id,
            operatorName: op.name,
            content: body.supplementRemark,
            source: 'supplement'
        });
        diff.supplementRemark = { old: undefined, new: body.supplementRemark };
    }
    record.updatedAt = Date.now();
    db.addAudit(op.id, op.name, op.role, '处理异常', record.id, oldStatus, body.status, diff, getClientIp(req));
    console.log('[RECORD_UPDATED]', JSON.stringify(sanitizeLogData({ id: record.id, status: record.status, processor: op.name })));
    const babiesMap = new Map(db.babies.map(b => [b.id, b]));
    res.json({
        success: true,
        data: {
            record: filterRecordByRole(record, op.role, babiesMap),
            classSummary: buildClassSummary(op.role)
        }
    });
});
router.post('/records/:id/revert', (req, res) => {
    const op = getOperatorInfo(req);
    const record = db.records.find(r => r.id === req.params.id);
    if (!record) {
        return res.status(404).json({ success: false, error: '记录不存在' });
    }
    if (op.role !== 'supervisor' && op.role !== 'admin') {
        return res.status(403).json({ success: false, error: '只有主管或管理员可以回退状态' });
    }
    if (record.status !== 'processed') {
        return res.status(400).json({ success: false, error: '只能回退已处理的记录' });
    }
    const oldStatus = record.status;
    const newStatus = 'reverted';
    record.status = newStatus;
    record.updatedAt = Date.now();
    record.remarks.push({
        id: 'rm_' + uuidv4().slice(0, 8),
        timestamp: Date.now(),
        operatorId: op.id,
        operatorName: op.name,
        content: `主管回退状态：${oldStatus} → ${newStatus}，需要复查处理结果`,
        source: 'status_change'
    });
    db.addAudit(op.id, op.name, op.role, '状态回退（保留审计供主管复查）', record.id, oldStatus, newStatus, { revertReason: { old: undefined, new: req.body?.reason || '主管复查' } }, getClientIp(req));
    console.log('[RECORD_REVERTED]', JSON.stringify(sanitizeLogData({ id: record.id, operator: op.name })));
    const babiesMap = new Map(db.babies.map(b => [b.id, b]));
    res.json({
        success: true,
        data: {
            record: filterRecordByRole(record, op.role, babiesMap),
            classSummary: buildClassSummary(op.role)
        }
    });
});
router.post('/records/:id/remarks', (req, res) => {
    const op = getOperatorInfo(req);
    const record = db.records.find(r => r.id === req.params.id);
    if (!record) {
        return res.status(404).json({ success: false, error: '记录不存在' });
    }
    const content = req.body?.content;
    if (!content) {
        return res.status(400).json({ success: false, error: '备注内容不能为空' });
    }
    const remark = db.addRemark(record.id, {
        timestamp: Date.now(),
        operatorId: op.id,
        operatorName: op.name,
        content,
        source: 'supplement'
    });
    db.addAudit(op.id, op.name, op.role, '补充备注', record.id, undefined, undefined, { remark: { old: undefined, new: content } }, getClientIp(req));
    console.log('[REMARK_ADDED]', JSON.stringify(sanitizeLogData({ id: record.id, operator: op.name })));
    res.json({ success: true, data: remark });
});
router.post('/records/batch-handle', (req, res) => {
    const op = getOperatorInfo(req);
    const body = req.body;
    if (!body.items || !Array.isArray(body.items)) {
        return res.status(400).json({ success: false, error: 'items 参数无效' });
    }
    const succeeded = [];
    const failed = [];
    for (const item of body.items) {
        try {
            const record = db.records.find(r => r.id === item.id);
            if (!record) {
                failed.push({ id: item.id, reason: '记录不存在' });
                continue;
            }
            const validTransitions = {
                pending: ['abnormal', 'processing'], abnormal: ['processing', 'processed', 'reverted'],
                processing: ['processed', 'reverted', 'abnormal'], processed: ['reverted'], reverted: ['processing', 'abnormal']
            };
            if (!validTransitions[record.status].includes(item.status)) {
                failed.push({ id: item.id, reason: `状态变更不允许 ${record.status}→${item.status}` });
                continue;
            }
            const oldStatus = record.status;
            record.status = item.status;
            record.processorId = op.id;
            record.processorName = op.name;
            record.processTime = Date.now();
            if (item.handleResult)
                record.handleResult = item.handleResult;
            record.remarks.push({
                id: 'rm_' + uuidv4().slice(0, 8), timestamp: Date.now(), operatorId: op.id, operatorName: op.name,
                content: `批量处理：${oldStatus}→${item.status}${item.handleResult ? '；' + item.handleResult : ''}`,
                source: 'status_change'
            });
            if (item.supplementRemark) {
                record.remarks.push({
                    id: 'rm_' + uuidv4().slice(0, 8), timestamp: Date.now(), operatorId: op.id, operatorName: op.name,
                    content: item.supplementRemark, source: 'supplement'
                });
            }
            record.updatedAt = Date.now();
            db.addAudit(op.id, op.name, op.role, '批量处理', record.id, oldStatus, item.status, undefined, getClientIp(req));
            succeeded.push(item.id);
        }
        catch (e) {
            failed.push({ id: item.id, reason: e.message || '未知错误' });
        }
    }
    console.log('[BATCH_RESULT]', JSON.stringify(sanitizeLogData({ succeeded: succeeded.length, failed: failed.length, operator: op.name })));
    res.json({
        success: failed.length === 0,
        partialSuccess: { succeeded, failed },
        message: failed.length === 0 ? '全部成功' : `部分成功：成功 ${succeeded.length} 条，失败 ${failed.length} 条`,
        data: { classSummary: buildClassSummary(op.role) }
    });
});
router.get('/classes/summary', (req, res) => {
    const role = getRole(req);
    res.json({ success: true, data: buildClassSummary(role) });
});
function buildClassSummary(role) {
    const classes = Array.from(new Set(db.records.map(r => r.className)));
    const babiesMap = new Map(db.babies.map(b => [b.id, b]));
    return classes.map(className => {
        const classRecords = db.records.filter(r => r.className === className);
        const statusCount = {};
        for (const r of classRecords) {
            statusCount[r.status] = (statusCount[r.status] || 0) + 1;
        }
        const babyIds = Array.from(new Set(classRecords.map(r => r.babyId)));
        const babies = babyIds
            .map(id => db.findBaby(id))
            .filter(Boolean)
            .map(b => filterBabyByRole(b, role));
        const records = classRecords.map(r => filterRecordByRole(r, role, babiesMap));
        return { className, statusCount, babies, records };
    });
}
router.get('/babies/:id', (req, res) => {
    const role = getRole(req);
    const baby = db.findBaby(req.params.id);
    if (!baby) {
        return res.status(404).json({ success: false, error: '宝宝不存在' });
    }
    const babiesMap = new Map(db.babies.map(b => [b.id, b]));
    const records = db.records
        .filter(r => r.babyId === baby.id)
        .map(r => filterRecordByRole(r, role, babiesMap))
        .sort((a, b) => b.createdAt - a.createdAt);
    res.json({
        success: true,
        data: { baby: filterBabyByRole(baby, role), records }
    });
});
router.get('/scans', (req, res) => {
    const role = getRole(req);
    const { recordId } = req.query;
    let list = db.scans.slice();
    if (recordId)
        list = list.filter(s => s.recordId === recordId);
    const enriched = list.map(s => {
        const record = db.records.find(r => r.id === s.recordId);
        return {
            ...s,
            operatorName: s.operatorName || record?.processorName || '未知',
            operatorId: s.operatorId || record?.processorId
        };
    });
    res.json({ success: true, data: enriched });
});
router.post('/records/manual', (req, res) => {
    const op = getOperatorInfo(req);
    const body = req.body;
    if (!body.babyId || !body.itemType || !body.itemName || !body.expectedReturnTime) {
        return res.status(400).json({ success: false, error: '缺少必填字段' });
    }
    const baby = db.findBaby(body.babyId);
    if (!baby) {
        return res.status(404).json({ success: false, error: '宝宝不存在' });
    }
    const record = {
        id: 'r_' + uuidv4().slice(0, 8),
        babyId: baby.id,
        babyName: baby.name,
        className: baby.className,
        itemType: body.itemType,
        itemName: body.itemName,
        expectedReturnTime: body.expectedReturnTime,
        status: body.status || 'pending',
        remarks: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isManualEntry: true
    };
    if (body.originalCommitment) {
        record.remarks.push({
            id: 'rm_' + uuidv4().slice(0, 8),
            timestamp: Date.now(),
            operatorId: op.id,
            operatorName: op.name,
            content: body.originalCommitment,
            source: 'original_commitment'
        });
    }
    db.records.push(record);
    db.addAudit(op.id, op.name, op.role, '手工补录记录', record.id, undefined, record.status, undefined, getClientIp(req));
    console.log('[MANUAL_ENTRY]', JSON.stringify(sanitizeLogData({ id: record.id, operator: op.name })));
    const babiesMap = new Map(db.babies.map(b => [b.id, b]));
    res.json({
        success: true,
        data: {
            record: filterRecordByRole(record, op.role, babiesMap),
            classSummary: buildClassSummary(op.role)
        }
    });
});
router.get('/export', (req, res) => {
    const role = getRole(req);
    const op = getOperatorInfo(req);
    const babiesMap = new Map(db.babies.map(b => [b.id, b]));
    const rows = db.records.map(r => {
        const record = filterRecordByRole(r, role, babiesMap);
        const baby = db.findBaby(r.babyId);
        const filteredBaby = baby ? filterBabyByRole(baby, role) : null;
        const latestRemark = [...record.remarks].reverse().find(rm => rm.source === 'supplement')
            || [...record.remarks].reverse().find(rm => rm.source === 'original_commitment');
        return {
            '记录ID': record.id,
            '班级': record.className,
            '宝宝姓名': record.babyName,
            '家长姓名': filteredBaby?.guardianName || '',
            '家长电话': filteredBaby?.guardianPhone || '',
            '物品种类': record.itemType,
            '物品名称': record.itemName,
            '借出时间': record.borrowTime ? new Date(record.borrowTime).toLocaleString('zh-CN') : '',
            '预计归还时间': new Date(record.expectedReturnTime).toLocaleString('zh-CN'),
            '归还时间': record.returnTime ? new Date(record.returnTime).toLocaleString('zh-CN') : '',
            '消毒时间': record.disinfectionTime ? new Date(record.disinfectionTime).toLocaleString('zh-CN') : '',
            '状态': record.status,
            '处理人': record.processorName || '',
            '处理时间': record.processTime ? new Date(record.processTime).toLocaleString('zh-CN') : '',
            '异常原因': record.abnormalReason || '',
            '处理结果': record.handleResult || '',
            '最新备注/承诺': latestRemark?.content || '',
            '最新备注人': latestRemark?.operatorName || '',
            '手工补录': record.isManualEntry ? '是' : '否'
        };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '消毒提醒清单');
    const auditWs = XLSX.utils.json_to_sheet(db.auditLogs.map(a => ({
        '时间': new Date(a.timestamp).toLocaleString('zh-CN'),
        '操作人': a.operatorName,
        '角色': a.operatorRole,
        '动作': a.action,
        '记录ID': a.recordId,
        '原状态': a.oldStatus || '',
        '新状态': a.newStatus || '',
        'IP': a.clientIp || ''
    })));
    XLSX.utils.book_append_sheet(wb, auditWs, '操作审计');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    db.addAudit(op.id, op.name, op.role, '导出清单', 'all', undefined, undefined, { rowCount: { old: undefined, new: rows.length } }, getClientIp(req));
    console.log('[EXPORT]', JSON.stringify(sanitizeLogData({ operator: op.name, role: op.role, rows: rows.length })));
    const filename = `消毒提醒清单_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(Buffer.from(buf));
});
router.get('/audit-logs', (req, res) => {
    const role = getRole(req);
    if (role !== 'supervisor' && role !== 'admin') {
        return res.status(403).json({ success: false, error: '只有主管或管理员可以查看审计日志' });
    }
    const logs = db.auditLogs
        .slice()
        .sort((a, b) => b.timestamp - a.timestamp)
        .map(a => filterAuditByRole(a, role));
    res.json({ success: true, data: logs });
});
router.get('/babies', (req, res) => {
    const role = getRole(req);
    const filtered = db.babies.map(b => filterBabyByRole(b, role));
    res.json({ success: true, data: filtered });
});
export default router;
