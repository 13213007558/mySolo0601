import { getMeta, setMeta, saveAllHoles } from '../utils/storage';

export const professions = ['给排水', '暖通', '电气', '消防', '燃气'];

export const floors = ['B2层', 'B1层', '1层', '2层', '3层', '4层', '5层', '屋面'];

export const issueTypes = ['normal', 'missing', 'deviation'];

export const repairStatusMap = {
  pending: { label: '待审核', color: 'warning' },
  approved: { label: '已批准', color: 'success' },
  rejected: { label: '已退回', color: 'error' }
};

export const issueTypeMap = {
  normal: { label: '正常', color: 'success' },
  missing: { label: '缺洞', color: 'error' },
  deviation: { label: '偏位', color: 'warning' }
};

export function generateMockData() {
  const now = new Date();

  return [
    {
      id: 'hole_001',
      code: 'SD-001',
      floor: 'B2层',
      axis: 'A轴/3轴',
      sizeRaw: '200x300',
      size: { width: 300, height: 200, valid: true, unit: 'mm' },
      profession: '给排水',
      issueType: 'normal',
      status: null,
      description: '废水立管预留洞',
      photos: [],
      repairApplications: [],
      createdAt: new Date(now - 7 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(now - 7 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'hole_002',
      code: 'SD-002',
      floor: 'B2层',
      axis: 'B轴/5轴',
      sizeRaw: '200*300',
      size: { width: 300, height: 200, valid: true, unit: 'mm' },
      profession: '给排水',
      issueType: 'missing',
      status: 'pending',
      description: '消防喷淋主管预留洞',
      photos: [],
      repairApplications: [
        {
          id: 'repair_001',
          reason: '结构施工时遗漏，需补开',
          applicant: '张工',
          status: 'pending',
          createdAt: new Date(now - 2 * 24 * 3600 * 1000).toISOString()
        }
      ],
      createdAt: new Date(now - 5 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(now - 2 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'hole_003',
      code: 'NT-001',
      floor: 'B1层',
      axis: 'C轴/7轴',
      sizeRaw: '宽五百毫米高四百毫米',
      size: { width: 500, height: 400, valid: true, unit: 'mm' },
      profession: '暖通',
      issueType: 'deviation',
      status: 'approved',
      description: '新风主管预留洞，偏位约150mm',
      photos: [],
      repairApplications: [
        {
          id: 'repair_002',
          reason: '洞口偏位，需扩孔调整',
          applicant: '李工',
          status: 'approved',
          reviewComment: '同意扩孔，注意避开钢筋',
          reviewedAt: new Date(now - 1 * 24 * 3600 * 1000).toISOString(),
          reviewedBy: '王工',
          createdAt: new Date(now - 3 * 24 * 3600 * 1000).toISOString()
        }
      ],
      createdAt: new Date(now - 6 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(now - 1 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'hole_004',
      code: 'DQ-001',
      floor: '1层',
      axis: 'D轴/4轴',
      sizeRaw: '300x200',
      size: { width: 300, height: 200, valid: true, unit: 'mm' },
      profession: '电气',
      issueType: 'missing',
      status: 'rejected',
      description: '强电桥架预留洞，已申请补开被退回',
      photos: [],
      repairApplications: [
        {
          id: 'repair_003',
          reason: '遗漏需补开',
          applicant: '赵工',
          status: 'rejected',
          reviewComment: '资料不全，请补充结构图纸和照片证据',
          reviewedAt: new Date(now - 4 * 24 * 3600 * 1000).toISOString(),
          reviewedBy: '王工',
          createdAt: new Date(now - 5 * 24 * 3600 * 1000).toISOString()
        },
        {
          id: 'repair_004',
          reason: '已补充结构图纸和现场照片，重新申请',
          applicant: '赵工',
          status: 'pending',
          supplemental: '补充了B1层结构平面图、现场照片3张',
          supplementedAt: new Date(now - 1 * 24 * 3600 * 1000).toISOString(),
          createdAt: new Date(now - 1 * 24 * 3600 * 1000).toISOString()
        }
      ],
      createdAt: new Date(now - 6 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(now - 1 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'hole_005',
      code: 'XF-001',
      floor: '2层',
      axis: 'E轴/9轴',
      sizeRaw: '250x250',
      size: { width: 250, height: 250, valid: true, unit: 'mm' },
      profession: '消防',
      issueType: 'deviation',
      status: null,
      description: '消防立管预留洞，偏位约50mm，可不处理',
      photos: [],
      repairApplications: [],
      createdAt: new Date(now - 4 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(now - 4 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'hole_006',
      code: 'SD-003',
      floor: '3层',
      axis: 'A轴/2轴',
      sizeRaw: '尺寸待确认',
      size: { width: null, height: null, valid: false, error: '无法解析尺寸格式' },
      profession: '给排水',
      issueType: 'missing',
      status: null,
      description: '雨水立管预留洞，尺寸需查图纸确认',
      photos: [],
      repairApplications: [],
      isProblem: true,
      problemReason: '尺寸解析失败',
      createdAt: new Date(now - 3 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(now - 3 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'hole_007',
      code: 'NT-002',
      floor: 'B1层',
      axis: 'B轴/8轴',
      sizeRaw: '400×350',
      size: { width: 400, height: 350, valid: true, unit: 'mm' },
      profession: '暖通',
      issueType: 'normal',
      status: null,
      description: '排风支管预留洞',
      photos: [],
      repairApplications: [],
      createdAt: new Date(now - 5 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(now - 5 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'hole_008',
      code: 'DQ-002',
      floor: '4层',
      axis: 'C轴/6轴',
      sizeRaw: '一百五十乘两百',
      size: { width: 200, height: 150, valid: true, unit: 'mm' },
      profession: '电气',
      issueType: 'missing',
      status: null,
      description: '弱电桥架预留洞，待申请补开',
      photos: [],
      repairApplications: [],
      createdAt: new Date(now - 2 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(now - 2 * 24 * 3600 * 1000).toISOString()
    }
  ];
}

export function initializeMockData() {
  const meta = getMeta();
  if (!meta.initialized) {
    const mockData = generateMockData();
    saveAllHoles(mockData);
    setMeta({ initialized: true, initializedAt: new Date().toISOString() });
    return true;
  }
  return false;
}
