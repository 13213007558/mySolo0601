import { InclusionTypeConfig, InclusionType } from '@/types';

export const INCLUSION_TYPES: InclusionTypeConfig[] = [
  {
    type: 'crystal',
    name: '晶体包裹物',
    nameEn: 'Crystal',
    color: '#DC2626',
    description: '钻石内部的矿物晶体包裹物',
    icon: 'Gem',
  },
  {
    type: 'feather',
    name: '羽裂纹',
    nameEn: 'Feather',
    color: '#059669',
    description: '内部裂纹呈羽毛状延伸',
    icon: 'Feather',
  },
  {
    type: 'cloud',
    name: '云状物',
    nameEn: 'Cloud',
    color: '#64748B',
    description: '密集点状内含物形成的云雾区域',
    icon: 'Cloud',
  },
  {
    type: 'needle',
    name: '针状物',
    nameEn: 'Needle',
    color: '#2563EB',
    description: '细长针状结晶内含物',
    icon: 'Minus',
  },
  {
    type: 'cavity',
    name: '凹洞',
    nameEn: 'Cavity',
    color: '#9333EA',
    description: '钻石表面开口的空洞',
    icon: 'Circle',
  },
  {
    type: 'chip',
    name: '缺口',
    nameEn: 'Chip',
    color: '#EA580C',
    description: '边缘小范围破损',
    icon: 'Triangle',
  },
  {
    type: 'cleavage',
    name: '解理裂纹',
    nameEn: 'Cleavage',
    color: '#DB2777',
    description: '沿晶面方向的平直裂纹',
    icon: 'Zap',
  },
  {
    type: 'grain_center',
    name: '纹理中心',
    nameEn: 'Grain Center',
    color: '#0891B2',
    description: '晶体生长纹中心聚集',
    icon: 'Target',
  },
];

export const getInclusionConfig = (type: InclusionType): InclusionTypeConfig | undefined => {
  return INCLUSION_TYPES.find(cfg => cfg.type === type);
};

export const SECTOR_NAMES = [
  '顶部', '右上', '右中', '右下', '底部', '左下', '左中', '左上',
];

export const STATUS_LABELS: Record<string, { text: string; class: string }> = {
  pending: { text: '待开始', class: 'bg-slate-600 text-slate-200' },
  in_progress: { text: '进行中', class: 'bg-blue-600 text-white' },
  submitted: { text: '已提交', class: 'bg-emerald-600 text-white' },
  erratum_pending: { text: '勘误待审', class: 'bg-amber-600 text-white' },
  erratum_approved: { text: '勘误已批准', class: 'bg-purple-600 text-white' },
};
