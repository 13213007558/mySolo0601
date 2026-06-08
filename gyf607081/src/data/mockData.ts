import {
  Baby,
  TemperatureRecord,
  LeaveNote,
  CheckRecord,
  AuditLog,
  ServiceRestart,
  ExportRecord,
  DataStatus,
  RecordStatus,
  AuditAction,
  StatusChangeTrace
} from '../types';

export const mockBabies: Baby[] = [
  {
    id: 'baby-001',
    name: '张小明',
    age: 3,
    className: '小班A',
    guardian: '张女士',
    phone: '138****1234',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=xiaoming',
    createdAt: '2024-01-15T08:00:00.000Z'
  },
  {
    id: 'baby-002',
    name: '李小红',
    age: 4,
    className: '小班B',
    guardian: '李先生',
    phone: '139****5678',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=xiaohong',
    createdAt: '2024-01-16T08:00:00.000Z'
  },
  {
    id: 'baby-003',
    name: '王小刚',
    age: 3,
    className: '小班A',
    guardian: '王女士',
    phone: '137****9012',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=xiaogang',
    createdAt: '2024-01-17T08:00:00.000Z'
  },
  {
    id: 'baby-004',
    name: '赵小美',
    age: 4,
    className: '中班A',
    guardian: '赵先生',
    phone: '136****3456',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=xiaomei',
    createdAt: '2024-01-18T08:00:00.000Z'
  },
  {
    id: 'baby-005',
    name: '陈小华',
    age: 5,
    className: '大班A',
    guardian: '陈女士',
    phone: '135****7890',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=xiaohua',
    createdAt: '2024-01-19T08:00:00.000Z'
  },
  {
    id: 'baby-006',
    name: '刘小强',
    age: 3,
    className: '小班B',
    guardian: '刘先生',
    phone: '134****2345',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=xiaoqiang',
    createdAt: '2024-01-20T08:00:00.000Z'
  }
];

export const mockTemperatureRecords: TemperatureRecord[] = [
  {
    id: 'temp-001',
    babyId: 'baby-001',
    temperature: 36.5,
    measureTime: '2024-06-08T07:30:00.000Z',
    measureDevice: '体温枪A-001',
    operator: '李护士',
    remark: '晨检体温正常',
    photoUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=thermometer%20showing%2036.5%20degrees%20celsius%20medical%20device&image_size=square',
    isDirty: false
  },
  {
    id: 'temp-002',
    babyId: 'baby-002',
    temperature: 36.8,
    measureTime: '2024-06-08T07:32:00.000Z',
    measureDevice: '体温枪A-001',
    operator: '李护士',
    remark: '正常入园',
    photoUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=digital%20thermometer%2036.8%20degrees%20clinical%20thermometer&image_size=square',
    isDirty: false
  },
  {
    id: 'temp-003',
    babyId: 'baby-004',
    temperature: 38.2,
    measureTime: '2024-06-08T07:35:00.000Z',
    measureDevice: '体温枪A-002',
    operator: '王护士',
    remark: '',
    photoUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=thermometer%2038.2%20degrees%20fever%20warning%20red%20display&image_size=square',
    isDirty: true,
    dirtyReason: '体温异常高，备注不完整，疑似脏数据'
  },
  {
    id: 'temp-004',
    babyId: 'baby-005',
    temperature: 36.6,
    measureTime: '2024-06-08T07:40:00.000Z',
    measureDevice: '体温枪A-001',
    operator: '李护士',
    remark: '晨检正常，略有咳嗽',
    photoUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=medical%20thermometer%2036.6%20degrees%20normal%20reading&image_size=square',
    isDirty: false
  },
  {
    id: 'temp-005',
    babyId: 'baby-006',
    temperature: 36.7,
    measureTime: '2024-06-08T07:45:00.000Z',
    measureDevice: '体温枪A-002',
    operator: '张护士',
    remark: '手工补录-早高峰遗漏',
    photoUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=manual%20temperature%20log%20sheet%20clipboard%20pen&image_size=square',
    isDirty: false
  }
];

export const mockLeaveNotes: LeaveNote[] = [
  {
    id: 'leave-001',
    babyId: 'baby-003',
    leaveDate: '2024-06-08',
    reason: '感冒发烧，居家休息',
    photoUrls: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handwritten%20leave%20note%20for%20child%20school%20absence%20chinese%20text&image_size=portrait_4_3',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=medical%20certificate%20doctor%20prescription%20note&image_size=portrait_4_3'
    ],
    operator: '张女士',
    createdAt: '2024-06-08T06:00:00.000Z'
  }
];

const statusChangeTraces: StatusChangeTrace[] = [
  {
    recordId: 'record-004',
    oldStatus: RecordStatus.PENDING,
    newStatus: RecordStatus.REJECTED,
    changeTime: '2024-06-08T09:00:00.000Z',
    operator: '客服小王',
    remark: '体温异常，未收到家长反馈'
  },
  {
    recordId: 'record-004',
    oldStatus: RecordStatus.REJECTED,
    newStatus: RecordStatus.REISSUED,
    changeTime: '2024-06-08T10:30:00.000Z',
    operator: '客服小王',
    remark: '家长已提供医院证明，体温正常，补发餐食'
  }
];

export const mockCheckRecords: CheckRecord[] = [
  {
    id: 'record-001',
    babyId: 'baby-001',
    temperatureRecordId: 'temp-001',
    status: RecordStatus.PENDING,
    dataStatus: DataStatus.NORMAL,
    currentRemark: '晨检体温正常，待复核',
    isManual: false,
    createdAt: '2024-06-08T07:30:00.000Z',
    updatedAt: '2024-06-08T07:30:00.000Z',
    operator: '李护士'
  },
  {
    id: 'record-002',
    babyId: 'baby-002',
    temperatureRecordId: 'temp-002',
    status: RecordStatus.PENDING,
    dataStatus: DataStatus.NORMAL,
    currentRemark: '体温正常',
    isManual: false,
    createdAt: '2024-06-08T07:32:00.000Z',
    updatedAt: '2024-06-08T07:32:00.000Z',
    operator: '李护士'
  },
  {
    id: 'record-003',
    babyId: 'baby-003',
    leaveNoteId: 'leave-001',
    status: RecordStatus.PENDING,
    dataStatus: DataStatus.NORMAL,
    currentRemark: '今日请假，有请假条',
    isManual: false,
    createdAt: '2024-06-08T06:00:00.000Z',
    updatedAt: '2024-06-08T06:00:00.000Z',
    operator: '张女士'
  },
  {
    id: 'record-004',
    babyId: 'baby-004',
    temperatureRecordId: 'temp-003',
    status: RecordStatus.REISSUED,
    dataStatus: DataStatus.DIRTY,
    currentRemark: '家长已提供医院证明，体温正常，补发餐食',
    isManual: false,
    createdAt: '2024-06-08T07:35:00.000Z',
    updatedAt: '2024-06-08T10:30:00.000Z',
    operator: '客服小王'
  },
  {
    id: 'record-005',
    babyId: 'baby-005',
    temperatureRecordId: 'temp-004',
    status: RecordStatus.PENDING,
    dataStatus: DataStatus.NORMAL,
    currentRemark: '晨检正常，略有咳嗽，已通知家长',
    isManual: false,
    createdAt: '2024-06-08T07:40:00.000Z',
    updatedAt: '2024-06-08T07:40:00.000Z',
    operator: '李护士'
  },
  {
    id: 'record-006',
    babyId: 'baby-006',
    temperatureRecordId: 'temp-005',
    status: RecordStatus.MANUAL,
    dataStatus: DataStatus.NORMAL,
    currentRemark: '早高峰遗漏记录，已手工补录',
    isManual: true,
    manualAddInfo: {
      beforeData: {
        currentRemark: '',
        temperatureRecordId: undefined,
        status: RecordStatus.PENDING,
        dataStatus: DataStatus.EMPTY
      },
      afterData: {
        currentRemark: '早高峰遗漏记录，已手工补录',
        temperatureRecordId: 'temp-005',
        status: RecordStatus.MANUAL,
        dataStatus: DataStatus.NORMAL
      },
      addTime: '2024-06-08T08:00:00.000Z',
      operator: '客服小李',
      reason: '早高峰体温枪排队，纸质记录后补录系统'
    },
    createdAt: '2024-06-08T07:45:00.000Z',
    updatedAt: '2024-06-08T08:00:00.000Z',
    operator: '客服小李'
  },
  {
    id: 'record-007',
    babyId: 'baby-005',
    status: RecordStatus.PENDING,
    dataStatus: DataStatus.EMPTY,
    currentRemark: '只有宝宝信息，无体温记录，需核实',
    isManual: false,
    createdAt: '2024-06-08T08:10:00.000Z',
    updatedAt: '2024-06-08T08:10:00.000Z',
    operator: '系统'
  }
];

export const mockAuditLogs: AuditLog[] = [
  {
    id: 'audit-001',
    recordId: 'record-004',
    babyId: 'baby-004',
    action: AuditAction.REJECT,
    oldValue: {
      id: 'record-004',
      status: RecordStatus.PENDING,
      currentRemark: '体温38.2度，需复核'
    },
    newValue: {
      id: 'record-004',
      status: RecordStatus.REJECTED,
      currentRemark: '体温异常，未收到家长反馈'
    },
    operator: '客服小王',
    timestamp: '2024-06-08T09:00:00.000Z',
    success: true
  },
  {
    id: 'audit-002',
    recordId: 'record-004',
    babyId: 'baby-004',
    action: AuditAction.REISSUE,
    oldValue: {
      id: 'record-004',
      status: RecordStatus.REJECTED,
      currentRemark: '体温异常，未收到家长反馈'
    },
    newValue: {
      id: 'record-004',
      status: RecordStatus.REISSUED,
      currentRemark: '家长已提供医院证明，体温正常，补发餐食'
    },
    operator: '客服小王',
    timestamp: '2024-06-08T10:30:00.000Z',
    success: true
  },
  {
    id: 'audit-003',
    recordId: 'record-006',
    babyId: 'baby-006',
    action: AuditAction.MANUAL_ADD,
    oldValue: {
      id: 'record-006',
      dataStatus: DataStatus.EMPTY,
      currentRemark: ''
    },
    newValue: {
      id: 'record-006',
      dataStatus: DataStatus.NORMAL,
      currentRemark: '早高峰遗漏记录，已手工补录',
      temperatureRecordId: 'temp-005'
    },
    snapshot: {
      beforeData: {
        currentRemark: '',
        temperatureRecordId: undefined,
        status: RecordStatus.PENDING,
        dataStatus: DataStatus.EMPTY
      },
      afterData: {
        currentRemark: '早高峰遗漏记录，已手工补录',
        temperatureRecordId: 'temp-005',
        status: RecordStatus.MANUAL,
        dataStatus: DataStatus.NORMAL
      }
    },
    operator: '客服小李',
    timestamp: '2024-06-08T08:00:00.000Z',
    success: true
  },
  {
    id: 'audit-004',
    action: AuditAction.SERVICE_RESTART,
    serviceRestartId: 'restart-001',
    operator: '系统管理员',
    timestamp: '2024-06-07T22:00:00.000Z',
    success: true
  },
  {
    id: 'audit-005',
    recordId: 'record-099',
    action: AuditAction.SERVICE_RESTART,
    serviceRestartId: 'restart-001',
    snapshot: {
      id: 'record-099',
      babyId: 'baby-099',
      status: RecordStatus.PENDING,
      dataStatus: DataStatus.NORMAL
    },
    operator: '系统管理员',
    timestamp: '2024-06-07T22:00:05.000Z',
    success: false,
    errorMessage: '数据库连接超时，记录处理失败，但审计快照已保留'
  },
  {
    id: 'audit-006',
    action: AuditAction.EXPORT,
    operator: '财务小张',
    timestamp: '2024-06-08T11:00:00.000Z',
    success: true
  }
];

export const mockServiceRestarts: ServiceRestart[] = [
  {
    id: 'restart-001',
    startTime: '2024-06-07T22:00:00.000Z',
    endTime: '2024-06-07T22:05:00.000Z',
    totalRecords: 100,
    successCount: 98,
    failCount: 2,
    failRecordIds: ['record-099', 'record-100'],
    failDetails: [
      {
        recordId: 'record-099',
        reason: '数据库连接超时',
        data: { id: 'record-099', babyId: 'baby-099', status: 'pending' }
      },
      {
        recordId: 'record-100',
        reason: '数据校验失败',
        data: { id: 'record-100', babyId: 'baby-100', status: 'pending' }
      }
    ],
    operator: '系统管理员',
    status: 'partial_success'
  }
];

export const mockExportRecords: ExportRecord[] = [
  {
    id: 'export-001',
    exportTime: '2024-06-08T11:00:00.000Z',
    operator: '财务小张',
    recordIds: ['record-001', 'record-002', 'record-003', 'record-004', 'record-005', 'record-006'],
    statusChanges: statusChangeTraces,
    downloadUrl: '#'
  }
];

export const mockCurrentOperator = '客服小王';
