import { db } from './db.js';

export function seedData() {
  const row = db.prepare('SELECT COUNT(*) as c FROM authorizations').get() as { c: number };
  if (row.c > 0) return;

  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString();

  const insertAuth = db.prepare(`
    INSERT INTO authorizations (id, baby_name, baby_birth, parent_phone, parent_name, store_name, auth_type, auth_status, created_at, updated_at, last_operator)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPickup = db.prepare(`
    INSERT INTO pickup_persons (id, auth_id, name, relation, phone, id_card, is_phone_auth, auth_start, auth_end, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMaterial = db.prepare(`
    INSERT INTO materials (id, auth_id, name, type, status, uploaded_at, uploader)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (id, auth_id, operator, operator_role, action, field, old_value, new_value, reason, timestamp, ip)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertCorrection = db.prepare(`
    INSERT INTO corrections (id, auth_id, before_data, after_data, reason, operator, reviewed_by, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertExport = db.prepare(`
    INSERT INTO export_records (id, operator, format, filter_criteria, page_count, export_count, diff_count, status, missing_ids, created_at, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const authorizations = [
    { id: 'A001', babyName: '李小宝', babyBirth: '2023-05-12', parentPhone: '13800138001', parentName: '李明', storeName: '梧桐社区店', authType: 'primary', authStatus: 'active', createdAt: lastWeek, updatedAt: yesterday, lastOperator: '张店长' },
    { id: 'A002', babyName: '王小丫', babyBirth: '2022-11-03', parentPhone: '13800138002', parentName: '王芳', storeName: '梧桐社区店', authType: 'temporary', authStatus: 'active', createdAt: lastWeek, updatedAt: yesterday, lastOperator: '张店长' },
    { id: 'A003', babyName: '赵小阳', babyBirth: '2024-01-20', parentPhone: '13800138003', parentName: '赵强', storeName: '梧桐社区店', authType: 'phone', authStatus: 'active', createdAt: lastWeek, updatedAt: yesterday, lastOperator: '张店长' },
    { id: 'A004', babyName: '陈小雨', babyBirth: '2023-08-15', parentPhone: '13800138004', parentName: '陈静', storeName: '梧桐社区店', authType: 'temporary', authStatus: 'failed', createdAt: lastWeek, updatedAt: yesterday, lastOperator: '张店长' },
    { id: 'A005', babyName: '孙小龙', babyBirth: '2022-03-22', parentPhone: '13800138005', parentName: '孙伟', storeName: '翠竹社区店', authType: 'primary', authStatus: 'active', createdAt: lastWeek, updatedAt: yesterday, lastOperator: '刘店长' },
    { id: 'A006', babyName: '周小琳', babyBirth: '2024-02-10', parentPhone: '13800138006', parentName: '周丽', storeName: '翠竹社区店', authType: 'phone', authStatus: 'pending', createdAt: lastWeek, updatedAt: yesterday, lastOperator: '刘店长' },
    { id: 'A007', babyName: '吴小峰', babyBirth: '2023-09-30', parentPhone: '13800138007', parentName: '吴刚', storeName: '翠竹社区店', authType: 'primary', authStatus: 'revoked', createdAt: lastWeek, updatedAt: yesterday, lastOperator: '刘店长' },
    { id: 'A008', babyName: '郑小婷', babyBirth: '2023-06-18', parentPhone: '13800138008', parentName: '郑华', storeName: '梧桐社区店', authType: 'temporary', authStatus: 'corrected', createdAt: lastWeek, updatedAt: yesterday, lastOperator: '张店长' },
    { id: 'A009', babyName: '钱小明', babyBirth: '2022-12-05', parentPhone: '13800138009', parentName: '钱军', storeName: '梧桐社区店', authType: 'primary', authStatus: 'active', createdAt: lastWeek, updatedAt: yesterday, lastOperator: '张店长' },
    { id: 'A010', babyName: '冯小燕', babyBirth: '2024-03-08', parentPhone: '13800138010', parentName: '冯梅', storeName: '翠竹社区店', authType: 'phone', authStatus: 'active', createdAt: lastWeek, updatedAt: yesterday, lastOperator: '刘店长' },
    { id: 'A011', babyName: '黄小飞', babyBirth: '2023-04-14', parentPhone: '13800138011', parentName: '黄磊', storeName: '梧桐社区店', authType: 'temporary', authStatus: 'active', createdAt: lastWeek, updatedAt: yesterday, lastOperator: '张店长' },
    { id: 'A012', babyName: '徐小欣', babyBirth: '2022-07-29', parentPhone: '13800138012', parentName: '徐敏', storeName: '翠竹社区店', authType: 'primary', authStatus: 'failed', createdAt: lastWeek, updatedAt: yesterday, lastOperator: '刘店长' },
  ];

  authorizations.forEach(a => {
    insertAuth.run(a.id, a.babyName, a.babyBirth, a.parentPhone, a.parentName, a.storeName, a.authType, a.authStatus, a.createdAt, a.updatedAt, a.lastOperator);
  });

  const pickups = [
    { id: 'P001', authId: 'A001', name: '李明', relation: '父亲', phone: '13800138001', idCard: '440101199001011234', isPhoneAuth: 0, authStart: '2024-01-01', authEnd: '2025-12-31', remark: '主接送人' },
    { id: 'P002', authId: 'A001', name: '李秀英', relation: '母亲', phone: '13800138013', idCard: '440101199203052345', isPhoneAuth: 0, authStart: '2024-01-01', authEnd: '2025-12-31', remark: '主接送人' },
    { id: 'P003', authId: 'A002', name: '王芳', relation: '母亲', phone: '13800138002', idCard: '440101199106123456', isPhoneAuth: 0, authStart: '2024-06-01', authEnd: '2024-08-31', remark: '暑假临时接送' },
    { id: 'P004', authId: 'A002', name: '张阿姨', relation: '临时阿姨', phone: '13800138014', idCard: '', isPhoneAuth: 1, authStart: '2024-06-15', authEnd: '2024-07-15', remark: '电话授权临时阿姨，店长已电话确认' },
    { id: 'P005', authId: 'A003', name: '赵强', relation: '父亲', phone: '13800138003', idCard: '', isPhoneAuth: 1, authStart: '2024-03-01', authEnd: '2024-09-01', remark: '电话授权，未现场核验身份证' },
    { id: 'P006', authId: 'A004', name: '陈静', relation: '母亲', phone: '13800138004', idCard: '', isPhoneAuth: 1, authStart: '2024-05-01', authEnd: '2024-06-01', remark: '临时阿姨信息缺失，授权失败' },
    { id: 'P007', authId: 'A005', name: '孙伟', relation: '父亲', phone: '13800138005', idCard: '440101198805204567', isPhoneAuth: 0, authStart: '2024-01-01', authEnd: '2025-12-31', remark: '' },
    { id: 'P008', authId: 'A006', name: '周丽', relation: '母亲', phone: '13800138006', idCard: '', isPhoneAuth: 1, authStart: '2024-04-01', authEnd: '2024-10-01', remark: '待客服电话回拨确认' },
    { id: 'P009', authId: 'A008', name: '郑华', relation: '父亲', phone: '13800138008', idCard: '440101198911105678', isPhoneAuth: 0, authStart: '2024-02-01', authEnd: '2025-02-28', remark: '已人工更正阿姨姓名拼写' },
    { id: 'P010', authId: 'A009', name: '钱军', relation: '父亲', phone: '13800138009', idCard: '440101198704156789', isPhoneAuth: 0, authStart: '2024-01-01', authEnd: '2025-12-31', remark: '' },
    { id: 'P011', authId: 'A010', name: '冯梅', relation: '母亲', phone: '13800138010', idCard: '', isPhoneAuth: 1, authStart: '2024-04-01', authEnd: '2024-10-01', remark: '电话授权' },
    { id: 'P012', authId: 'A011', name: '李阿姨', relation: '临时阿姨', phone: '13800138015', idCard: '440101197503207890', isPhoneAuth: 0, authStart: '2024-05-01', authEnd: '2024-11-30', remark: '临时接送半年' },
    { id: 'P013', authId: 'A012', name: '徐敏', relation: '母亲', phone: '13800138012', idCard: '', isPhoneAuth: 1, authStart: '2024-03-01', authEnd: '2024-04-01', remark: '材料缺页，授权失败' },
  ];

  pickups.forEach(p => {
    insertPickup.run(p.id, p.authId, p.name, p.relation, p.phone, p.idCard, p.isPhoneAuth, p.authStart, p.authEnd, p.remark);
  });

  const materials = [
    { id: 'M001', authId: 'A001', name: '接送授权书.pdf', type: 'auth_letter', status: 'ok', uploadedAt: lastWeek, uploader: '张店长' },
    { id: 'M002', authId: 'A001', name: '父亲身份证.jpg', type: 'id_card', status: 'ok', uploadedAt: lastWeek, uploader: '张店长' },
    { id: 'M003', authId: 'A002', name: '接送授权书.pdf', type: 'auth_letter', status: 'ok', uploadedAt: lastWeek, uploader: '张店长' },
    { id: 'M004', authId: 'A003', name: '电话授权确认记录.txt', type: 'other', status: 'ok', uploadedAt: lastWeek, uploader: '张店长' },
    { id: 'M005', authId: 'A004', name: '接送授权书.pdf', type: 'auth_letter', status: 'missing', uploadedAt: lastWeek, uploader: '张店长' },
    { id: 'M006', authId: 'A004', name: '临时阿姨身份证.jpg', type: 'id_card', status: 'missing', uploadedAt: lastWeek, uploader: '张店长' },
    { id: 'M007', authId: 'A005', name: '接送授权书.pdf', type: 'auth_letter', status: 'ok', uploadedAt: lastWeek, uploader: '刘店长' },
    { id: 'M008', authId: 'A005', name: '父亲身份证.jpg', type: 'id_card', status: 'ok', uploadedAt: lastWeek, uploader: '刘店长' },
    { id: 'M009', authId: 'A008', name: '接送授权书.pdf', type: 'auth_letter', status: 'ok', uploadedAt: lastWeek, uploader: '张店长' },
    { id: 'M010', authId: 'A008', name: '更正说明.pdf', type: 'other', status: 'ok', uploadedAt: yesterday, uploader: '财务主管' },
    { id: 'M011', authId: 'A009', name: '接送授权书.pdf', type: 'auth_letter', status: 'ok', uploadedAt: lastWeek, uploader: '张店长' },
    { id: 'M012', authId: 'A011', name: '接送授权书.pdf', type: 'auth_letter', status: 'damaged', uploadedAt: lastWeek, uploader: '张店长' },
    { id: 'M013', authId: 'A012', name: '接送授权书.pdf', type: 'auth_letter', status: 'missing', uploadedAt: lastWeek, uploader: '刘店长' },
    { id: 'M014', authId: 'A012', name: '母亲身份证.jpg', type: 'id_card', status: 'missing', uploadedAt: lastWeek, uploader: '刘店长' },
  ];

  materials.forEach(m => {
    insertMaterial.run(m.id, m.authId, m.name, m.type, m.status, m.uploadedAt, m.uploader);
  });

  const audits = [
    { id: 'L001', authId: 'A001', operator: '张店长', operatorRole: 'store_manager', action: 'create', field: '', oldValue: '', newValue: '', reason: '首次录入', timestamp: lastWeek, ip: '192.168.1.10' },
    { id: 'L002', authId: 'A002', operator: '张店长', operatorRole: 'store_manager', action: 'create', field: '', oldValue: '', newValue: '', reason: '暑假临时授权', timestamp: lastWeek, ip: '192.168.1.10' },
    { id: 'L003', authId: 'A002', operator: '张店长', operatorRole: 'store_manager', action: 'phone_auth', field: 'pickup_remark', oldValue: '无', newValue: '电话授权临时阿姨，店长已电话确认', reason: '家长电话申请增加临时阿姨', timestamp: yesterday, ip: '192.168.1.10' },
    { id: 'L004', authId: 'A003', operator: '张店长', operatorRole: 'store_manager', action: 'phone_auth', field: 'auth_type', oldValue: 'primary', newValue: 'phone', reason: '家长未能现场提交材料，改为电话授权', timestamp: lastWeek, ip: '192.168.1.10' },
    { id: 'L005', authId: 'A004', operator: '张店长', operatorRole: 'store_manager', action: 'create', field: '', oldValue: '', newValue: '', reason: '提交授权申请', timestamp: lastWeek, ip: '192.168.1.10' },
    { id: 'L006', authId: 'A004', operator: '客服小王', operatorRole: 'cs', action: 'update', field: 'auth_status', oldValue: 'pending', newValue: 'failed', reason: '临时阿姨身份证缺失，授权失败', timestamp: yesterday, ip: '192.168.1.20' },
    { id: 'L007', authId: 'A008', operator: '张店长', operatorRole: 'store_manager', action: 'create', field: '', oldValue: '', newValue: '', reason: '首次录入', timestamp: lastWeek, ip: '192.168.1.10' },
    { id: 'L008', authId: 'A008', operator: '财务主管', operatorRole: 'finance', action: 'correct', field: 'pickup_name', oldValue: '郑化', newValue: '郑华', reason: '姓名拼写错误人工更正', timestamp: yesterday, ip: '192.168.1.30' },
    { id: 'L009', authId: 'A008', operator: '财务主管', operatorRole: 'finance', action: 'update', field: 'auth_status', oldValue: 'failed', newValue: 'corrected', reason: '人工更正完成', timestamp: yesterday, ip: '192.168.1.30' },
    { id: 'L010', authId: 'A011', operator: '张店长', operatorRole: 'store_manager', action: 'create', field: '', oldValue: '', newValue: '', reason: '临时阿姨接送授权', timestamp: lastWeek, ip: '192.168.1.10' },
    { id: 'L011', authId: 'A012', operator: '刘店长', operatorRole: 'store_manager', action: 'create', field: '', oldValue: '', newValue: '', reason: '提交授权申请', timestamp: lastWeek, ip: '192.168.1.11' },
    { id: 'L012', authId: 'A012', operator: '客服小王', operatorRole: 'cs', action: 'update', field: 'auth_status', oldValue: 'pending', newValue: 'failed', reason: '授权书和身份证均缺失', timestamp: yesterday, ip: '192.168.1.20' },
    { id: 'L013', authId: 'A007', operator: '刘店长', operatorRole: 'store_manager', action: 'revoke', field: 'auth_status', oldValue: 'active', newValue: 'revoked', reason: '家长主动申请撤销', timestamp: yesterday, ip: '192.168.1.11' },
  ];

  audits.forEach(a => {
    insertAudit.run(a.id, a.authId, a.operator, a.operatorRole, a.action, a.field, a.oldValue, a.newValue, a.reason, a.timestamp, a.ip);
  });

  insertCorrection.run(
    'C001', 'A008',
    JSON.stringify({ pickupName: '郑化' }),
    JSON.stringify({ pickupName: '郑华' }),
    '姓名拼音输入错误，与身份证不一致，财务复核发现后更正',
    '财务主管', '张店长', 'approved', yesterday
  );

  insertExport.run(
    'E001', '张店长', 'csv',
    JSON.stringify({ store: '梧桐社区店', status: 'active' }),
    6, 5, 1, 'partial',
    JSON.stringify(['A004']),
    yesterday,
    'A004因材料缺页未导出，已标记缺页状态'
  );
  insertExport.run(
    'E002', '刘店长', 'markdown',
    JSON.stringify({ store: '翠竹社区店' }),
    4, 4, 0, 'success',
    '[]',
    yesterday,
    ''
  );
  insertExport.run(
    'E003', '张店长', 'csv',
    JSON.stringify({ store: '梧桐社区店' }),
    8, 6, 2, 'rejected',
    JSON.stringify(['A004', 'A012']),
    now,
    '导出数量与页面数量不一致，已拒绝导出，请主管复查差异记录'
  );
}
