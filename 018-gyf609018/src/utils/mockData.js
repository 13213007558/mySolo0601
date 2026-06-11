import { hoursAgoISO, nowISO } from './validators.js'

export const BUILDINGS = ['1号楼', '2号楼', '3号楼']

export const ROOM_TYPES = ['卫生间', '厨房', '阳台', '主卧卫生间', '客卫']

export function generateMockData() {
  const records = []

  records.push({
    id: 'demo_normal_1',
    building: '1号楼',
    unit: '1单元',
    roomNumber: '101',
    roomType: '卫生间',
    inspector: '张工',
    startTime: hoursAgoISO(48),
    endTime: hoursAgoISO(24),
    waterDepthCm: 3,
    photoUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=waterproof%20test%20bathroom%20water%20filled%20check%20normal%20tile&image_size=square',
    photoTime: hoursAgoISO(25),
    leakConclusion: 'pass',
    remark: '蓄水正常，无渗漏痕迹',
    retests: [],
    createdAt: hoursAgoISO(24),
    updatedAt: hoursAgoISO(23)
  })

  records.push({
    id: 'demo_leak_1',
    building: '1号楼',
    unit: '1单元',
    roomNumber: '101',
    roomType: '厨房',
    inspector: '张工',
    startTime: hoursAgoISO(72),
    endTime: hoursAgoISO(48),
    waterDepthCm: 3,
    photoUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=waterproof%20kitchen%20floor%20water%20leak%20stain%20corner&image_size=square',
    photoTime: hoursAgoISO(49),
    leakConclusion: 'leak',
    leakLocation: '下水管道周边',
    remark: '管道根部发现渗水，需返工',
    retests: [
      {
        id: 'retest_1',
        startTime: hoursAgoISO(36),
        endTime: hoursAgoISO(12),
        waterDepthCm: 3,
        photoUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=kitchen%20repaired%20waterproof%20testing%20no%20leak%20clean%20floor&image_size=square',
        photoTime: hoursAgoISO(13),
        leakConclusion: 'leak',
        leakLocation: '墙角接缝',
        remark: '第一次复测仍有渗漏，二次返工',
        createdAt: hoursAgoISO(12)
      },
      {
        id: 'retest_2',
        startTime: hoursAgoISO(10),
        endTime: nowISO(),
        waterDepthCm: 3,
        photoUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=kitchen%20waterproof%20passed%20final%20test%20dry%20ceiling&image_size=square',
        photoTime: hoursAgoISO(1),
        leakConclusion: 'pass',
        remark: '二次返工后复测通过，无渗漏',
        createdAt: nowISO()
      }
    ],
    createdAt: hoursAgoISO(48),
    updatedAt: nowISO()
  })

  records.push({
    id: 'demo_time_abnormal',
    building: '1号楼',
    unit: '2单元',
    roomNumber: '201',
    roomType: '阳台',
    inspector: '李工',
    startTime: hoursAgoISO(10),
    endTime: hoursAgoISO(2),
    waterDepthCm: 3,
    photoUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=balcony%20water%20testing%20short%20time%20incomplete&image_size=square',
    photoTime: hoursAgoISO(1),
    leakConclusion: 'pending',
    remark: '蓄水时间不足24小时，判定为不合格',
    retests: [],
    createdAt: hoursAgoISO(2),
    updatedAt: hoursAgoISO(1)
  })

  records.push({
    id: 'demo_pending_retest',
    building: '2号楼',
    unit: '1单元',
    roomNumber: '302',
    roomType: '主卫',
    inspector: '王工',
    startTime: hoursAgoISO(60),
    endTime: hoursAgoISO(36),
    waterDepthCm: 3,
    photoUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=bathroom%20leak%20near%20toilet%20waterproof%20failed&image_size=square',
    photoTime: hoursAgoISO(37),
    leakConclusion: 'leak',
    leakLocation: '马桶周边',
    remark: '马桶附近渗漏，正在返工中，待复测',
    retests: [],
    createdAt: hoursAgoISO(36),
    updatedAt: hoursAgoISO(30)
  })

  records.push({
    id: 'demo_normal_2',
    building: '2号楼',
    unit: '1单元',
    roomNumber: '302',
    roomType: '客卫',
    inspector: '王工',
    startTime: hoursAgoISO(50),
    endTime: hoursAgoISO(26),
    waterDepthCm: 2.5,
    photoUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=guest%20bathroom%20waterproof%20test%20pass%20clean&image_size=square',
    photoTime: hoursAgoISO(27),
    leakConclusion: 'pass',
    remark: '正常通过',
    retests: [],
    createdAt: hoursAgoISO(26),
    updatedAt: hoursAgoISO(26)
  })

  records.push({
    id: 'demo_low_water',
    building: '3号楼',
    unit: '2单元',
    roomNumber: '501',
    roomType: '卫生间',
    inspector: '赵工',
    startTime: hoursAgoISO(40),
    endTime: hoursAgoISO(16),
    waterDepthCm: 1,
    photoUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=bathroom%20low%20water%20level%20insufficient%20test&image_size=square',
    photoTime: hoursAgoISO(17),
    leakConclusion: 'pending',
    remark: '蓄水深度不足，需重新试验',
    retests: [],
    createdAt: hoursAgoISO(16),
    updatedAt: hoursAgoISO(16)
  })

  return records
}

export function getSampleInstructions() {
  return [
    {
      title: '📘 使用说明书',
      sections: [
        {
          heading: '一、操作流程',
          items: [
            '点击「新增记录」填写楼栋、户号、房间类型',
            '如实填写蓄水开始时间和结束时间（系统自动校验≥24小时）',
            '上传水位照片并记录拍摄时间（照片须早于结束时间）',
            '选择渗漏结论：通过 / 渗漏 / 待定',
            '若结论为渗漏，使用「返修复测」添加复测记录（每次复测单独保存，不覆盖历史）'
          ]
        },
        {
          heading: '二、状态说明',
          items: [
            '🟢 正常通过：时间合格 + 照片合规 + 结论通过',
            '🟡 待复测：渗漏结论 + 尚未最终复测通过',
            '🔴 时间异常：蓄水<24小时 或 照片晚于结束时间',
            '🟠 水位不足：蓄水深度 < 2cm',
            '⚪ 未完成：开始或结束时间缺失'
          ]
        },
        {
          heading: '三、报告口径',
          items: [
            '筛选后「导出报告」的数量与列表结果一致',
            '每间房只取最新一次最终有效结论作为统计口径',
            '待复测房间在统计中计入渗漏项，直至复测通过'
          ]
        }
      ]
    },
    {
      title: '🗂 样例场景对照',
      sections: [
        {
          heading: '正常样例：1号楼1单元101 卫生间',
          items: ['蓄水48小时 ≥ 24h ✓', '水位3cm ≥ 2cm ✓', '照片时间合规 ✓', '结论：通过 ✓']
        },
        {
          heading: '渗漏+复测闭环：1号楼1单元101 厨房',
          items: ['首次试验发现渗漏', '第一次复测仍渗漏（保留历史）', '第二次复测通过（形成闭环）']
        },
        {
          heading: '时间不合格：1号楼2单元201 阳台',
          items: ['仅蓄水8小时 < 24h', '系统自动标记为「时间异常」']
        },
        {
          heading: '待复测：2号楼1单元302 主卫',
          items: ['发现渗漏正在返工中', '尚未提交复测通过结论', '筛选「待复测」可快速定位']
        }
      ]
    }
  ]
}
