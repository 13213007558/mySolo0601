import type { AcceptanceRecord, StatusHistory, User } from '@/types';
import { generateId } from './validator';
import { getNowString } from './date';

function createPlaceholderImage(color: string, text: string): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
      <rect width="300" height="200" fill="${color}" opacity="0.2"/>
      <rect x="10" y="10" width="280" height="180" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="5,5"/>
      <text x="150" y="100" font-family="sans-serif" font-size="14" fill="${color}" text-anchor="middle">${text}</text>
      <text x="150" y="130" font-family="sans-serif" font-size="12" fill="#666" text-anchor="middle">（样例占位图）</text>
    </svg>
  `;
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

const USERS: User[] = [
  { id: 'u1', name: '张伟', role: 'PROJECT_MANAGER' },
  { id: 'u2', name: '李工', role: 'SUPERVISOR' },
  { id: 'u3', name: '王芳', role: 'DOCUMENT_CONTROLLER' }
];

export function getSampleData(): { records: AcceptanceRecord[]; history: StatusHistory[]; users: User[] } {
  const now = getNowString();

  const records: AcceptanceRecord[] = [
    {
      id: generateId(),
      projectName: '城市之星一期工程',
      axis: 'A-B/1-2',
      location: '地下室负二层',
      workType: '地下室墙筋',
      acceptanceDate: '2024-01-15',
      formworkDate: '2024-01-14',
      description: '地下室负二层A-B/1-2轴墙体钢筋绑扎完成，钢筋间距、规格符合设计要求，保护层厚度合格。',
      status: 'ARCHIVABLE',
      evidence: [
        {
          id: generateId(),
          type: 'ACCEPTANCE_FORM',
          name: '隐蔽工程验收单_20240115.pdf',
          dataUrl: createPlaceholderImage('#1E3A8A', '验收单扫描件'),
          uploadTime: '2024-01-15T10:30:00',
          uploadedBy: '张伟'
        },
        {
          id: generateId(),
          type: 'SITE_PHOTO',
          name: '墙筋绑扎完成照片.jpg',
          dataUrl: createPlaceholderImage('#059669', '地下室墙筋照片'),
          uploadTime: '2024-01-15T10:35:00',
          uploadedBy: '张伟'
        }
      ],
      createdBy: '张伟',
      createdAt: '2024-01-15T10:00:00',
      updatedAt: '2024-01-15T16:00:00'
    },
    {
      id: generateId(),
      projectName: '城市之星一期工程',
      axis: 'C-D/3-4',
      location: '主体三层',
      workType: '梁板钢筋',
      acceptanceDate: '2024-01-16',
      formworkDate: '2024-01-15',
      description: '三层C-D/3-4轴梁板钢筋安装完成，正在等待监理验收。',
      status: 'PENDING_EVIDENCE',
      evidence: [
        {
          id: generateId(),
          type: 'ACCEPTANCE_FORM',
          name: '隐蔽工程验收单_20240116.pdf',
          dataUrl: createPlaceholderImage('#1E3A8A', '验收单扫描件'),
          uploadTime: '2024-01-16T09:00:00',
          uploadedBy: '张伟'
        }
      ],
      createdBy: '张伟',
      createdAt: '2024-01-16T09:00:00',
      updatedAt: '2024-01-16T14:30:00'
    },
    {
      id: generateId(),
      projectName: '城市之星一期工程',
      axis: 'E-F/5-6',
      location: '主体二层',
      workType: '柱筋绑扎',
      acceptanceDate: '2024-01-17',
      formworkDate: '2024-01-16',
      description: '二层E-F/5-6轴柱筋绑扎完成，电渣压力焊取样合格。',
      status: 'REJECTED',
      rejectReason: '箍筋间距不均匀，部分柱筋偏移超过规范要求，需整改后重新报验。',
      evidence: [
        {
          id: generateId(),
          type: 'ACCEPTANCE_FORM',
          name: '隐蔽工程验收单_20240117.pdf',
          dataUrl: createPlaceholderImage('#1E3A8A', '验收单扫描件'),
          uploadTime: '2024-01-17T08:30:00',
          uploadedBy: '张伟'
        },
        {
          id: generateId(),
          type: 'SITE_PHOTO',
          name: '柱筋绑扎照片.jpg',
          dataUrl: createPlaceholderImage('#DC2626', '柱筋绑扎照片'),
          uploadTime: '2024-01-17T08:35:00',
          uploadedBy: '张伟'
        }
      ],
      createdBy: '张伟',
      createdAt: '2024-01-17T08:30:00',
      updatedAt: '2024-01-17T11:00:00'
    },
    {
      id: generateId(),
      projectName: '城市之星一期工程',
      axis: 'G-H/7-8',
      location: '地下室负一层',
      workType: '后浇带',
      acceptanceDate: '2024-01-18',
      formworkDate: '2024-01-17',
      description: '地下室负一层G-H/7-8轴后浇带钢筋安装及止水钢板设置。',
      status: 'SUBMITTED',
      evidence: [
        {
          id: generateId(),
          type: 'ACCEPTANCE_FORM',
          name: '隐蔽工程验收单_20240118.pdf',
          dataUrl: createPlaceholderImage('#1E3A8A', '验收单扫描件'),
          uploadTime: '2024-01-18T10:00:00',
          uploadedBy: '张伟'
        },
        {
          id: generateId(),
          type: 'SITE_PHOTO',
          name: '后浇带钢筋照片.jpg',
          dataUrl: createPlaceholderImage('#F59E0B', '后浇带照片'),
          uploadTime: '2024-01-18T10:05:00',
          uploadedBy: '张伟'
        },
        {
          id: generateId(),
          type: 'SUPPLEMENT_NOTE',
          name: '口头补签说明.pdf',
          dataUrl: createPlaceholderImage('#8B5CF6', '补签说明'),
          uploadTime: '2024-01-18T10:10:00',
          uploadedBy: '张伟'
        }
      ],
      createdBy: '张伟',
      createdAt: '2024-01-18T10:00:00',
      updatedAt: '2024-01-18T10:00:00'
    },
    {
      id: generateId(),
      projectName: '城市之星一期工程',
      axis: 'B-C/2-3',
      location: '主体四层',
      workType: '剪力墙钢筋',
      acceptanceDate: '2024-01-19',
      formworkDate: '2024-01-18',
      description: '四层B-C/2-3轴剪力墙钢筋绑扎，监理要求补证后重新提交。',
      status: 'PENDING_EVIDENCE',
      evidence: [
        {
          id: generateId(),
          type: 'ACCEPTANCE_FORM',
          name: '隐蔽工程验收单_20240119.pdf',
          dataUrl: createPlaceholderImage('#1E3A8A', '验收单扫描件'),
          uploadTime: '2024-01-19T08:00:00',
          uploadedBy: '张伟'
        },
        {
          id: generateId(),
          type: 'SUPPLEMENT_NOTE',
          name: '监理口头通知补证说明.pdf',
          dataUrl: createPlaceholderImage('#8B5CF6', '补签说明'),
          uploadTime: '2024-01-19T09:30:00',
          uploadedBy: '李工'
        }
      ],
      createdBy: '张伟',
      createdAt: '2024-01-19T08:00:00',
      updatedAt: '2024-01-19T10:00:00'
    },
    {
      id: generateId(),
      projectName: '城市之星二期工程',
      axis: 'A-B/10-11',
      location: '地下室负一层',
      workType: '预埋管线',
      acceptanceDate: '2024-01-20',
      formworkDate: '2024-01-19',
      description: '地下室负一层A-B/10-11轴水电管线预埋，管线路由符合设计要求。',
      status: 'DRAFT',
      evidence: [],
      createdBy: '张伟',
      createdAt: now,
      updatedAt: now
    }
  ];

  const history: StatusHistory[] = [
    {
      id: generateId(),
      recordId: records[0].id,
      fromStatus: 'DRAFT',
      toStatus: 'SUBMITTED',
      operator: '张伟',
      operatorRole: 'PROJECT_MANAGER',
      timestamp: '2024-01-15T10:00:00'
    },
    {
      id: generateId(),
      recordId: records[0].id,
      fromStatus: 'SUBMITTED',
      toStatus: 'ARCHIVABLE',
      reason: '资料齐全，隐蔽工程质量合格，同意归档。',
      operator: '李工',
      operatorRole: 'SUPERVISOR',
      timestamp: '2024-01-15T16:00:00'
    },
    {
      id: generateId(),
      recordId: records[1].id,
      fromStatus: 'DRAFT',
      toStatus: 'SUBMITTED',
      operator: '张伟',
      operatorRole: 'PROJECT_MANAGER',
      timestamp: '2024-01-16T09:00:00'
    },
    {
      id: generateId(),
      recordId: records[1].id,
      fromStatus: 'SUBMITTED',
      toStatus: 'PENDING_EVIDENCE',
      reason: '缺少关键照片证据，需要补充梁板钢筋验收现场照片后重新提交。',
      operator: '李工',
      operatorRole: 'SUPERVISOR',
      timestamp: '2024-01-16T14:30:00'
    },
    {
      id: generateId(),
      recordId: records[2].id,
      fromStatus: 'DRAFT',
      toStatus: 'SUBMITTED',
      operator: '张伟',
      operatorRole: 'PROJECT_MANAGER',
      timestamp: '2024-01-17T08:30:00'
    },
    {
      id: generateId(),
      recordId: records[2].id,
      fromStatus: 'SUBMITTED',
      toStatus: 'REJECTED',
      reason: '箍筋间距不均匀，部分柱筋偏移超过规范要求，需整改后重新报验。',
      operator: '李工',
      operatorRole: 'SUPERVISOR',
      timestamp: '2024-01-17T11:00:00'
    },
    {
      id: generateId(),
      recordId: records[3].id,
      fromStatus: 'DRAFT',
      toStatus: 'SUBMITTED',
      operator: '张伟',
      operatorRole: 'PROJECT_MANAGER',
      timestamp: '2024-01-18T10:00:00'
    },
    {
      id: generateId(),
      recordId: records[4].id,
      fromStatus: 'DRAFT',
      toStatus: 'SUBMITTED',
      operator: '张伟',
      operatorRole: 'PROJECT_MANAGER',
      timestamp: '2024-01-19T08:00:00'
    },
    {
      id: generateId(),
      recordId: records[4].id,
      fromStatus: 'SUBMITTED',
      toStatus: 'PENDING_EVIDENCE',
      reason: '缺少剪力墙钢筋关键部位照片，请补充后重新提交。',
      operator: '李工',
      operatorRole: 'SUPERVISOR',
      timestamp: '2024-01-19T10:00:00'
    }
  ];

  return { records, history, users: USERS };
}

export function getDefaultUsers(): User[] {
  return USERS;
}
