import { v4 as uuidv4 } from 'uuid';

export const mockChanges = [
  {
    id: uuidv4(),
    changeNo: 'CHG-2024-001',
    version: 2,
    title: '地下1层人防区域剪力墙位置调整',
    description: '根据人防办最新要求，地下1层人防区域3-5轴/C-E轴剪力墙需向内平移300mm，原设计位置与风管安装冲突。',
    source: 'design_letter',
    sourceRef: '设计院函件 R-2024-038',
    dateIssued: '2026-06-08',
    dateReceived: '2026-06-09',
    floorId: 'B1',
    major: 'structure',
    affectedAreas: ['剪力墙位置', '洞口位置', '人防区域'],
    constructionStatus: 'constructed',
    constructionProgress: '已完成80%，钢筋绑扎完成，模板已支设',
    impactLevel: 'high',
    costImpact: 85000,
    scheduleImpact: 5,
    processImpact: '需要拆除已绑扎的钢筋，重新定位放线',
    responsiblePerson: 'zhang',
    status: 'confirmed',
    attachments: [
      { name: '设计院变更函.pdf', type: 'pdf', size: '2.3MB' },
      { name: '现场照片_20260609.jpg', type: 'image', size: '4.1MB' }
    ],
    remarks: '已通知钢筋班暂停该区域施工，等待重新放线。',
    createdAt: '2026-06-09T10:30:00',
    updatedAt: '2026-06-10T14:20:00',
    history: [
      {
        id: uuidv4(),
        action: 'create',
        timestamp: '2026-06-09T10:30:00',
        operator: 'sun',
        oldValue: null,
        newValue: { status: 'pending', version: 1 },
        reason: '首次录入设计院变更函'
      },
      {
        id: uuidv4(),
        action: 'update',
        timestamp: '2026-06-09T15:20:00',
        operator: 'zhang',
        oldValue: { status: 'pending', responsiblePerson: null },
        newValue: { status: 'confirmed', responsiblePerson: 'zhang' },
        reason: '结构工程师确认变更影响，预计返工成本约8.5万'
      },
      {
        id: uuidv4(),
        action: 'version_update',
        timestamp: '2026-06-10T14:20:00',
        operator: 'li',
        oldValue: { version: 1, description: '地下1层人防区域剪力墙需向内平移200mm' },
        newValue: { version: 2, description: '地下1层人防区域剪力墙需向内平移300mm' },
        reason: '设计院补发第二版变更函，平移距离从200mm调整为300mm'
      }
    ]
  },
  {
    id: uuidv4(),
    changeNo: 'CHG-2024-002',
    version: 1,
    title: '3层办公区吊顶高度调整',
    description: '应业主要求，3层办公区公共走廊吊顶高度从2.8米提高到3.0米，需调整机电管线综合排布。',
    source: 'design_letter',
    sourceRef: '设计院函件 A-2024-015',
    dateIssued: '2026-06-07',
    dateReceived: '2026-06-08',
    floorId: 'F3',
    major: 'architecture',
    affectedAreas: ['吊顶高度', '预埋管线'],
    constructionStatus: 'partial',
    constructionProgress: '吊顶吊杆已安装，机电管线正在安装',
    impactLevel: 'medium',
    costImpact: 28000,
    scheduleImpact: 2,
    processImpact: '需调整部分吊杆高度，机电管线需重新排布',
    responsiblePerson: 'li',
    status: 'pending',
    attachments: [
      { name: '业主工作联系单.pdf', type: 'pdf', size: '1.2MB' }
    ],
    remarks: '需与机电各专业协调后确认最终方案。',
    createdAt: '2026-06-08T09:15:00',
    updatedAt: '2026-06-08T09:15:00',
    history: [
      {
        id: uuidv4(),
        action: 'create',
        timestamp: '2026-06-08T09:15:00',
        operator: 'sun',
        oldValue: null,
        newValue: { status: 'pending' },
        reason: '录入业主吊顶高度调整要求'
      }
    ]
  },
  {
    id: uuidv4(),
    changeNo: 'CHG-2024-003',
    version: 1,
    title: '5层酒店客房卫生间管道井尺寸调整',
    description: '酒店管理公司要求5层酒店客房卫生间管道井净宽从800mm增加到1000mm，便于后期维修。',
    source: 'change_ledger',
    sourceRef: '变更台账 2024-042',
    dateIssued: '2026-06-05',
    dateReceived: '2026-06-06',
    floorId: 'F5',
    major: 'plumbing',
    affectedAreas: ['卫生间', '剪力墙位置'],
    constructionStatus: 'drawing',
    constructionProgress: '该区域尚未开始施工，处于图纸深化阶段',
    impactLevel: 'low',
    costImpact: 5000,
    scheduleImpact: 0,
    processImpact: '仅需调整图纸，不影响现场施工',
    responsiblePerson: 'zhao',
    status: 'implemented',
    attachments: [],
    remarks: '该变更不影响当前施工，直接在图纸中修改即可。',
    createdAt: '2026-06-06T11:00:00',
    updatedAt: '2026-06-09T16:45:00',
    history: [
      {
        id: uuidv4(),
        action: 'create',
        timestamp: '2026-06-06T11:00:00',
        operator: 'sun',
        oldValue: null,
        newValue: { status: 'pending' },
        reason: '录入酒店管理公司管道井调整要求'
      },
      {
        id: uuidv4(),
        action: 'update',
        timestamp: '2026-06-06T14:30:00',
        operator: 'zhao',
        oldValue: { status: 'pending' },
        newValue: { status: 'confirmed', responsiblePerson: 'zhao' },
        reason: '给排水工程师确认，仅影响图纸，不产生成本'
      },
      {
        id: uuidv4(),
        action: 'update',
        timestamp: '2026-06-09T16:45:00',
        operator: 'zhao',
        oldValue: { status: 'confirmed' },
        newValue: { status: 'implemented' },
        reason: '图纸修改完成，已更新BIM模型'
      }
    ]
  },
  {
    id: uuidv4(),
    changeNo: 'CHG-2024-004',
    version: 3,
    title: '地下2层车库柱网调整',
    description: '根据最新停车效率分析，地下2层车库8-12轴/A-D轴柱距从8.1米调整为8.4米，增加2个停车位。',
    source: 'design_letter',
    sourceRef: '设计院函件 S-2024-027',
    dateIssued: '2026-06-03',
    dateReceived: '2026-06-04',
    floorId: 'B2',
    major: 'structure',
    affectedAreas: ['柱网布置', '停车位'],
    constructionStatus: 'constructed',
    constructionProgress: '该区域基础和柱已浇筑完成',
    impactLevel: 'high',
    costImpact: 120000,
    scheduleImpact: 7,
    processImpact: '已浇筑的柱需拆除重建，基础需加固',
    responsiblePerson: 'zhang',
    status: 'rejected',
    attachments: [
      { name: '现场照片_柱浇筑完成.jpg', type: 'image', size: '3.8MB' },
      { name: '成本分析报告.xlsx', type: 'xlsx', size: '85KB' }
    ],
    remarks: '该变更成本过高，已建议设计院考虑其他方案。',
    createdAt: '2026-06-04T13:20:00',
    updatedAt: '2026-06-10T09:30:00',
    history: [
      {
        id: uuidv4(),
        action: 'create',
        timestamp: '2026-06-04T13:20:00',
        operator: 'sun',
        oldValue: null,
        newValue: { status: 'pending', version: 1 },
        reason: '录入柱网调整变更'
      },
      {
        id: uuidv4(),
        action: 'revert',
        timestamp: '2026-06-05T10:00:00',
        operator: 'qian',
        oldValue: { impactLevel: 'medium', costImpact: 30000 },
        newValue: { impactLevel: 'high', costImpact: 120000 },
        reason: '【误判撤回】钱工误将影响等级判为中等，实际柱已浇筑，返工成本很高'
      },
      {
        id: uuidv4(),
        action: 'update',
        timestamp: '2026-06-05T15:00:00',
        operator: 'zhang',
        oldValue: { status: 'pending' },
        newValue: { status: 'rejected' },
        reason: '成本过高，建议优化方案'
      },
      {
        id: uuidv4(),
        action: 'version_update',
        timestamp: '2026-06-08T11:00:00',
        operator: 'zhang',
        oldValue: { version: 1 },
        newValue: { version: 2 },
        reason: '设计院修改方案，柱距调整范围缩小'
      },
      {
        id: uuidv4(),
        action: 'version_update',
        timestamp: '2026-06-10T09:30:00',
        operator: 'zhang',
        oldValue: { version: 2, description: '柱距从8.1米调整为8.4米' },
        newValue: { version: 3, description: '柱距从8.1米调整为8.4米，增加2个停车位' },
        reason: '设计院发布第三版，补充说明增加停车位'
      }
    ]
  },
  {
    id: uuidv4(),
    changeNo: 'CHG-2024-005',
    version: 1,
    title: '屋面层设备基础位置调整',
    description: '屋面层冷水机组设备基础位置需向东平移1.5米，与冷却塔管线连接更短。',
    source: 'site_photo',
    sourceRef: '现场照片 2024-06-08',
    dateIssued: '2026-06-07',
    dateReceived: '2026-06-07',
    floorId: 'roof',
    major: 'mechanical',
    affectedAreas: ['设备基础', '预埋管线'],
    constructionStatus: 'partial',
    constructionProgress: '设备基础钢筋已绑扎，尚未浇筑',
    impactLevel: 'low',
    costImpact: 3000,
    scheduleImpact: 1,
    processImpact: '需调整基础钢筋位置',
    responsiblePerson: 'wang',
    status: 'confirmed',
    attachments: [
      { name: '现场定位照片.jpg', type: 'image', size: '2.1MB' }
    ],
    remarks: '调整量不大，现场可直接处理。',
    createdAt: '2026-06-07T16:00:00',
    updatedAt: '2026-06-08T10:00:00',
    history: [
      {
        id: uuidv4(),
        action: 'create',
        timestamp: '2026-06-07T16:00:00',
        operator: 'sun',
        oldValue: null,
        newValue: { status: 'pending' },
        reason: '根据现场实际情况，设备基础位置需要调整'
      },
      {
        id: uuidv4(),
        action: 'update',
        timestamp: '2026-06-08T10:00:00',
        operator: 'wang',
        oldValue: { status: 'pending' },
        newValue: { status: 'confirmed', responsiblePerson: 'wang' },
        reason: '机电工程师确认，影响很小'
      }
    ]
  },
  {
    id: uuidv4(),
    changeNo: 'CHG-2024-006',
    version: 2,
    title: '2层商场消防喷淋布置调整',
    description: '根据消防局最新审查意见，2层商场中庭区域需加密喷淋布置，喷头间距从3.6米调整为3.0米。',
    source: 'design_letter',
    sourceRef: '设计院函件 F-2024-012',
    dateIssued: '2026-06-06',
    dateReceived: '2026-06-06',
    floorId: 'F2',
    major: 'fire',
    affectedAreas: ['预埋管线'],
    constructionStatus: 'drawing',
    constructionProgress: '该区域尚未开始消防施工',
    impactLevel: 'none',
    costImpact: 0,
    scheduleImpact: 0,
    processImpact: '仅需调整喷淋系统图纸',
    responsiblePerson: 'zhou',
    status: 'confirmed',
    attachments: [
      { name: '消防审查意见.pdf', type: 'pdf', size: '1.5MB' }
    ],
    remarks: '图纸调整完成后即可施工。',
    createdAt: '2026-06-06T14:00:00',
    updatedAt: '2026-06-09T11:30:00',
    history: [
      {
        id: uuidv4(),
        action: 'create',
        timestamp: '2026-06-06T14:00:00',
        operator: 'sun',
        oldValue: null,
        newValue: { status: 'pending', version: 1 },
        reason: '录入消防局审查意见'
      },
      {
        id: uuidv4(),
        action: 'update',
        timestamp: '2026-06-07T09:00:00',
        operator: 'zhou',
        oldValue: { status: 'pending' },
        newValue: { status: 'confirmed', responsiblePerson: 'zhou' },
        reason: '消防工程师确认，仅图纸调整'
      },
      {
        id: uuidv4(),
        action: 'version_update',
        timestamp: '2026-06-09T11:30:00',
        operator: 'zhou',
        oldValue: { version: 1, description: '喷头间距从3.6米调整为2.8米' },
        newValue: { version: 2, description: '喷头间距从3.6米调整为3.0米' },
        reason: '设计院调整方案，从2.8米改为3.0米，更经济合理'
      }
    ]
  },
  {
    id: uuidv4(),
    changeNo: 'CHG-2024-007',
    version: 1,
    title: '4层住宅区电梯井尺寸调整',
    description: '根据电梯厂家最新资料，4层住宅区电梯井道净空尺寸需增加50mm，满足新型号电梯安装要求。',
    source: 'verbal',
    sourceRef: '电梯厂家电话通知',
    dateIssued: '2026-06-09',
    dateReceived: '2026-06-09',
    floorId: 'F4',
    major: 'architecture',
    affectedAreas: ['电梯井', '剪力墙位置'],
    constructionStatus: 'partial',
    constructionProgress: '电梯井道墙体正在砌筑，已完成60%',
    impactLevel: 'medium',
    costImpact: 15000,
    scheduleImpact: 2,
    processImpact: '已砌筑的部分墙体需拆除重建',
    responsiblePerson: 'li',
    status: 'pending',
    attachments: [],
    remarks: '需等待电梯厂家正式书面文件确认。',
    createdAt: '2026-06-09T11:30:00',
    updatedAt: '2026-06-09T11:30:00',
    history: [
      {
        id: uuidv4(),
        action: 'create',
        timestamp: '2026-06-09T11:30:00',
        operator: 'sun',
        oldValue: null,
        newValue: { status: 'pending' },
        reason: '电梯厂家口头通知井道尺寸需要调整'
      }
    ]
  },
  {
    id: uuidv4(),
    changeNo: 'CHG-2024-008',
    version: 1,
    title: '1层大堂空调机位调整',
    description: '1层大堂空调外机位置从北侧调整到东侧，避免影响主入口景观效果。',
    source: 'change_ledger',
    sourceRef: '变更台账 2024-038',
    dateIssued: '2026-06-05',
    dateReceived: '2026-06-05',
    floorId: 'F1',
    major: 'hvac',
    affectedAreas: ['空调机位', '预埋管线'],
    constructionStatus: 'drawing',
    constructionProgress: '空调管线尚未安装',
    impactLevel: 'low',
    costImpact: 8000,
    scheduleImpact: 1,
    processImpact: '需调整空调管线走向',
    responsiblePerson: 'chen',
    status: 'implemented',
    attachments: [
      { name: '景观影响分析图.pdf', type: 'pdf', size: '2.8MB' }
    ],
    remarks: '调整后对景观效果有明显提升。',
    createdAt: '2026-06-05T10:00:00',
    updatedAt: '2026-06-08T15:00:00',
    history: [
      {
        id: uuidv4(),
        action: 'create',
        timestamp: '2026-06-05T10:00:00',
        operator: 'sun',
        oldValue: null,
        newValue: { status: 'pending' },
        reason: '景观设计师建议调整空调机位'
      },
      {
        id: uuidv4(),
        action: 'update',
        timestamp: '2026-06-05T14:00:00',
        operator: 'chen',
        oldValue: { status: 'pending' },
        newValue: { status: 'confirmed', responsiblePerson: 'chen' },
        reason: '暖通工程师确认，管线调整可行'
      },
      {
        id: uuidv4(),
        action: 'update',
        timestamp: '2026-06-08T15:00:00',
        operator: 'chen',
        oldValue: { status: 'confirmed' },
        newValue: { status: 'implemented' },
        reason: '图纸调整完成，已交底给施工班组'
      }
    ]
  },
  {
    id: uuidv4(),
    changeNo: 'CHG-2024-009',
    version: 1,
    title: '6层写字楼强弱电井位置调整',
    description: '根据弱电系统深化设计，6层写字楼强弱电井位置需向西平移500mm，满足机柜布置要求。',
    source: 'design_letter',
    sourceRef: '设计院函件 E-2024-009',
    dateIssued: '2026-06-08',
    dateReceived: '2026-06-09',
    floorId: 'F6',
    major: 'electrical',
    affectedAreas: ['剪力墙位置', '洞口位置', '预埋管线'],
    constructionStatus: 'drawing',
    constructionProgress: '该区域尚未开始施工',
    impactLevel: 'none',
    costImpact: 0,
    scheduleImpact: 0,
    processImpact: '仅需调整建筑和结构图',
    responsiblePerson: 'liu',
    status: 'confirmed',
    attachments: [
      { name: '弱电系统布置图.pdf', type: 'pdf', size: '3.2MB' }
    ],
    remarks: '该变更是为了满足弱电系统机柜布置要求。',
    createdAt: '2026-06-09T08:45:00',
    updatedAt: '2026-06-09T15:30:00',
    history: [
      {
        id: uuidv4(),
        action: 'create',
        timestamp: '2026-06-09T08:45:00',
        operator: 'sun',
        oldValue: null,
        newValue: { status: 'pending' },
        reason: '录入电气专业井道位置调整'
      },
      {
        id: uuidv4(),
        action: 'update',
        timestamp: '2026-06-09T15:30:00',
        operator: 'liu',
        oldValue: { status: 'pending' },
        newValue: { status: 'confirmed', responsiblePerson: 'liu' },
        reason: '电气工程师确认，不影响施工'
      }
    ]
  }
];

export const importTemplate = [
  {
    changeNo: 'CHG-2024-010',
    title: '7层公寓阳台栏杆高度调整',
    description: '应规范要求，7层公寓阳台栏杆高度从1.1米提高到1.2米。',
    source: 'design_letter',
    sourceRef: '设计院函件 A-2024-018',
    dateIssued: '2026-06-09',
    dateReceived: '2026-06-10',
    floorId: 'F7',
    major: 'architecture',
    affectedAreas: '阳台',
    constructionStatus: 'drawing',
    constructionProgress: '尚未施工',
    impactLevel: 'low',
    costImpact: 12000,
    scheduleImpact: 1,
    processImpact: '调整阳台栏杆高度',
    responsiblePerson: 'li',
    status: 'pending',
    remarks: '需检查已下单的栏杆材料是否可以修改'
  },
  {
    changeNo: 'CHG-2024-011',
    title: '8层酒店厨房排油烟管井调整',
    description: '8层酒店厨房排油烟管井尺寸需从800x600调整为1000x800，满足排油烟量要求。',
    source: 'design_letter',
    sourceRef: '设计院函件 M-2024-006',
    dateIssued: '2026-06-08',
    dateReceived: '2026-06-09',
    floorId: 'F8',
    major: 'mechanical',
    affectedAreas: '剪力墙位置,洞口位置',
    constructionStatus: 'constructed',
    constructionProgress: '管井墙体已砌筑完成',
    impactLevel: 'high',
    costImpact: 65000,
    scheduleImpact: 4,
    processImpact: '已砌筑的墙体需拆除重建',
    responsiblePerson: 'wang',
    status: 'pending',
    remarks: '需要与厨房设备厂家确认排油烟量'
  },
  {
    changeNo: 'CHG-2024-012',
    title: '9层会所游泳池结构降板调整',
    description: '9层会所游泳池区域结构降板从300mm增加到500mm，满足泳池设备安装要求。',
    source: 'change_ledger',
    sourceRef: '变更台账 2024-045',
    dateIssued: '2026-06-07',
    dateReceived: '2026-06-08',
    floorId: 'F9',
    major: 'structure',
    affectedAreas: '板厚,设备基础',
    constructionStatus: 'partial',
    constructionProgress: '楼板模板已支设，钢筋尚未绑扎',
    impactLevel: 'medium',
    costImpact: 35000,
    scheduleImpact: 2,
    processImpact: '需调整模板高度和钢筋下料长度',
    responsiblePerson: 'zhang',
    status: 'confirmed',
    remarks: '需检查结构梁是否需要调整'
  },
  {
    changeNo: 'CHG-2024-013',
    title: '10层屋顶花园防水层调整',
    description: '10层屋顶花园防水材料从SBS改性沥青防水改为TPO防水卷材，提高耐久性。',
    source: 'verbal',
    sourceRef: '业主口头通知',
    dateIssued: '2026-06-10',
    dateReceived: '2026-06-10',
    floorId: 'F10',
    major: 'architecture',
    affectedAreas: '防水层',
    constructionStatus: 'drawing',
    constructionProgress: '尚未施工',
    impactLevel: 'low',
    costImpact: 8000,
    scheduleImpact: 0,
    processImpact: '仅需调整材料，不影响施工工艺',
    responsiblePerson: 'li',
    status: 'pending',
    remarks: '需等待业主正式书面文件'
  }
];
