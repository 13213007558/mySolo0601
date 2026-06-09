import { v4 as uuidv4 } from 'uuid';
import { ANNOTATION_STATUS } from '../db';

const mockBatchId = 'mock-batch-2024-06-12';

export const mockAnnotations = [
  {
    id: uuidv4(),
    annotationNo: 'AN-2024-001',
    building: '1号楼',
    major: '建筑',
    pageNo: 'A-01',
    description: '首层大堂入口雨棚挑出长度与立面图不一致，平面图显示1.5m，立面图显示1.2m，请确认。',
    source: 'pdf',
    assignee: '张工（建筑）',
    status: ANNOTATION_STATUS.REPLIED,
    priority: 'high',
    importBatchId: mockBatchId,
    hasError: false,
    errorType: null,
    imageUrl: null,
    createdAt: '2024-06-12T09:30:00.000Z',
    updatedAt: '2024-06-12T14:20:00.000Z'
  },
  {
    id: uuidv4(),
    annotationNo: 'AN-2024-002',
    building: '1号楼',
    major: '结构',
    pageNo: 'S-03',
    description: '二层梁配筋图中，L-12的箍筋间距标注有误，图中标注@100/200，但根据跨度应为@100全跨加密。',
    source: 'pdf',
    assignee: '李工（结构）',
    status: ANNOTATION_STATUS.IN_PROGRESS,
    priority: 'high',
    importBatchId: mockBatchId,
    hasError: false,
    errorType: null,
    imageUrl: null,
    createdAt: '2024-06-12T09:35:00.000Z',
    updatedAt: '2024-06-12T09:35:00.000Z'
  },
  {
    id: uuidv4(),
    annotationNo: 'AN-2024-003',
    building: '1号楼',
    major: '给排水',
    pageNo: 'W-05',
    description: '地下一层消防水泵房内，消火栓泵出水管管径标注DN150，但根据流量计算需要DN200。',
    source: 'wechat',
    assignee: '王工（给排水）',
    status: ANNOTATION_STATUS.ASSIGNED,
    priority: 'medium',
    importBatchId: mockBatchId,
    hasError: false,
    errorType: null,
    imageUrl: null,
    createdAt: '2024-06-12T10:15:00.000Z',
    updatedAt: '2024-06-12T11:00:00.000Z'
  },
  {
    id: uuidv4(),
    annotationNo: 'AN-2024-004',
    building: '2号楼',
    major: '暖通',
    pageNo: 'H-02',
    description: '标准层风管布置图中，厨房排风管风速过大，建议加大风管断面或增加风口数量。',
    source: 'excel',
    assignee: '赵工（暖通）',
    status: ANNOTATION_STATUS.PENDING,
    priority: 'medium',
    importBatchId: mockBatchId,
    hasError: false,
    errorType: null,
    imageUrl: null,
    createdAt: '2024-06-12T10:45:00.000Z',
    updatedAt: '2024-06-12T10:45:00.000Z'
  },
  {
    id: uuidv4(),
    annotationNo: 'AN-2024-005',
    building: '2号楼',
    major: '电气',
    pageNo: 'E-08',
    description: '应急照明系统图中，疏散指示标志灯的供电回路与普通照明混用，不符合消防规范要求。',
    source: 'pdf',
    assignee: '刘工（电气）',
    status: ANNOTATION_STATUS.REPLIED,
    priority: 'high',
    importBatchId: mockBatchId,
    hasError: false,
    errorType: null,
    imageUrl: null,
    createdAt: '2024-06-12T11:20:00.000Z',
    updatedAt: '2024-06-12T16:30:00.000Z'
  },
  {
    id: uuidv4(),
    annotationNo: 'AN-2024-006',
    building: '3号楼',
    major: '消防',
    pageNo: 'F-01',
    description: '消防电梯前室的正压送风口设置位置不当，被消火栓箱遮挡。',
    source: 'pdf',
    assignee: '陈工（消防）',
    status: ANNOTATION_STATUS.CLOSED,
    priority: 'medium',
    importBatchId: mockBatchId,
    hasError: false,
    errorType: null,
    imageUrl: null,
    createdAt: '2024-06-11T14:00:00.000Z',
    updatedAt: '2024-06-12T08:30:00.000Z'
  },
  {
    id: uuidv4(),
    annotationNo: 'AN-2024-007',
    building: '3号楼',
    major: '弱电',
    pageNo: 'T-04',
    description: '监控摄像头布置图中，地下车库角落存在监控盲区，建议补充2台半球摄像机。',
    source: 'wechat',
    assignee: '周工（弱电）',
    status: ANNOTATION_STATUS.ASSIGNED,
    priority: 'low',
    importBatchId: mockBatchId,
    hasError: false,
    errorType: null,
    imageUrl: null,
    createdAt: '2024-06-12T13:10:00.000Z',
    updatedAt: '2024-06-12T14:00:00.000Z'
  },
  {
    id: uuidv4(),
    annotationNo: 'AN-2024-008',
    building: '1号楼',
    major: '建筑',
    pageNo: '',
    description: '外墙保温材料厚度未明确标注，请补充。（缺少页码）',
    source: 'excel',
    assignee: '',
    status: ANNOTATION_STATUS.PENDING,
    priority: 'medium',
    importBatchId: mockBatchId,
    hasError: true,
    errorType: 'missing_page',
    imageUrl: null,
    createdAt: '2024-06-12T13:45:00.000Z',
    updatedAt: '2024-06-12T13:45:00.000Z'
  },
  {
    id: uuidv4(),
    annotationNo: 'AN-2024-009',
    building: '1号楼',
    major: '水专业',
    pageNo: 'W-12',
    description: '卫生间给排水立管位置与建筑墙体冲突。（专业名称错误）',
    source: 'excel',
    assignee: '',
    status: ANNOTATION_STATUS.PENDING,
    priority: 'high',
    importBatchId: mockBatchId,
    hasError: true,
    errorType: 'invalid_major',
    imageUrl: null,
    createdAt: '2024-06-12T14:20:00.000Z',
    updatedAt: '2024-06-12T14:20:00.000Z'
  },
  {
    id: uuidv4(),
    annotationNo: 'AN-2024-010',
    building: '9号楼',
    major: '结构',
    pageNo: 'S-05',
    description: '基础底板配筋图中，钢筋间距标注不清晰。（楼栋编号错误）',
    source: 'pdf',
    assignee: '',
    status: ANNOTATION_STATUS.PENDING,
    priority: 'medium',
    importBatchId: mockBatchId,
    hasError: true,
    errorType: 'invalid_building',
    imageUrl: null,
    createdAt: '2024-06-12T15:00:00.000Z',
    updatedAt: '2024-06-12T15:00:00.000Z'
  },
  {
    id: uuidv4(),
    annotationNo: 'AN-2024-011',
    building: '2号楼',
    major: '景观',
    pageNo: 'L-03',
    description: '南侧入口水景位置与弱电管线冲突，请协调。',
    source: 'pdf',
    assignee: '吴工（景观）',
    status: ANNOTATION_STATUS.IN_PROGRESS,
    priority: 'medium',
    importBatchId: mockBatchId,
    hasError: false,
    errorType: null,
    imageUrl: null,
    createdAt: '2024-06-12T15:30:00.000Z',
    updatedAt: '2024-06-12T15:30:00.000Z'
  },
  {
    id: uuidv4(),
    annotationNo: 'AN-2024-012',
    building: '1号楼',
    major: '室内',
    pageNo: 'I-01',
    description: '样板房精装修图纸中，主卧衣柜尺寸与建筑平面图不符。',
    source: 'wechat',
    assignee: '郑工（室内）',
    status: ANNOTATION_STATUS.PENDING,
    priority: 'low',
    importBatchId: mockBatchId,
    hasError: false,
    errorType: null,
    imageUrl: null,
    createdAt: '2024-06-12T16:00:00.000Z',
    updatedAt: '2024-06-12T16:00:00.000Z'
  }
];

export const mockReplies = [
  {
    id: uuidv4(),
    annotationId: '',
    content: '已确认，雨棚挑出长度应为1.5m，已通知设计院修改立面图。',
    replier: '张工（建筑）',
    repliedAt: '2024-06-12T14:20:00.000Z'
  },
  {
    id: uuidv4(),
    annotationId: '',
    content: '已发设计院确认，预计明天给出回复。',
    replier: '刘工（电气）',
    repliedAt: '2024-06-12T15:00:00.000Z'
  },
  {
    id: uuidv4(),
    annotationId: '',
    content: '设计院回复：按规范已单独设置回路，图纸标注有误，已出设计变更。',
    replier: '刘工（电气）',
    repliedAt: '2024-06-12T16:30:00.000Z'
  },
  {
    id: uuidv4(),
    annotationId: '',
    content: '已调整风口位置，出变更单编号：CX-2024-006。',
    replier: '陈工（消防）',
    repliedAt: '2024-06-12T08:30:00.000Z'
  }
];

export function getMockRepliesForAnnotations(annotations) {
  const replies = [];
  const an001 = annotations.find(a => a.annotationNo === 'AN-2024-001');
  const an005 = annotations.find(a => a.annotationNo === 'AN-2024-005');
  const an006 = annotations.find(a => a.annotationNo === 'AN-2024-006');
  
  if (an001) {
    replies.push({ ...mockReplies[0], annotationId: an001.id });
  }
  if (an005) {
    replies.push({ ...mockReplies[1], annotationId: an005.id });
    replies.push({ ...mockReplies[2], annotationId: an005.id });
  }
  if (an006) {
    replies.push({ ...mockReplies[3], annotationId: an006.id });
  }
  
  return replies;
}

export const excelImportTemplate = [
  {
    '批注编号': 'AN-2024-013',
    '楼栋': '2号楼',
    '专业': '建筑',
    '图纸页码': 'A-05',
    '批注内容': '三层会议室落地窗防护栏杆高度不足，图纸标注1050mm，规范要求1100mm。',
    '来源': 'pdf',
    '责任人': '张工（建筑）',
    '优先级': 'high'
  },
  {
    '批注编号': 'AN-2024-014',
    '楼栋': '3号楼',
    '专业': '结构',
    '图纸页码': 'S-08',
    '批注内容': '顶层坡屋顶梁的起坡点标注不明确，请补充详图。',
    '来源': 'excel',
    '责任人': '李工（结构）',
    '优先级': 'medium'
  },
  {
    '批注编号': 'AN-2024-015',
    '楼栋': '1号楼',
    '专业': '给排水',
    '图纸页码': '',
    '批注内容': '屋面雨水斗数量不足，请核算排水量后补充。（测试：缺少页码）',
    '来源': 'wechat',
    '责任人': '',
    '优先级': 'high'
  },
  {
    '批注编号': 'AN-2024-016',
    '楼栋': '1号楼',
    '专业': '空调',
    '图纸页码': 'H-10',
    '批注内容': '空调专业名称不规范，应为暖通。（测试：专业错误）',
    '来源': 'excel',
    '责任人': '',
    '优先级': 'medium'
  }
];

export const mockImportBatch = {
  id: mockBatchId,
  fileName: '6月12日图纸会审清单.xlsx',
  fileHash: 'mock-hash-20240612',
  importTime: '2024-06-12T17:00:00.000Z',
  recordCount: 12,
  errorCount: 3
};
