import type { RebarItem, BadRow, ManualJudgment, ImportBatch } from '@/types'
import { generateId, getNowString, parseRebarSpec, isBadRow } from './specParser'

const PLAN_DATA = [
  { building: '1号楼', component: '三层梁', spec: 'HRB400E Φ20', qty: 120, remark: '三层框架梁主筋' },
  { building: '1号楼', component: '三层梁', spec: 'HRB400E Φ16', qty: 240, remark: '梁腰筋' },
  { building: '1号楼', component: '三层柱', spec: 'HRB400E Φ25', qty: 80, remark: '框架柱主筋' },
  { building: '1号楼', component: '三层板', spec: 'HRB400E Φ12', qty: 500, remark: '楼板底筋' },
  { building: '1号楼', component: '三层板', spec: 'HRB400E Φ10', qty: 360, remark: '板负筋' },
  { building: '2号楼', component: '地下室墙', spec: 'HRB400E Φ14', qty: 320, remark: '剪力墙竖向钢筋' },
  { building: '2号楼', component: '地下室墙', spec: 'HRB400E Φ12', qty: 450, remark: '剪力墙水平筋' },
  { building: '2号楼', component: '基础筏板', spec: 'HRB400E Φ28', qty: 180, remark: '筏板主筋' },
  { building: '2号楼', component: '基础筏板', spec: 'HRB400E Φ22', qty: 260, remark: '筏板构造筋' },
  { building: '3号楼', component: '柱', spec: 'HRB400E Φ32', qty: 48, remark: '转换层柱主筋' },
  { building: '3号楼', component: '梁', spec: 'HRB500E Φ18', qty: 150, remark: '转换层梁主筋' },
  { building: '3号楼', component: '板', spec: 'HPB300 Φ8', qty: 600, remark: '板分布筋' },
  { building: '1号楼', component: '楼梯', spec: 'HRB400E Φ16', qty: 72, remark: '楼梯板配筋' },
  { building: '2号楼', component: '后浇带', spec: 'HRB400E Φ20', qty: 56, remark: '后浇带加强筋' },
  { building: '1号楼', component: '坏行测试', spec: '规格乱写', qty: 100, remark: '坏行样例-规格无法解析' }
]

const ACTUAL_DATA = [
  { building: '1号楼', component: '三层梁', spec: 'HRB400E Φ20', qty: 115, remark: '实际到场 - 少5根' },
  { building: '1号楼', component: '三层梁', spec: 'HRB400E Φ16', qty: 248, remark: '实际到场 - 多8根' },
  { building: '1号楼', component: '三层柱', spec: 'HRB400E Φ25', qty: 80, remark: '实际到场 - 一致' },
  { building: '1号楼', component: '三层板', spec: 'HRB400E Φ12', qty: 485, remark: '实际到场 - 少15根' },
  { building: '1号楼', component: '三层板', spec: 'HRB400 Φ10', qty: 350, remark: '牌号差异：HRB400 vs HRB400E' },
  { building: '2号楼', component: '地下室墙', spec: 'HRB400E Φ14', qty: 320, remark: '实际到场 - 一致' },
  { building: '2号楼', component: '地下室墙', spec: 'HRB400E Φ12', qty: 470, remark: '实际到场 - 多20根' },
  { building: '2号楼', component: '基础筏板', spec: 'HRB400E Φ28', qty: 170, remark: '实际到场 - 少10根，待补' },
  { building: '2号楼', component: '基础筏板', spec: 'HRB400E Φ22', qty: 260, remark: '实际到场 - 一致' },
  { building: '3号楼', component: '柱', spec: 'HRB400E Φ32', qty: 52, remark: '实际到场 - 多4根' },
  { building: '3号楼', component: '梁', spec: 'HRB400E Φ18', qty: 150, remark: '牌号不对：应为HRB500E' },
  { building: '3号楼', component: '板', spec: 'HPB300 Φ8', qty: 620, remark: '实际到场 - 多20根' },
  { building: '1号楼', component: '楼梯', spec: 'HRB400E Φ16', qty: 72, remark: '实际到场 - 一致' },
  { building: '2号楼', component: '后浇带', spec: 'HRB400E Φ20', qty: 56, remark: '实际到场 - 一致' },
  { building: '3号楼', component: '构造柱', spec: 'HRB400E Φ6', qty: 200, remark: '料场多送的材料-无对应下料' }
]

const SAMPLE_JUDGMENTS = [
  { itemKey: '1号楼-三层梁-HRB400E Φ20', decision: 'supply', decisionLabel: '同意补料', reason: '现场急需，已通知料场补送5根', operator: '张工' },
  { itemKey: '2号楼-基础筏板-HRB400E Φ28', decision: 'supply', decisionLabel: '同意补料', reason: '影响进度，必须补送10根', operator: '李工' }
]

export function generateMockPlanBatch(): { batch: ImportBatch; items: RebarItem[]; badRows: BadRow[] } {
  const batchId = 'mock-plan-' + Date.now()
  const items: RebarItem[] = []
  const badRows: BadRow[] = []

  PLAN_DATA.forEach((row, idx) => {
    const { isBad, reason } = isBadRow(row)

    if (isBad) {
      badRows.push({
        id: generateId(),
        batchId,
        type: 'plan',
        lineNumber: idx + 1,
        rawData: JSON.stringify(row),
        reason
      })
      return
    }

    const spec = parseRebarSpec(row.spec)
    items.push({
      id: generateId(),
      batchId,
      building: row.building,
      component: row.component,
      specRaw: row.spec,
      spec,
      plannedQty: row.qty,
      actualQty: 0,
      diffQty: 0,
      unit: '根',
      status: 'pending',
      remark: row.remark,
      source: 'plan',
      lineNumber: idx + 1
    })
  })

  const batch: ImportBatch = {
    id: batchId,
    type: 'plan',
    filename: '下料单样例.csv',
    importTime: getNowString(),
    rowCount: PLAN_DATA.length,
    badRowCount: badRows.length,
    fingerprint: 'mock-plan-fp'
  }

  return { batch, items, badRows }
}

export function generateMockActualBatch(): { batch: ImportBatch; items: RebarItem[]; badRows: BadRow[] } {
  const batchId = 'mock-actual-' + Date.now()
  const items: RebarItem[] = []
  const badRows: BadRow[] = []

  ACTUAL_DATA.forEach((row, idx) => {
    const spec = parseRebarSpec(row.spec)
    const isBad = row.building === 'bad-row-actual'

    if (isBad) {
      badRows.push({
        id: generateId(),
        batchId,
        type: 'actual',
        lineNumber: idx + 1,
        rawData: JSON.stringify(row),
        reason: '无法解析规格'
      })
    } else {
      items.push({
        id: generateId(),
        batchId,
        building: row.building,
        component: row.component,
        specRaw: row.spec,
        spec,
        plannedQty: 0,
        actualQty: row.qty,
        diffQty: 0,
        unit: '根',
        status: 'pending',
        remark: row.remark,
        source: 'actual',
        lineNumber: idx + 1
      })
    }
  })

  const batch: ImportBatch = {
    id: batchId,
    type: 'actual',
    filename: '实收表样例.csv',
    importTime: getNowString(),
    rowCount: ACTUAL_DATA.length,
    badRowCount: badRows.length,
    fingerprint: 'mock-actual-fp'
  }

  return { batch, items, badRows }
}

export function getSampleJudgments(): ManualJudgment[] {
  return SAMPLE_JUDGMENTS.map((j) => ({
    id: generateId(),
    itemId: '',
    decision: j.decision as any,
    decisionLabel: j.decisionLabel,
    reason: j.reason,
    operator: j.operator,
    timestamp: getNowString(),
    originalDiff: -5
  }))
}

export const MOCK_PLAN_CSV = `楼栋,构件,规格,下料数量,单位,备注
1号楼,三层梁,HRB400E Φ20,120,根,三层框架梁主筋
1号楼,三层梁,HRB400E Φ16,240,根,梁腰筋
1号楼,三层柱,HRB400E Φ25,80,根,框架柱主筋
1号楼,三层板,HRB400E Φ12,500,根,楼板底筋
1号楼,三层板,HRB400E Φ10,360,根,板负筋
2号楼,地下室墙,HRB400E Φ14,320,根,剪力墙竖向钢筋
2号楼,地下室墙,HRB400E Φ12,450,根,剪力墙水平筋
2号楼,基础筏板,HRB400E Φ28,180,根,筏板主筋
2号楼,基础筏板,HRB400E Φ22,260,根,筏板构造筋
3号楼,柱,HRB400E Φ32,48,根,转换层柱主筋
3号楼,梁,HRB500E Φ18,150,根,转换层梁主筋
3号楼,板,HPB300 Φ8,600,根,板分布筋
1号楼,楼梯,HRB400E Φ16,72,根,楼梯板配筋
2号楼,后浇带,HRB400E Φ20,56,根,后浇带加强筋
bad-row,坏行测试,规格乱写,100,根,坏行样例
`

export const MOCK_ACTUAL_CSV = `楼栋,构件,规格,实收数量,单位,备注
1号楼,三层梁,HRB400E Φ20,115,根,实际到场 - 少5根
1号楼,三层梁,HRB400E Φ16,248,根,实际到场 - 多8根
1号楼,三层柱,HRB400E Φ25,80,根,实际到场 - 一致
1号楼,三层板,HRB400E Φ12,485,根,实际到场 - 少15根
1号楼,三层板,HRB400 Φ10,350,根,牌号差异：HRB400 vs HRB400E
2号楼,地下室墙,HRB400E Φ14,320,根,实际到场 - 一致
2号楼,地下室墙,HRB400E Φ12,470,根,实际到场 - 多20根
2号楼,基础筏板,HRB400E Φ28,170,根,实际到场 - 少10根，待补
2号楼,基础筏板,HRB400E Φ22,260,根,实际到场 - 一致
3号楼,柱,HRB400E Φ32,52,根,实际到场 - 多4根
3号楼,梁,HRB400E Φ18,150,根,牌号不对：应为HRB500E
3号楼,板,HPB300 Φ8,620,根,实际到场 - 多20根
1号楼,楼梯,HRB400E Φ16,72,根,实际到场 - 一致
2号楼,后浇带,HRB400E Φ20,56,根,实际到场 - 一致
new-item,新增材料,HRB400E Φ6,200,根,料场多送的材料
`
