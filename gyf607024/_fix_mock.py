
p = '/Users/guo/pro/solo/workspaces/gyf607024/src/data/mockData.ts'
content = r'''import type { RescheduleRecord } from '@/types';

export const mockRecords: RescheduleRecord[] = [
  {
    id: 'REC_mock_001',
    sourceFile: '2024-06-01-海豚改期表.xlsx',
    handler: '李教练',
    status: 'pending',
    latestNote: '等待家长确认改期时间',
    babyName: '小明',
    phone: '13800138001',
    originalCourse: '婴儿游泳启蒙班（周六10:00）',
    targetCourse: '婴儿游泳启蒙班（周日15:00）',
    reason: '本周六有事冲突',
    unit: '课时',
    hours: 2,
    operator: '前台小王',
    createdAt: '2024/6/1 09:30:00',
    updatedAt: '2024/6/1 09:30:00',
    isManual: false,
    issues: [],
    logs: [
      { id: 'log_mock_001_1', recordId: 'REC_mock_001', action: 'create', operator: '前台小王', note: '新建改期申请', timestamp: '2024/6/1 09:30:00' }
    ]
  },
  {
    id: 'REC_mock_002',
    sourceFile: '2024-06-02-海豚改期表.xlsx',
    handler: '张教练',
    status: 'processed',
    latestNote: '已完成改期，家长确认',
    babyName: '小红',
    phone: '13800138002',
    originalCourse: '幼儿技能提高班（周二17:00）',
    targetCourse: '幼儿技能提高班（周四17:00）',
    reason: '周二学校活动',
    unit: '课时',
    hours: 1,
    operator: '前台小李',
    createdAt: '2024/6/2 14:00:00',
    updatedAt: '2024/6/3 10:00:00',
    isManual: false,
    issues: [],
    logs: [
      { id: 'log_mock_002_1', recordId: 'REC_mock_002', action: 'create', operator: '前台小李', note: '新建改期申请', timestamp: '2024/6/2 14:00:00' },
      { id: 'log_mock_002_2', recordId: 'REC_mock_002', action: 'status_update', operator: '张教练', note: '已完成改期，家长确认', timestamp: '2024/6/3 10:00:00' }
    ]
  },
  {
    id: 'REC_mock_003',
    sourceFile: '手工补录',
    handler: '王教练',
    status: 'abnormal',
    latestNote: '手机号格式异常，需联系家长核实',
    babyName: '小',
    phone: '123',
    originalCourse: '亲子游泳班（上午场）',
    targetCourse: '亲子游泳班（下午场）',
    reason: '上午时间不合适',
    unit: '次',
    hours: 0,
    operator: '王教练',
    createdAt: '2024/6/4 11:00:00',
    updatedAt: '2024/6/4 11:00:00',
    isManual: true,
    issues: [
      { id: 'issue_mock_003_1', recordId: 'REC_mock_003', type: 'empty_name', field: 'babyName', reason: '宝宝姓名不能为空或过短，至少需要 2 个字符', severity: 'error' },
      { id: 'issue_mock_003_2', recordId: 'REC_mock_003', type: 'invalid_phone', field: 'phone', reason: '手机号格式不正确，应为 11 位有效号码且以 1 开头', severity: 'error' },
      { id: 'issue_mock_003_3', recordId: 'REC_mock_003', type: 'boundary_value', field: 'hours', reason: '课时数量为 0 或空值，属于异常边界值', severity: 'error' }
    ],
    logs: [
      { id: 'log_mock_003_1', recordId: 'REC_mock_003', action: 'manual_create', operator: '王教练', note: '手工补录入库', timestamp: '2024/6/4 11:00:00' }
    ]
  }
];
'''
with open(p, 'w', encoding='utf-8') as f:
    f.write(content)
print('mockData.ts done')
