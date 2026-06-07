import { authRepo, addSystemEvent } from '../repositories/authRepository';
import { db } from './init';

export function seedIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM photo_authorizations').get() as { c: number };
  if (count.c > 0) {
    addSystemEvent(
      'service_start',
      '服务启动',
      `检测到已有 ${count.c} 条授权记录，直接加载。服务启动于 ${new Date().toLocaleString('zh-CN')}`,
    );
    return;
  }

  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();

  addSystemEvent(
    'service_start',
    '服务启动 · 初始化样例数据',
    `当前数据库为空，正在载入样例数据。服务启动于 ${new Date().toLocaleString('zh-CN')}，包含手工补录、家长改口、状态变更等场景示例。`,
  );

  authRepo.create({
    babyName: '李小宝',
    babyBirthday: '2023-05-12',
    className: '向日葵班',
    parentName: '李明',
    parentPhone: '13800138001',
    authType: 'class_activity',
    photoScope: 'class_only',
    status: 'authorized',
    validStart: daysAgo(30),
    validEnd: daysAgo(-180),
    originalCommitment: '家长同意课堂活动照片仅在本班教室展示墙使用，有效期半年。',
    isManualEntry: false,
    isBadData: false,
    handlerName: '陈顾问',
    operatorName: '陈顾问',
    operatorId: 'u_chen',
  });

  const pa002 = authRepo.create({
    babyName: '王小丫',
    babyBirthday: '2022-11-03',
    className: '向日葵班',
    parentName: '王芳',
    parentPhone: '13800138002',
    authType: 'promotion',
    photoScope: 'store_wide',
    status: 'authorized',
    validStart: daysAgo(10),
    validEnd: daysAgo(-90),
    originalCommitment: '家长同意孩子照片可用于门店招生宣传，包括易拉宝和体验课手册。',
    isManualEntry: false,
    isBadData: false,
    handlerName: '陈顾问',
    operatorName: '陈顾问',
    operatorId: 'u_chen',
  });
  authRepo.addRemark(pa002.id, {
    content: '家长临时改口：不同意用于社交媒体广告，仅限门店线下宣传物料。',
    operatorName: '陈顾问',
    operatorId: 'u_chen',
    source: 'parent_revision',
  });
  authRepo.changeStatus(pa002.id, {
    status: 'partial',
    operatorName: '陈顾问',
    operatorId: 'u_chen',
    reason: '家长改口，缩小授权范围为仅限门店线下',
    supplementRemark: '已按家长最新意愿更新授权范围，原始承诺保留在历史版本中。',
  });

  authRepo.create({
    babyName: '赵小阳',
    babyBirthday: '2024-01-20',
    className: '向日葵班',
    parentName: '赵强',
    parentPhone: '13800138003',
    authType: 'social_media',
    photoScope: 'chain_wide',
    status: 'pending',
    validStart: hoursAgo(48),
    validEnd: daysAgo(-365),
    originalCommitment: '家长口头同意用于全连锁公众号推送，等待书面确认回传。',
    isManualEntry: false,
    isBadData: false,
    handlerName: '林顾问',
    operatorName: '林顾问',
    operatorId: 'u_lin',
  });

  const pa004 = authRepo.create({
    babyName: '陈思琪',
    babyBirthday: '2023-08-15',
    className: '蒲公英班',
    parentName: '陈静',
    parentPhone: '13800138004',
    authType: 'print_material',
    photoScope: 'public',
    status: 'pending',
    validStart: hoursAgo(72),
    originalCommitment: '家长同意孩子照片用于年度纪念册印刷。',
    isManualEntry: false,
    isBadData: false,
    handlerName: '林顾问',
    operatorName: '林顾问',
    operatorId: 'u_lin',
  });
  authRepo.markBad(
    pa004.id,
    '家长手机号与其他记录串号，疑似录入时复制粘贴错误',
    '林顾问',
    'u_lin',
  );

  const pa005 = authRepo.create({
    babyName: '孙小龙',
    babyBirthday: '2022-03-22',
    className: '蒲公英班',
    parentName: '孙伟',
    parentPhone: '13800138005',
    authType: 'class_activity',
    photoScope: 'store_wide',
    status: 'authorized',
    validStart: daysAgo(20),
    validEnd: daysAgo(-60),
    originalCommitment: '家长同意课堂活动照用于门店展示墙和家长微信群。',
    isManualEntry: false,
    isBadData: false,
    handlerName: '陈顾问',
    operatorName: '陈顾问',
    operatorId: 'u_chen',
  });
  authRepo.changeStatus(pa005.id, {
    status: 'revoked',
    operatorName: '陈顾问',
    operatorId: 'u_chen',
    reason: '家长主动致电要求撤销所有照片授权，不再用于任何用途',
    supplementRemark: '家长因家庭原因撤回授权，已从所有展示墙移除并删除电子文档。',
  });

  authRepo.create({
    babyName: '周小琳',
    babyBirthday: '2024-02-10',
    className: '蒲公英班',
    parentName: '周丽',
    parentPhone: '13800138006',
    authType: 'other',
    photoScope: 'class_only',
    status: 'expired',
    validStart: daysAgo(120),
    validEnd: daysAgo(5),
    originalCommitment: '家长同意生日会照片在本班学期末汇演播放，授权至本学期结束。',
    isManualEntry: false,
    isBadData: false,
    handlerName: '林顾问',
    operatorName: '林顾问',
    operatorId: 'u_lin',
  });

  const pa007 = authRepo.createManual({
    babyName: '吴小峰',
    babyBirthday: '2023-09-30',
    className: '蒲公英班',
    parentName: '吴刚',
    parentPhone: '13800138007',
    authType: 'class_activity',
    photoScope: 'class_only',
    validStart: hoursAgo(6),
    validEnd: daysAgo(-120),
    originalCommitment: '家长同意试听课堂抓拍照片仅本班内部使用，不对外公开。',
    operatorName: '陈顾问',
    operatorId: 'u_chen',
  });
  authRepo.addRemark(pa007.id, {
    content: '【补录说明】该家庭昨日参与试听活动，课堂照片已拍摄但当时未走流程，今日由顾问手工补录。家长签字的纸质授权书已存档在前台档案盒 B-07。',
    operatorName: '陈顾问',
    operatorId: 'u_chen',
    source: 'supplement',
  });
  authRepo.addRemark(pa007.id, {
    content: '家长临时改口：可以用于门店试听宣传小册，但需先把样稿发微信确认。',
    operatorName: '陈顾问',
    operatorId: 'u_chen',
    source: 'parent_revision',
  });

  authRepo.create({
    babyName: '郑小婷',
    babyBirthday: '2023-06-18',
    className: '向日葵班',
    parentName: '郑华',
    parentPhone: '13800138008',
    authType: 'promotion',
    photoScope: 'chain_wide',
    status: 'pending',
    validStart: hoursAgo(24),
    originalCommitment: '家长初步同意，具体范围等待和家人商量后回复。',
    isManualEntry: false,
    isBadData: false,
    handlerName: '林顾问',
    operatorName: '林顾问',
    operatorId: 'u_lin',
  });

  authRepo.create({
    babyName: '钱小明',
    babyBirthday: '2022-12-05',
    className: '向日葵班',
    parentName: '钱军',
    parentPhone: '13800138009',
    authType: 'social_media',
    photoScope: 'store_wide',
    status: 'authorized',
    validStart: daysAgo(15),
    validEnd: daysAgo(-90),
    originalCommitment: '家长同意孩子活动照片出现在门店官方小红书账号。',
    isManualEntry: false,
    isBadData: false,
    handlerName: '陈顾问',
    operatorName: '陈顾问',
    operatorId: 'u_chen',
  });

  addSystemEvent(
    'db_migrated',
    '样例数据载入完成',
    `共载入 9 条样例记录：4 条已授权、1 条部分授权（含家长改口历史）、3 条待确认、1 条已撤销、1 条已过期、1 条已隔离；其中 1 条为手工补录记录（吴小峰，蒲公英班），包含补录前后的备注差异。`,
  );
}
