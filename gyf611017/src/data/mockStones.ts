import { Stone, Inclusion, GIA_Report, ReportFieldMapping } from '@/types';

const DIAMOND_IMAGE_URL = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=round%20brilliant%20cut%20diamond%20top%20view%20magnified%20professional%20jewelry%20photography%20dark%20background%20diamond%20sparkle&image_size=square_hd';

const createGiaReport = (overrides: Partial<GIA_Report> = {}): GIA_Report => ({
  stoneId: '',
  measurements: '6.40 - 6.42 x 3.95 mm',
  caratWeight: '1.00',
  colorGrade: 'D',
  clarityGrade: 'VS1',
  cutGrade: 'Excellent',
  proportions: {
    depth: '61.5%',
    table: '57%',
    crownAngle: '34.5°',
    pavilionAngle: '40.8°',
    crownHeight: '15.0%',
    pavilionDepth: '43.0%',
    starLength: '50%',
    lowerHalf: '75%',
    girdle: 'Medium to Slightly Thick, Faceted',
    culet: 'None',
  },
  clarityCharacteristics: ['Crystal', 'Feather', 'Cloud', 'Needle'],
  finish: {
    polish: 'Excellent',
    symmetry: 'Excellent',
  },
  fluorescence: 'None',
  ...overrides,
});

const createFieldMappings = (): ReportFieldMapping[] => {
  return [
    { id: 'f1', fieldName: '尺寸测量', giaCode: 'MEAS', systemValue: '', giaValue: '6.40 - 6.42 x 3.95 mm', confirmed: false },
    { id: 'f2', fieldName: '克拉重量', giaCode: 'CARAT', systemValue: '', giaValue: '1.00 ct', confirmed: false },
    { id: 'f3', fieldName: '颜色等级', giaCode: 'COLOR', systemValue: '', giaValue: 'D', confirmed: false },
    { id: 'f4', fieldName: '净度等级', giaCode: 'CLARITY', systemValue: '', giaValue: 'VS1', confirmed: false },
    { id: 'f5', fieldName: '切工等级', giaCode: 'CUT', systemValue: '', giaValue: 'Excellent', confirmed: false },
    { id: 'f6', fieldName: '深度百分比', giaCode: 'DEPTH', systemValue: '', giaValue: '61.5%', confirmed: false },
    { id: 'f7', fieldName: '台宽比', giaCode: 'TABLE', systemValue: '', giaValue: '57%', confirmed: false },
    { id: 'f8', fieldName: '冠角', giaCode: 'CROWN', systemValue: '', giaValue: '34.5 deg', confirmed: false },
    { id: 'f9', fieldName: '底角', giaCode: 'PAVILION', systemValue: '', giaValue: '40.8 deg', confirmed: false },
    { id: 'f10', fieldName: '抛光', giaCode: 'POLISH', systemValue: '', giaValue: 'Excellent', confirmed: false },
    { id: 'f11', fieldName: '对称性', giaCode: 'SYMM', systemValue: '', giaValue: 'Excellent', confirmed: false },
    { id: 'f12', fieldName: '荧光反应', giaCode: 'FLUO', systemValue: '', giaValue: 'None', confirmed: false },
    { id: 'f13', fieldName: '腰棱', giaCode: 'GIRDLE', systemValue: '', giaValue: 'Medium to Slightly Thick', confirmed: false },
    { id: 'f14', fieldName: '底尖', giaCode: 'CULET', systemValue: '', giaValue: 'None', confirmed: false },
  ];
};

function generateInclusions(count: number, stoneId: string): Inclusion[] {
  const types: Inclusion['type'][] = ['crystal', 'feather', 'cloud', 'needle', 'cavity', 'chip', 'cleavage', 'grain_center'];
  const colors = ['#DC2626', '#059669', '#64748B', '#2563EB', '#9333EA', '#EA580C', '#DB2777', '#0891B2'];
  const inclusions: Inclusion[] = [];
  
  for (let i = 0; i < count; i++) {
    const typeIdx = Math.floor(Math.random() * types.length);
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.15 + Math.random() * 0.6;
    inclusions.push({
      id: `inc-${stoneId}-${i}`,
      stoneId,
      type: types[typeIdx],
      x: 50 + Math.cos(angle) * radius * 50,
      y: 50 + Math.sin(angle) * radius * 50,
      color: colors[typeIdx],
      createdAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    });
  }
  return inclusions;
}

export const MOCK_STONES: Stone[] = [
  {
    id: 'stone-001',
    certificateNo: 'GIA-2024-647281',
    carat: 1.00,
    color: 'D',
    clarity: 'VS1',
    imageUrl: DIAMOND_IMAGE_URL,
    status: 'in_progress',
    inclusions: generateInclusions(3, 'stone-001'),
    progress: 50,
    requiredInclusionCount: 6,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    report: createGiaReport({ stoneId: 'stone-001', clarityCharacteristics: ['Crystal', 'Feather', 'Cloud', 'Needle', 'Cavity', 'Chip'] }),
    fieldMappings: createFieldMappings(),
    requiredSectors: [0, 2, 3, 5, 6, 7],
  },
  {
    id: 'stone-002',
    certificateNo: 'GIA-2024-647282',
    carat: 1.52,
    color: 'E',
    clarity: 'VVS2',
    imageUrl: DIAMOND_IMAGE_URL,
    status: 'pending',
    inclusions: [],
    progress: 0,
    requiredInclusionCount: 4,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    report: createGiaReport({ stoneId: 'stone-002', caratWeight: '1.52', colorGrade: 'E', clarityGrade: 'VVS2', clarityCharacteristics: ['Crystal', 'Needle', 'Feather', 'Cloud'] }),
    fieldMappings: createFieldMappings(),
    requiredSectors: [1, 3, 5, 7],
  },
  {
    id: 'stone-003',
    certificateNo: 'GIA-2024-647283',
    carat: 0.85,
    color: 'F',
    clarity: 'SI1',
    imageUrl: DIAMOND_IMAGE_URL,
    status: 'submitted',
    inclusions: generateInclusions(5, 'stone-003'),
    progress: 100,
    requiredInclusionCount: 5,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    submittedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    report: createGiaReport({ stoneId: 'stone-003', caratWeight: '0.85', colorGrade: 'F', clarityGrade: 'SI1' }),
    fieldMappings: createFieldMappings().map(f => ({ ...f, confirmed: true, systemValue: f.giaValue })),
    requiredSectors: [0, 2, 4, 6, 7],
  },
  {
    id: 'stone-004',
    certificateNo: 'GIA-2024-647284',
    carat: 2.01,
    color: 'G',
    clarity: 'VS2',
    imageUrl: DIAMOND_IMAGE_URL,
    status: 'in_progress',
    inclusions: generateInclusions(4, 'stone-004'),
    progress: 57,
    requiredInclusionCount: 7,
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    report: createGiaReport({ stoneId: 'stone-004', caratWeight: '2.01', colorGrade: 'G', clarityGrade: 'VS2', clarityCharacteristics: ['Crystal', 'Feather', 'Cloud', 'Needle', 'Cavity', 'Chip', 'Cleavage'] }),
    fieldMappings: createFieldMappings(),
    requiredSectors: [0, 1, 2, 3, 5, 6, 7],
  },
  {
    id: 'stone-005',
    certificateNo: 'GIA-2024-647285',
    carat: 1.20,
    color: 'H',
    clarity: 'IF',
    imageUrl: DIAMOND_IMAGE_URL,
    status: 'erratum_pending',
    inclusions: generateInclusions(2, 'stone-005'),
    progress: 100,
    requiredInclusionCount: 2,
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    submittedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    report: createGiaReport({ stoneId: 'stone-005', caratWeight: '1.20', colorGrade: 'H', clarityGrade: 'IF', clarityCharacteristics: ['Crystal', 'Grain Center'] }),
    fieldMappings: createFieldMappings().map(f => ({ ...f, confirmed: true, systemValue: f.giaValue })),
    requiredSectors: [2, 6],
  },
  {
    id: 'stone-006',
    certificateNo: 'GIA-2024-647286',
    carat: 0.70,
    color: 'D',
    clarity: 'FL',
    imageUrl: DIAMOND_IMAGE_URL,
    status: 'pending',
    inclusions: [],
    progress: 0,
    requiredInclusionCount: 0,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    report: createGiaReport({ stoneId: 'stone-006', caratWeight: '0.70', colorGrade: 'D', clarityGrade: 'FL', clarityCharacteristics: [] }),
    fieldMappings: createFieldMappings(),
    requiredSectors: [],
  },
];

export { createGiaReport, createFieldMappings };
