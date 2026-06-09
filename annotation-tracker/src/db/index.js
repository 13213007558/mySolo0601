import Dexie from 'dexie';

export const db = new Dexie('AnnotationTrackerDB');

db.version(1).stores({
  annotations: `
    id,
    annotationNo,
    building,
    major,
    pageNo,
    description,
    source,
    assignee,
    status,
    priority,
    importBatchId,
    hasError,
    errorType,
    imageUrl,
    createdAt,
    updatedAt,
    [building+major+status]
  `,
  replies: `
    id,
    annotationId,
    content,
    replier,
    repliedAt,
    [annotationId+repliedAt]
  `,
  importBatches: `
    id,
    fileName,
    fileHash,
    importTime,
    recordCount,
    errorCount,
    [fileHash]
  `
});

export const ANNOTATION_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  REPLIED: 'replied',
  CLOSED: 'closed'
};

export const ANNOTATION_STATUS_LABELS = {
  [ANNOTATION_STATUS.PENDING]: '待分派',
  [ANNOTATION_STATUS.ASSIGNED]: '已分派',
  [ANNOTATION_STATUS.IN_PROGRESS]: '处理中',
  [ANNOTATION_STATUS.REPLIED]: '已回复',
  [ANNOTATION_STATUS.CLOSED]: '已关闭'
};

export const ANNOTATION_STATUS_COLORS = {
  [ANNOTATION_STATUS.PENDING]: 'bg-slate-100 text-slate-700',
  [ANNOTATION_STATUS.ASSIGNED]: 'bg-blue-100 text-blue-700',
  [ANNOTATION_STATUS.IN_PROGRESS]: 'bg-amber-100 text-amber-700',
  [ANNOTATION_STATUS.REPLIED]: 'bg-green-100 text-green-700',
  [ANNOTATION_STATUS.CLOSED]: 'bg-gray-100 text-gray-500'
};

export const PRIORITY_LABELS = {
  high: '高',
  medium: '中',
  low: '低'
};

export const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-green-100 text-green-700'
};

export const SOURCE_LABELS = {
  pdf: 'PDF 截图',
  wechat: '微信群',
  excel: 'Excel 清单'
};

export const MAJORS = [
  '建筑', '结构', '给排水', '暖通', '电气', '消防', '弱电', '景观', '室内'
];

export const BUILDINGS = [
  '1号楼', '2号楼', '3号楼', '4号楼', '5号楼', '6号楼', '7号楼', '8号楼'
];

export const ASSIGNEES = [
  '张工（建筑）', '李工（结构）', '王工（给排水）', '赵工（暖通）',
  '刘工（电气）', '陈工（消防）', '周工（弱电）', '吴工（景观）', '郑工（室内）'
];

export const ERROR_TYPES = {
  MISSING_PAGE: 'missing_page',
  INVALID_MAJOR: 'invalid_major',
  INVALID_BUILDING: 'invalid_building',
  DUPLICATE: 'duplicate'
};

export const ERROR_TYPE_LABELS = {
  [ERROR_TYPES.MISSING_PAGE]: '缺少图纸页码',
  [ERROR_TYPES.INVALID_MAJOR]: '专业名称错误',
  [ERROR_TYPES.INVALID_BUILDING]: '楼栋编号错误',
  [ERROR_TYPES.DUPLICATE]: '重复记录'
};
