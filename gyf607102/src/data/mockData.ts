import type { FuseAlarm } from '@/types';

export const generateId = (prefix: string = 'FUSE'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
};

const now = new Date();
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

export const mockFuseAlarms: FuseAlarm[] = [
  {
    id: 'YE-MASTER-SAMPLE-001',
    fuseNo: 'RS-2026-0528-001',
    deviceLocation: 'A区3号汇流箱 #12熔丝',
    status: 'abnormal',
    processStatus: 'pending_review',
    customerEmail: 'customer@renewable-power.com',
    emailSubject: '【紧急】A区汇流箱熔丝异常告警',
    receivedAt: daysAgo(2),
    inspectionPhotos: [
      {
        id: 'PHOTO-001',
        url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=photograph%20of%20a%20fuse%20box%20with%20a%20melted%20fuse%2C%20industrial%20electrical%20panel%2C%20close-up%20shot%2C%20realistic%20photo&image_size=square',
        filename: '熔丝抽检_异常_20260607.jpg',
        uploadedAt: daysAgo(2),
        uploader: '系统自动',
        isManual: false,
        remark: '原始抽检照片，显示熔丝熔断'
      },
      {
        id: 'PHOTO-002',
        url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=close-up%20photograph%20of%20damaged%20electrical%20fuse%2C%20burnt%20marks%2C%20industrial%20equipment%2C%20high%20resolution&image_size=square',
        filename: '熔丝细节_20260607.jpg',
        uploadedAt: daysAgo(2),
        uploader: '系统自动',
        isManual: false,
        remark: '熔丝熔断部位细节'
      }
    ],
    manualPhotos: [
      {
        id: 'MANUAL-001',
        url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=photograph%20of%20a%20new%20fuse%20being%20installed%20by%20technician%2C%20electrical%20panel%2C%20worker%20wearing%20safety%20gloves%2C%20industrial%20setting&image_size=square',
        filename: '叶师傅补录_更换后_20260608.jpg',
        uploadedAt: daysAgo(1),
        uploader: '叶师傅',
        isManual: true,
        remark: '叶师傅手工补录：熔丝已更换完成'
      }
    ],
    originalValue: '熔丝阻值: 0Ω（熔断）',
    processedValue: '熔丝阻值: 0.5Ω（正常）',
    hasAttachment: true,
    attachmentLost: false,
    history: [
      {
        id: 'HIST-001',
        action: 'create',
        operator: '系统',
        timestamp: daysAgo(2),
        newConclusion: '待处理',
        newReason: '客户邮件告警，熔丝熔断',
        remark: '系统自动创建告警记录'
      },
      {
        id: 'HIST-002',
        action: 'manual_upload',
        operator: '叶师傅',
        timestamp: daysAgo(1),
        remark: '叶师傅手工补录更换后照片'
      }
    ],
    currentConclusion: '已处理，待复核',
    currentReason: '熔丝已更换，阻值恢复正常',
    supervisorNote: '',
    operator: '张专员',
    supervisor: '李主管',
    createdAt: daysAgo(2),
    updatedAt: daysAgo(1),
    isYeMasterSample: true,
    isManualSample: false
  },
  {
    id: 'MANUAL-SAMPLE-001',
    fuseNo: 'RS-2026-0528-002',
    deviceLocation: 'B区5号汇流箱 #7熔丝',
    status: 'pending',
    processStatus: 'processing',
    customerEmail: 'operation@solar-farm.com',
    emailSubject: 'B区汇流箱熔丝温度异常',
    receivedAt: daysAgo(1),
    inspectionPhotos: [
      {
        id: 'PHOTO-003',
        url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=thermal%20image%20of%20electrical%20fuse%20box%2C%20hot%20spot%20detected%2C%20infrared%20camera%20view%2C%20temperature%20color%20scale&image_size=square',
        filename: '热成像_温度异常_20260608.jpg',
        uploadedAt: daysAgo(1),
        uploader: '系统自动',
        isManual: false,
        remark: '热成像检测显示温度异常'
      }
    ],
    manualPhotos: [],
    originalValue: '熔丝温度: 85°C',
    processedValue: '熔丝温度: 85°C',
    hasAttachment: true,
    attachmentLost: false,
    history: [
      {
        id: 'HIST-003',
        action: 'create',
        operator: '系统',
        timestamp: daysAgo(1),
        newConclusion: '待处理',
        newReason: '热成像检测温度超标',
        remark: '系统自动创建，人工补录样例'
      }
    ],
    currentConclusion: '处理中',
    currentReason: '正在检查接触情况',
    supervisorNote: '请尽快现场确认',
    operator: '王专员',
    supervisor: '李主管',
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
    isYeMasterSample: false,
    isManualSample: true
  },
  {
    id: 'FUSE-WITHDRAW-SAMPLE',
    fuseNo: 'RS-2026-0528-003',
    deviceLocation: 'C区2号汇流箱 #4熔丝',
    status: 'abnormal',
    processStatus: 'withdrawn',
    customerEmail: 'maintenance@wind-park.com',
    emailSubject: 'C区汇流箱告警 - 请处理',
    receivedAt: daysAgo(3),
    inspectionPhotos: [
      {
        id: 'PHOTO-004',
        url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=electrical%20fuse%20holder%20with%20discolored%20fuse%2C%20showing%20overheating%2C%20industrial%20control%20panel&image_size=square',
        filename: '熔丝过热_20260606.jpg',
        uploadedAt: daysAgo(3),
        uploader: '系统自动',
        isManual: false,
        remark: '熔丝外观变色，疑似过热'
      }
    ],
    manualPhotos: [],
    originalValue: '熔丝温度: 72°C',
    processedValue: '熔丝温度: 65°C',
    hasAttachment: true,
    attachmentLost: false,
    history: [
      {
        id: 'HIST-004',
        action: 'create',
        operator: '系统',
        timestamp: daysAgo(3),
        newConclusion: '待处理',
        newReason: '温度告警',
        remark: '系统自动创建'
      },
      {
        id: 'HIST-005',
        action: 'submit',
        operator: '赵专员',
        timestamp: daysAgo(2),
        newConclusion: '误报',
        newReason: '环境温度过高导致，熔丝本身正常',
        remark: '提交处理结论'
      },
      {
        id: 'HIST-006',
        action: 'withdraw',
        operator: '李主管',
        timestamp: daysAgo(1),
        oldConclusion: '误报',
        oldReason: '环境温度过高导致，熔丝本身正常',
        remark: '主管撤回结论，需要重新检查'
      }
    ],
    currentConclusion: '已撤回，待重新提交',
    currentReason: '原结论已撤回',
    supervisorNote: '需重新核实，不能简单归因为环境温度',
    operator: '赵专员',
    supervisor: '李主管',
    createdAt: daysAgo(3),
    updatedAt: daysAgo(1),
    isYeMasterSample: false,
    isManualSample: false
  },
  {
    id: 'FUSE-ATTACHMENT-LOST',
    fuseNo: 'RS-2026-0528-004',
    deviceLocation: 'D区1号汇流箱 #9熔丝',
    status: 'pending',
    processStatus: 'processing',
    customerEmail: 'service@green-energy.cn',
    emailSubject: 'D区熔丝告警 - 附件丢失测试',
    receivedAt: daysAgo(1),
    inspectionPhotos: [],
    manualPhotos: [],
    originalValue: '熔丝阻值: 异常',
    processedValue: '',
    hasAttachment: false,
    attachmentLost: true,
    history: [
      {
        id: 'HIST-007',
        action: 'create',
        operator: '系统',
        timestamp: daysAgo(1),
        newConclusion: '待处理',
        newReason: '邮件附件丢失，仅存文字描述',
        remark: '附件丢失样例 - 用于测试页面保护'
      }
    ],
    currentConclusion: '待处理',
    currentReason: '附件丢失，需现场确认',
    supervisorNote: '',
    operator: '孙专员',
    supervisor: '李主管',
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
    isYeMasterSample: false,
    isManualSample: false
  },
  {
    id: 'FUSE-NORMAL-001',
    fuseNo: 'RS-2026-0528-005',
    deviceLocation: 'A区1号汇流箱 #1熔丝',
    status: 'normal',
    processStatus: 'completed',
    customerEmail: 'ops@sunpower.com',
    emailSubject: '例行巡检 - 正常',
    receivedAt: daysAgo(5),
    inspectionPhotos: [
      {
        id: 'PHOTO-005',
        url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=clean%20electrical%20fuse%20panel%2C%20all%20fuses%20in%20good%20condition%2C%20proper%20labeling%2C%20industrial%20setting&image_size=square',
        filename: '巡检正常_20260604.jpg',
        uploadedAt: daysAgo(5),
        uploader: '系统自动',
        isManual: false,
        remark: '例行巡检，一切正常'
      }
    ],
    manualPhotos: [],
    originalValue: '熔丝阻值: 0.45Ω',
    processedValue: '熔丝阻值: 0.45Ω',
    hasAttachment: true,
    attachmentLost: false,
    history: [
      {
        id: 'HIST-008',
        action: 'create',
        operator: '系统',
        timestamp: daysAgo(5),
        newConclusion: '正常',
        newReason: '阻值在正常范围内',
        remark: '例行巡检记录'
      },
      {
        id: 'HIST-009',
        action: 'submit',
        operator: '周专员',
        timestamp: daysAgo(4),
        newConclusion: '正常',
        newReason: '抽检正常，无需处理',
        remark: '确认无误，归档'
      }
    ],
    currentConclusion: '正常',
    currentReason: '抽检正常',
    supervisorNote: '',
    operator: '周专员',
    supervisor: '李主管',
    createdAt: daysAgo(5),
    updatedAt: daysAgo(4),
    isYeMasterSample: false,
    isManualSample: false
  },
  {
    id: 'FUSE-ABNORMAL-002',
    fuseNo: 'RS-2026-0528-006',
    deviceLocation: 'B区3号汇流箱 #11熔丝',
    status: 'abnormal',
    processStatus: 'pending_review',
    customerEmail: 'tech@eco-power.com',
    emailSubject: '【重要】B区熔丝异常',
    receivedAt: daysAgo(2),
    inspectionPhotos: [
      {
        id: 'PHOTO-006',
        url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=blown%20ceramic%20fuse%20with%20visible%20cracks%2C%20electrical%20distribution%20box%2C%20close-up%20photograph&image_size=square',
        filename: '熔丝裂纹_20260607.jpg',
        uploadedAt: daysAgo(2),
        uploader: '系统自动',
        isManual: false,
        remark: '熔丝外壳有裂纹，需更换'
      }
    ],
    manualPhotos: [],
    originalValue: '熔丝阻值: 无穷大（断路）',
    processedValue: '熔丝阻值: 无穷大（断路）',
    hasAttachment: true,
    attachmentLost: false,
    history: [
      {
        id: 'HIST-010',
        action: 'create',
        operator: '系统',
        timestamp: daysAgo(2),
        newConclusion: '待处理',
        newReason: '熔丝断裂',
        remark: '系统自动创建'
      }
    ],
    currentConclusion: '待处理',
    currentReason: '熔丝断裂，需更换',
    supervisorNote: '',
    operator: '吴专员',
    supervisor: '李主管',
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
    isYeMasterSample: false,
    isManualSample: false
  }
];
