import type { RoofShadowRecord, AerialAnnotation, ThresholdConfig } from '@/types';

export const DEFAULT_THRESHOLD: ThresholdConfig = {
  warningShadowHours: 4,
  dangerShadowHours: 6,
  warningEfficiency: 65,
  dangerEfficiency: 45,
};

const buildings = [
  '研发中心A座', '研发中心B座', '生产厂房1号', '生产厂房2号',
  '办公楼东区', '办公楼西区', '仓储中心', '能源站',
  '员工宿舍1号楼', '员工宿舍2号楼', '食堂综合楼', '活动中心'
];

const generateId = () => Math.random().toString(36).substring(2, 11);

const getStatus = (shadowHours: number, efficiency: number): 'normal' | 'warning' | 'danger' => {
  if (shadowHours >= DEFAULT_THRESHOLD.dangerShadowHours || efficiency <= DEFAULT_THRESHOLD.dangerEfficiency) {
    return 'danger';
  }
  if (shadowHours >= DEFAULT_THRESHOLD.warningShadowHours || efficiency <= DEFAULT_THRESHOLD.warningEfficiency) {
    return 'warning';
  }
  return 'normal';
};

export const generateMockRecords = (): RoofShadowRecord[] => {
  const records: RoofShadowRecord[] = [];
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - (29 - i));
    const dateStr = date.toISOString().split('T')[0];
    
    buildings.forEach((building, idx) => {
      const baseShadow = Math.random() * 8;
      const baseEfficiency = 90 - baseShadow * 6;
      const shadowHours = Math.round(baseShadow * 10) / 10;
      const powerEfficiency = Math.round(baseEfficiency * 10) / 10;
      const status = getStatus(shadowHours, powerEfficiency);
      
      records.push({
        id: generateId(),
        roofId: `RF-${String(idx + 1).padStart(3, '0')}`,
        buildingName: building,
        recordDate: dateStr,
        shadowHours,
        originalShadowHours: shadowHours,
        powerEfficiency,
        originalPowerEfficiency: powerEfficiency,
        status,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: status !== 'normal' ? '需要关注' : undefined,
      });
    });
  }
  
  return records;
};

export const generateMockAnnotation = (): AerialAnnotation => {
  return {
    id: generateId(),
    roofId: 'RF-001',
    recordedBy: '阿敏',
    recordedAt: new Date().toISOString(),
    estimatedShadowImpact: 15.5,
    notes: '6月9日航拍补录，东北角新增冷却塔遮挡',
    shapes: [
      {
        id: generateId(),
        type: 'rect',
        x: 120,
        y: 80,
        width: 90,
        height: 70,
        color: '#ef4444',
        label: '冷却塔遮挡',
        shadowHours: 2.5,
      },
      {
        id: generateId(),
        type: 'rect',
        x: 280,
        y: 150,
        width: 60,
        height: 80,
        color: '#f59e0b',
        label: '管道支架',
        shadowHours: 1.2,
      },
      {
        id: generateId(),
        type: 'rect',
        x: 400,
        y: 60,
        width: 75,
        height: 55,
        color: '#10b981',
        label: '检修设备',
        shadowHours: 0.8,
      },
    ],
  };
};

export const generateId = generateId;
