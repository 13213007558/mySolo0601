import dayjs from 'dayjs';
import type { CarbonLedger, EmissionFactorNote, OperationHistory } from '@/types';

const buildings = ['A座写字楼', 'B座科研楼', 'C座商业中心', 'D座公寓楼', 'E座综合楼'];

const handlers = ['张三', '李四', '王五', '赵六', '韩工'];

const withdrawReasons = [
  '数据异常',
  '仪表故障',
  '抄表错误',
  '排放因子变更',
  '重复录入',
  '待核实',
  '韩工补录修正',
];

function generatePlainTip(reason: string): string {
  const map: Record<string, string> = {
    '数据异常': '该记录数据超出正常波动范围，已撤回等待核实',
    '仪表故障': '计量仪表出现故障，读数不准确，已撤回',
    '抄表错误': '人工抄录时出现错误，已撤回更正',
    '排放因子变更': '排放因子更新，重新计算排放量',
    '重复录入': '该记录重复录入，已撤回删除',
    '待核实': '数据存在疑问，待进一步核实后确认',
    '韩工补录修正': '韩工手工补录排放因子后修正的记录',
  };
  return map[reason] || '该记录已被撤回，请联系处理人了解详情';
}

export const mockEmissionFactorNote: EmissionFactorNote = {
  id: 'efn-001',
  factorName: '电网电力排放因子',
  oldValue: 0.5810,
  newValue: 0.6101,
  operator: '韩工',
  reason:
    '根据最新《省级电网排放因子2024版》，华东区域电网排放因子从0.5810 tCO2/kWh更新为0.6101 tCO2/kWh。本次补录涉及2024年6月至12月所有台账记录，已同步更新各楼宇碳排放量计算结果。',
  entryTime: dayjs('2025-01-15 14:30:00').format('YYYY-MM-DD HH:mm:ss'),
  source: '国家发改委气候司《2024年度省级电网排放因子清单》',
};

export function generateMockLedgers(count: number = 20): CarbonLedger[] {
  const ledgers: CarbonLedger[] = [];
  const baseDate = dayjs('2024-06-01');

  for (let i = 0; i < count; i++) {
    const date = baseDate.add(i, 'day');
    const building = buildings[i % buildings.length];
    const electricity = Math.round(2000 + Math.random() * 3000);
    const gas = Math.round(100 + Math.random() * 200);
    const isManualEntry = i === 3 || i === 7 || i === 12;
    const isWithdrawn = i === 1 || i === 4 || i === 8;
    const isPending = i === 2 || i === 6;

    const oldFactor = 0.581;
    const newFactor = 0.6101;
    const useNewFactor = isManualEntry || i > 10;
    const emissionFactor = useNewFactor ? '0.6101' : '0.5810';
    const originalEmission = Math.round(electricity * oldFactor * 100) / 100;
    const carbonEmission = Math.round(electricity * (useNewFactor ? newFactor : oldFactor) * 100) / 100;

    const withdrawReason = isWithdrawn ? withdrawReasons[i % withdrawReasons.length] : '';
    const handler = isManualEntry ? '韩工' : handlers[i % handlers.length];

    ledgers.push({
      id: `ledger-${String(i + 1).padStart(3, '0')}`,
      date: date.format('YYYY-MM-DD'),
      building,
      electricity,
      gas,
      carbonEmission,
      emissionFactor,
      status: isWithdrawn ? 'withdrawn' : isPending ? 'pending' : 'normal',
      withdrawReason,
      handler,
      plainTip: isWithdrawn ? generatePlainTip(withdrawReason) : '',
      selected: false,
      isManualEntry,
      originalCarbonEmission: isManualEntry ? originalEmission : carbonEmission,
      originalEmissionFactor: isManualEntry ? '0.5810' : emissionFactor,
      manualEntryNote: isManualEntry
        ? `韩工于2025-01-15手工补录，排放因子从0.5810更新为0.6101，碳排放量调整${originalEmission} → ${carbonEmission} tCO2`
        : '',
      createdAt: date.format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: isManualEntry
        ? dayjs('2025-01-15 14:30:00').format('YYYY-MM-DD HH:mm:ss')
        : date.format('YYYY-MM-DD HH:mm:ss'),
    });
  }

  return ledgers;
}

export const mockOperationHistories: OperationHistory[] = [
  {
    id: 'oh-001',
    operationType: 'batch_withdraw',
    affectedIds: ['ledger-002', 'ledger-005', 'ledger-009'],
    operator: '张三',
    operationTime: dayjs('2025-01-10 09:30:00').format('YYYY-MM-DD HH:mm:ss'),
    reason: '数据异常，仪表读数超出正常范围',
    originalValues: {
      'ledger-002': { status: 'normal', withdrawReason: '' },
      'ledger-005': { status: 'normal', withdrawReason: '' },
      'ledger-009': { status: 'normal', withdrawReason: '' },
    },
    newValues: {
      'ledger-002': { status: 'withdrawn', withdrawReason: '数据异常' },
      'ledger-005': { status: 'withdrawn', withdrawReason: '数据异常' },
      'ledger-009': { status: 'withdrawn', withdrawReason: '数据异常' },
    },
    canRollback: false,
  },
  {
    id: 'oh-002',
    operationType: 'batch_modify',
    affectedIds: ['ledger-004', 'ledger-008', 'ledger-013'],
    operator: '韩工',
    operationTime: dayjs('2025-01-15 14:30:00').format('YYYY-MM-DD HH:mm:ss'),
    reason: '排放因子更新，手工补录修正',
    originalValues: {
      'ledger-004': {
        carbonEmission: 1684.9,
        emissionFactor: '0.5810',
        isManualEntry: false,
      },
      'ledger-008': {
        carbonEmission: 2033.5,
        emissionFactor: '0.5810',
        isManualEntry: false,
      },
      'ledger-013': {
        carbonEmission: 2324.0,
        emissionFactor: '0.5810',
        isManualEntry: false,
      },
    },
    newValues: {
      'ledger-004': {
        carbonEmission: 1769.1,
        emissionFactor: '0.6101',
        isManualEntry: true,
      },
      'ledger-008': {
        carbonEmission: 2135.4,
        emissionFactor: '0.6101',
        isManualEntry: true,
      },
      'ledger-013': {
        carbonEmission: 2440.4,
        emissionFactor: '0.6101',
        isManualEntry: true,
      },
    },
    canRollback: false,
  },
  {
    id: 'oh-003',
    operationType: 'single_edit',
    affectedIds: ['ledger-006'],
    operator: '李四',
    operationTime: dayjs('2025-01-18 16:45:00').format('YYYY-MM-DD HH:mm:ss'),
    reason: '撤回原因更新',
    originalValues: {
      'ledger-006': { withdrawReason: '待核实', plainTip: '数据存在疑问，待进一步核实后确认' },
    },
    newValues: {
      'ledger-006': { withdrawReason: '抄表错误', plainTip: '人工抄录时出现错误，已撤回更正' },
    },
    canRollback: false,
  },
];
