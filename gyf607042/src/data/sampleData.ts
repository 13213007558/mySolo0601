import type { TrackRecord } from '@/types';

const now = new Date();
const iso = (d: Date) => d.toISOString();
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return iso(d);
};
const dateStr = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

export const sampleRecords: TrackRecord[] = [
  {
    id: 'rec-001',
    roomNo: '302',
    babyName: '小**',
    babyNameRaw: '小米粒',
    motherPhone: '13912345678',
    mealType: '午餐',
    mealDate: dateStr(0),
    photoUrl:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=warm%20baby%20food%20rice%20pumpkin%20puree%20soft%20lighting%20pastel%20bowl%20ceramic%20baby%20meal%20wooden%20table%20top%20view&image_size=square',
    photoCaption: '今日午餐：小米南瓜粥配蒸蛋黄，厨房按当日新表备料，分量适中，温度适宜。',
    status: 'normal',
    ingredients: [
      { name: '小米', category: '主食' },
      { name: '南瓜泥', category: '蔬菜' },
      { name: '蛋黄', category: '蛋奶' },
    ],
    taboosMatched: [],
    validationIssues: [],
    rectificationLogs: [
      {
        id: 'log-001-1',
        action: 'create',
        operator: '系统',
        note: '膳食记录自动生成',
        timestamp: daysAgo(0),
      },
      {
        id: 'log-001-2',
        action: 'status_change',
        operator: '王主管',
        note: '人工复核通过，无禁忌项',
        timestamp: daysAgo(0),
      },
    ],
    isManualEntry: false,
    createdAt: daysAgo(0),
    updatedAt: daysAgo(0),
  },
  {
    id: 'rec-002',
    roomNo: '501',
    babyName: '豆**',
    babyNameRaw: '豆豆',
    motherPhone: '138-1234-5678转01',
    mealType: '早餐',
    mealDate: dateStr(1),
    photoUrl:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=baby%20shrimp%20egg%20steamed%20bowl%20warning%20seafood%20meal%20soft%20food%20ceramic%20plate&image_size=square',
    photoCaption: '早餐：虾仁蒸蛋。厨房疑似按旧三日表备料，虾仁为新增禁忌食材。',
    status: 'abnormal',
    ingredients: [
      { name: '鸡蛋', category: '蛋奶' },
      { name: '虾仁', category: '海鲜', isForbidden: true },
      { name: '小葱', category: '蔬菜' },
    ],
    taboosMatched: [
      {
        ingredientName: '虾仁',
        tabooName: '海鲜类过敏高敏期禁忌',
        riskLevel: '高',
        description:
          '6月龄以内婴幼儿尚未建立海鲜耐受，虾仁为常见高致敏原，按本中心规范禁用。',
      },
    ],
    validationIssues: [
      {
        field: 'motherPhone',
        issue: 'phone_format',
        severity: 'warn',
        humanReadable:
          '妈妈手机号格式不规范：包含"转01"的分机后缀，且使用了短横线分隔符。导出系统标准格式为 11 位纯数字，例如 13812345678。',
        rawValue: '138-1234-5678转01',
      },
      {
        field: 'babyNameRaw',
        issue: 'privacy_leak',
        severity: 'error',
        humanReadable:
          '检测到隐私字段导出风险：宝宝姓名原文"豆豆"属于可识别个人信息，对外协作时将自动替换为脱敏后的"豆**"。',
        rawValue: '豆豆',
      },
    ],
    rectificationLogs: [
      {
        id: 'log-002-1',
        action: 'create',
        operator: '系统',
        note: '膳食记录自动生成',
        timestamp: daysAgo(1),
      },
      {
        id: 'log-002-2',
        action: 'rectify',
        operator: '李主管',
        note: '已通知厨房停供，已重新备料，改用鸡肉泥辅食。',
        timestamp: daysAgo(1),
      },
    ],
    isManualEntry: false,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
  {
    id: 'rec-003',
    roomNo: '208',
    babyName: '安**',
    babyNameRaw: '安安',
    motherPhone: '18698765432',
    mealType: '加餐',
    mealDate: dateStr(1),
    photoUrl:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=baby%20rice%20porridge%20special%20peanut%20powder%20hypoallergenic%20baby%20food%20bowl%20soft%20warm&image_size=square',
    photoCaption: '下午加餐：低敏花生粉米糊。系统初判花生为禁忌，主管核实为专用低敏花生粉。',
    status: 'manual_overridden',
    overrideReason:
      '经核实，使用的是品牌专用低敏花生粉，经脱敏处理，宝宝已建立耐受并由家属签字确认，排除禁忌。',
    ingredients: [
      { name: '大米糊', category: '主食' },
      { name: '低敏花生粉', category: '坚果', isForbidden: true },
    ],
    taboosMatched: [
      {
        ingredientName: '低敏花生粉',
        tabooName: '坚果类早期添加禁忌',
        riskLevel: '中',
        description:
          '常规花生制品通常建议 12 月龄后引入，高敏宝宝需在医生指导下使用。',
      },
    ],
    validationIssues: [],
    rectificationLogs: [
      {
        id: 'log-003-1',
        action: 'create',
        operator: '系统',
        note: '膳食记录自动生成',
        timestamp: daysAgo(1),
      },
      {
        id: 'log-003-2',
        action: 'override',
        operator: '张主管',
        note: '人工改判：专用低敏花生粉，家属签字确认耐受。',
        timestamp: daysAgo(1),
      },
    ],
    isManualEntry: false,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
  {
    id: 'rec-004',
    roomNo: '405',
    babyName: '果**',
    babyNameRaw: '果果',
    motherPhone: '15800001111',
    mealType: '晚餐',
    mealDate: dateStr(0),
    photoUrl:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=baby%20dinner%20vegetable%20porridge%20waiting%20review%20warm%20soft%20food&image_size=square',
    photoCaption: '晚餐：蔬菜瘦肉粥。待主管审核确认。',
    status: 'pending',
    ingredients: [
      { name: '大米', category: '主食' },
      { name: '瘦肉末', category: '肉类' },
      { name: '菠菜', category: '蔬菜' },
    ],
    taboosMatched: [],
    validationIssues: [],
    rectificationLogs: [
      {
        id: 'log-004-1',
        action: 'create',
        operator: '系统',
        note: '膳食记录自动生成，待审核',
        timestamp: daysAgo(0),
      },
    ],
    isManualEntry: false,
    createdAt: daysAgo(0),
    updatedAt: daysAgo(0),
  },
  {
    id: 'rec-005',
    roomNo: '101',
    babyName: '星**',
    babyNameRaw: '星星',
    motherPhone: '13711112222',
    mealType: '午餐',
    mealDate: dateStr(2),
    photoUrl:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=baby%20food%20sweet%20apple%20oatmeal%20manual%20supplement%20manual%20record%20warm%20bowl&image_size=square',
    photoCaption: '手工补录：2 日前午餐苹果燕麦糊，系统当日未同步，主管手工补录。',
    status: 'normal',
    ingredients: [
      { name: '燕麦', category: '主食' },
      { name: '苹果泥', category: '蔬菜' },
    ],
    taboosMatched: [],
    validationIssues: [],
    rectificationLogs: [
      {
        id: 'log-005-1',
        action: 'manual_entry',
        operator: '赵主管',
        note: '手工补录该条记录，原因为 6 月 5 日系统漏采。',
        timestamp: daysAgo(0),
      },
    ],
    supplementDiffs: [
      { field: '记录来源', before: '（无', after: '手工补录' },
      { field: '照片说明', before: '（无）', after: '苹果燕麦糊补拍' },
      { field: '创建时间', before: '2025-06-05 12:30', after: '2025-06-08 09:15（补录）' },
    ],
    isManualEntry: true,
    createdAt: daysAgo(2),
    updatedAt: daysAgo(0),
  },
];
