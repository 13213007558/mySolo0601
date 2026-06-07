import { v4 as uuidv4 } from 'uuid';
import { sanitizeLogData } from './privacy.js';
export class Database {
    users = [];
    babies = [];
    records = [];
    scans = [];
    auditLogs = [];
    constructor() {
        this.seed();
    }
    seed() {
        this.users = [
            { id: 'u_consultant_1', name: '李老师', role: 'consultant', phone: '13800000001' },
            { id: 'u_consultant_2', name: '王老师', role: 'consultant', phone: '13800000002' },
            { id: 'u_store_1', name: '张店员', role: 'store_staff', phone: '13800000003' },
            { id: 'u_supervisor_1', name: '赵主管', role: 'supervisor', phone: '13800000004' },
            { id: 'u_admin_1', name: '系统管理员', role: 'admin', phone: '13800000005' }
        ];
        this.babies = [
            { id: 'b_001', name: '小明', className: '向日葵班', guardianName: '陈先生', guardianPhone: '13900001111', guardianIdNo: '310101199001011234', dateOfBirth: '2022-03-15', allergies: '牛奶过敏' },
            { id: 'b_002', name: '小红', className: '向日葵班', guardianName: '刘女士', guardianPhone: '13900002222', guardianIdNo: '310101199202022345', dateOfBirth: '2022-05-20' },
            { id: 'b_003', name: '小刚', className: '蒲公英班', guardianName: '王先生', guardianPhone: '13900003333', guardianIdNo: '310101198803033456', dateOfBirth: '2021-09-10', allergies: '花生过敏' },
            { id: 'b_004', name: '小丽', className: '蒲公英班', guardianName: '张女士', guardianPhone: '13900004444', guardianIdNo: '310101199504044567', dateOfBirth: '2023-01-08' }
        ];
        const now = Date.now();
        const hour = 3600 * 1000;
        this.records = [
            {
                id: 'r_001', babyId: 'b_001', babyName: '小明', className: '向日葵班',
                itemType: 'bottle', itemName: '贝亲宽口径奶瓶',
                borrowScanId: 's_001', returnScanId: undefined,
                borrowTime: now - 3 * hour, expectedReturnTime: now - 1 * hour,
                status: 'abnormal',
                abnormalReason: '超出预期归还时间 2 小时，联系不上家长',
                remarks: [
                    { id: 'rm_001', timestamp: now - 3 * hour, operatorId: 'u_store_1', operatorName: '张店员', content: '家长承诺今天下午4点前归还', source: 'original_commitment' }
                ],
                createdAt: now - 4 * hour, updatedAt: now - 1 * hour, isManualEntry: false
            },
            {
                id: 'r_002', babyId: 'b_002', babyName: '小红', className: '向日葵班',
                itemType: 'toy', itemName: '毛绒小熊',
                borrowScanId: 's_002', returnScanId: 's_003',
                borrowTime: now - 5 * hour, returnTime: now - 2 * hour, disinfectionTime: now - 1.5 * hour,
                expectedReturnTime: now - 1 * hour,
                status: 'processed',
                processorId: 'u_store_1', processorName: '张店员', processTime: now - 1.5 * hour,
                handleResult: '已归还并完成消毒',
                remarks: [
                    { id: 'rm_002', timestamp: now - 5 * hour, operatorId: 'u_consultant_1', operatorName: '李老师', content: '家长承诺放学时归还', source: 'original_commitment' }
                ],
                createdAt: now - 6 * hour, updatedAt: now - 1.5 * hour, isManualEntry: false
            },
            {
                id: 'r_003', babyId: 'b_003', babyName: '小刚', className: '蒲公英班',
                itemType: 'towel', itemName: '纯棉小毛巾（蓝色）',
                borrowScanId: 's_004', returnScanId: undefined,
                borrowTime: now - 8 * hour, expectedReturnTime: now - 2 * hour,
                status: 'processing',
                processorId: 'u_consultant_2', processorName: '王老师',
                abnormalReason: '毛巾丢失，已通知家长寻找',
                remarks: [
                    { id: 'rm_003', timestamp: now - 8 * hour, operatorId: 'u_consultant_2', operatorName: '王老师', content: '家长承诺明天归还', source: 'original_commitment' },
                    { id: 'rm_004', timestamp: now - 3 * hour, operatorId: 'u_consultant_2', operatorName: '王老师', content: '家长临时改口：毛巾可能丢在家里，明天带来确认', source: 'supplement' }
                ],
                createdAt: now - 9 * hour, updatedAt: now - 3 * hour, isManualEntry: false
            },
            {
                id: 'r_004', babyId: 'b_004', babyName: '小丽', className: '蒲公英班',
                itemType: 'tableware', itemName: '儿童不锈钢餐具套装',
                borrowScanId: undefined, returnScanId: undefined,
                expectedReturnTime: now + 2 * hour,
                status: 'pending',
                remarks: [],
                createdAt: now - 30 * 60 * 1000, updatedAt: now - 30 * 60 * 1000, isManualEntry: true
            },
            {
                id: 'r_005', babyId: 'b_001', babyName: '小明', className: '向日葵班',
                itemType: 'blanket', itemName: '午睡小毛毯（小熊图案）',
                borrowScanId: 's_005', returnScanId: 's_006',
                borrowTime: now - 26 * hour, returnTime: now - 2 * hour, disinfectionTime: now - 1 * hour,
                expectedReturnTime: now - 24 * hour,
                status: 'processed',
                processorId: 'u_consultant_1', processorName: '李老师', processTime: now - 1 * hour,
                handleResult: '超时归还，已完成消毒并记录家长说明',
                remarks: [
                    { id: 'rm_005', timestamp: now - 26 * hour, operatorId: 'u_store_1', operatorName: '张店员', content: '家长承诺当天放学归还', source: 'original_commitment' },
                    { id: 'rm_006', timestamp: now - 2 * hour, operatorId: 'u_consultant_1', operatorName: '李老师', content: '家长补充：孩子生病住院，刚出院，今天把毛毯送过来', source: 'supplement' },
                    { id: 'rm_007', timestamp: now - 1 * hour, operatorId: 'u_consultant_1', operatorName: '李老师', content: '状态变更为已处理', source: 'status_change' }
                ],
                createdAt: now - 27 * hour, updatedAt: now - 1 * hour, isManualEntry: false
            }
        ];
        this.scans = [
            { id: 's_001', recordId: 'r_001', type: 'borrow', timestamp: now - 3 * hour, operatorId: 'u_store_1', operatorName: '张店员', deviceCode: 'SCAN-A-01' },
            { id: 's_002', recordId: 'r_002', type: 'borrow', timestamp: now - 5 * hour, operatorId: 'u_consultant_1', operatorName: '李老师', deviceCode: 'SCAN-A-02' },
            { id: 's_003', recordId: 'r_002', type: 'return', timestamp: now - 2 * hour, operatorId: 'u_store_1', operatorName: '张店员', deviceCode: 'SCAN-A-01' },
            { id: 's_004', recordId: 'r_003', type: 'borrow', timestamp: now - 8 * hour, operatorId: 'u_consultant_2', operatorName: '王老师', deviceCode: 'SCAN-B-01' },
            { id: 's_005', recordId: 'r_005', type: 'borrow', timestamp: now - 26 * hour, operatorId: 'u_store_1', operatorName: '张店员', deviceCode: 'SCAN-A-01' },
            { id: 's_006', recordId: 'r_005', type: 'return', timestamp: now - 2 * hour, operatorId: 'u_consultant_1', operatorName: '李老师', deviceCode: 'SCAN-A-02' }
        ];
        this.auditLogs = [];
        for (const r of this.records) {
            this.auditLogs.push({
                id: 'a_' + uuidv4().slice(0, 8),
                timestamp: r.createdAt,
                operatorId: r.remarks[0]?.operatorId || 'u_store_1',
                operatorName: r.remarks[0]?.operatorName || '张店员',
                operatorRole: r.remarks[0]?.operatorId === 'u_store_1' ? 'store_staff' : 'consultant',
                action: '创建记录',
                recordId: r.id,
                oldStatus: undefined,
                newStatus: r.status,
                clientIp: '192.168.1.10'
            });
        }
    }
    addAudit(operatorId, operatorName, operatorRole, action, recordId, oldStatus, newStatus, diff, clientIp) {
        const log = {
            id: 'a_' + uuidv4().slice(0, 8),
            timestamp: Date.now(),
            operatorId, operatorName, operatorRole,
            action, recordId, oldStatus, newStatus,
            diff, clientIp
        };
        this.auditLogs.push(log);
        console.log('[AUDIT]', JSON.stringify(sanitizeLogData(log)));
        return log;
    }
    addRemark(recordId, remark) {
        const record = this.records.find(r => r.id === recordId);
        if (!record)
            return null;
        const fullRemark = { id: 'rm_' + uuidv4().slice(0, 8), ...remark };
        record.remarks.push(fullRemark);
        record.updatedAt = Date.now();
        return fullRemark;
    }
    findUser(id) {
        return this.users.find(u => u.id === id);
    }
    findBaby(id) {
        return this.babies.find(b => b.id === id);
    }
}
export const db = new Database();
