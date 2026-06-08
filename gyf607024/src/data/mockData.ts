import type { RescheduleRecord, RecordFormData } from '@/types';

export const mockRecords: RescheduleRecord[] = [
  {
    id: 'REC_mock_001',
    sourceFile: '2024-06-01-海豚改期表.xlsx',
    handler: '李教练',
    status: 'processed',
    latestNote: '已完成改期，家长电话确认',
    babyName: '李小萌',
    phone: '13800138001',
    originalCourse: '婴儿游泳启蒙班（周六10:00）',
    targetCourse: '婴儿游泳启蒙班（周日15:00）',
    reason: '本周六家庭有事冲突',
    unit: '次',
    hours: 2,
    operator: '前台小王',
    createdAt: '2024/6/1 09:30:00',
    updatedAt: '2024/6/1 14:20:00',
    isManual: false,
    issues: [],
    logs: [
      { id: 'log_mock_001_1', recordId: 'REC_mock_001', action: 'create', operator: '前台小王', note: '新建改期申请', timestamp: '2024/6/1 09:30:00' },
      { id: 'log_mock_001_2', recordId: 'REC_mock_001', action: 'status_update', operator: '李教练', note: '已完成改期，家长电话确认', timestamp: '2024/6/1 14:20:00' }
    ]
  },
  {
    id: 'REC_mock_002',
    sourceFile: '2024-06-02-海豚改期表.xlsx',
    handler: '张教练',
    status: 'abnormal',
    latestNote: '课时数量异常偏大，需人工核实',
    babyName: '陈朵朵',
    phone: '13900139002',
    originalCourse: '幼儿技能提高班（周二17:00）',
    targetCourse: '幼儿技能提高班（周四17:00）',
    reason: '周二学校有活动',
    unit: '课时',
    hours: 99,
    operator: '前台小李',
    createdAt: '2024/6/2 14:00:00',
    updatedAt: '2024/6/2 14:00:00',
    isManual: false,
    issues: [
      { id: 'issue_mock_002_1', recordId: 'REC_mock_002', type: 'boundary_value', field: 'hours', reason: '课时数量 99 超过 30，超出单次改期正常范围，请确认', severity: 'warning' }
    ],
    logs: [
      { id: 'log_mock_002_1', recordId: 'REC_mock_002', action: 'create', operator: '前台小李', note: '新建改期申请，系统检测到课时异常', timestamp: '2024/6/2 14:00:00' }
    ]
  },
  {
    id: 'REC_mock_003',
    sourceFile: '2024-06-03-海豚改期表.xlsx',
    handler: '王教练',
    status: 'abnormal',
    latestNote: '原课程与改期课程相同，疑似误操作',
    babyName: '赵小天',
    phone: '13700137003',
    originalCourse: '亲子游泳班（周六上午9:00）',
    targetCourse: '亲子游泳班（周六上午9:00）',
    reason: '时间调整',
    unit: '节',
    hours: 1,
    operator: '前台小张',
    createdAt: '2024/6/3 10:15:00',
    updatedAt: '2024/6/3 10:15:00',
    isManual: false,
    issues: [
      { id: 'issue_mock_003_1', recordId: 'REC_mock_003', type: 'same_course', field: 'targetCourse', reason: '原课程与改期课程相同，疑似误操作', severity: 'warning' }
    ],
    logs: [
      { id: 'log_mock_003_1', recordId: 'REC_mock_003', action: 'create', operator: '前台小张', note: '新建改期申请，课程相同疑似误操作', timestamp: '2024/6/3 10:15:00' }
    ]
  },
  {
    id: 'REC_mock_004',
    sourceFile: '2024-06-04-海豚改期表.xlsx',
    handler: '刘教练',
    status: 'abnormal',
    latestNote: '手机号和课时均异常，需紧急处理',
    babyName: '孙小宝',
    phone: '00000000000',
    originalCourse: '婴儿水育早教班（周三10:00）',
    targetCourse: '婴儿水育早教班（周五10:00）',
    reason: '临时有事',
    unit: '次',
    hours: 0,
    operator: '前台小赵',
    createdAt: '2024/6/4 16:40:00',
    updatedAt: '2024/6/4 16:40:00',
    isManual: false,
    issues: [
      { id: 'issue_mock_004_1', recordId: 'REC_mock_004', type: 'invalid_phone', field: 'phone', reason: '手机号格式不正确，应为 11 位有效号码且以 1 开头', severity: 'error' },
      { id: 'issue_mock_004_2', recordId: 'REC_mock_004', type: 'boundary_value', field: 'hours', reason: '课时数量为 0 或空值，属于异常边界值', severity: 'error' }
    ],
    logs: [
      { id: 'log_mock_004_1', recordId: 'REC_mock_004', action: 'create', operator: '前台小赵', note: '新建改期申请，存在多项数据异常', timestamp: '2024/6/4 16:40:00' }
    ]
  },
  {
    id: 'REC_mock_005',
    sourceFile: '2024-06-05-海豚改期表.xlsx',
    handler: '李教练',
    status: 'pending',
    latestNote: '检测到单位混用，需与家长确认',
    babyName: '李小萌',
    phone: '13800138001',
    originalCourse: '婴儿游泳启蒙班（周日15:00）',
    targetCourse: '婴儿游泳启蒙班（下周六10:00）',
    reason: '下周有事',
    unit: '小时',
    hours: 3,
    operator: '前台小王',
    createdAt: '2024/6/5 11:00:00',
    updatedAt: '2024/6/5 11:00:00',
    isManual: false,
    issues: [
      { id: 'issue_mock_005_1', recordId: 'REC_mock_005', type: 'unit_mismatch', field: 'unit', reason: '该学员历史记录单位为「次」，本次为「小时」，存在单位混用风险', severity: 'warning' }
    ],
    logs: [
      { id: 'log_mock_005_1', recordId: 'REC_mock_005', action: 'create', operator: '前台小王', note: '新建改期申请，检测到单位混用', timestamp: '2024/6/5 11:00:00' }
    ]
  },
  {
    id: 'REC_mock_006',
    sourceFile: '手工补录',
    handler: '陈教练',
    status: 'pending',
    latestNote: '手工补录上周末改期记录，待审核',
    babyName: '周安安',
    phone: '13600136006',
    originalCourse: '幼儿潜水预备班（周六14:00）',
    targetCourse: '幼儿潜水预备班（周日14:00）',
    reason: '上周六宝宝发烧',
    unit: '次',
    hours: 1,
    operator: '陈教练',
    createdAt: '2024/6/6 09:00:00',
    updatedAt: '2024/6/6 09:00:00',
    isManual: true,
    issues: [],
    logs: [
      { id: 'log_mock_006_1', recordId: 'REC_mock_006', action: 'manual_create', operator: '陈教练', note: '手工补录上周末改期记录', timestamp: '2024/6/6 09:00:00' }
    ]
  },
  {
    id: 'REC_mock_007',
    sourceFile: '2024-06-06-海豚改期表.xlsx',
    handler: '吴教练',
    status: 'processed',
    latestNote: '改期完成，已短信通知家长',
    babyName: '郑乐乐',
    phone: '13500135007',
    originalCourse: '亲子互动游泳班（周五18:00）',
    targetCourse: '亲子互动游泳班（周六18:00）',
    reason: '周五加班无法陪同',
    unit: '节',
    hours: 2,
    operator: '前台小孙',
    createdAt: '2024/6/6 13:30:00',
    updatedAt: '2024/6/6 15:00:00',
    isManual: false,
    issues: [],
    logs: [
      { id: 'log_mock_007_1', recordId: 'REC_mock_007', action: 'create', operator: '前台小孙', note: '新建改期申请', timestamp: '2024/6/6 13:30:00' },
      { id: 'log_mock_007_2', recordId: 'REC_mock_007', action: 'status_update', operator: '吴教练', note: '改期完成，已短信通知家长', timestamp: '2024/6/6 15:00:00' }
    ]
  },
  {
    id: 'REC_mock_008',
    sourceFile: '2024-06-07-海豚改期表.xlsx',
    handler: '杨教练',
    status: 'pending',
    latestNote: '等待家长回复确认时间',
    babyName: '黄依依',
    phone: '13400134008',
    originalCourse: '婴儿游泳启蒙班（周一10:00）',
    targetCourse: '婴儿游泳启蒙班（周三10:00）',
    reason: '周一疫苗接种',
    unit: '次',
    hours: 1,
    operator: '前台小周',
    createdAt: '2024/6/7 08:50:00',
    updatedAt: '2024/6/7 08:50:00',
    isManual: false,
    issues: [],
    logs: [
      { id: 'log_mock_008_1', recordId: 'REC_mock_008', action: 'create', operator: '前台小周', note: '新建改期申请', timestamp: '2024/6/7 08:50:00' }
    ]
  }
];

export const manualSampleData: RecordFormData = {
  babyName: '林小航',
  phone: '13612345678',
  originalCourse: '幼儿技能提高班（周六上午10:00）',
  targetCourse: '幼儿技能提高班（下周日下午15:00）',
  reason: '本周六全家外出旅行',
  unit: '次',
  hours: 2,
  latestNote: '家长电话申请补录，已核实宝宝信息无误',
  handler: '王教练',
  sourceFile: '手工补录'
};
