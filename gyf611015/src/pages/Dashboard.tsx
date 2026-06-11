import { useState } from 'react'
import { Plus, Fish } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useCurrentOperator } from '@/hooks/useStore'
import { NUCLEUS_BATCHES } from '@/mock/data'
import MusselDiagram from '@/components/MusselDiagram/MusselDiagram'
import ThicknessGauge from '@/components/ThicknessGauge/ThicknessGauge'
import ThicknessHistogram from '@/components/ThicknessHistogram/ThicknessHistogram'
import ThinLayerAlert from '@/components/ThinLayerAlert/ThinLayerAlert'
import GradeStatus from '@/components/GradeStatus/GradeStatus'
import ReInspectionPanel from '@/components/ReInspectionPanel/ReInspectionPanel'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const mussels = useAppStore((s) => s.mussels)
  const currentMusselId = useAppStore((s) => s.currentMusselId)
  const selectMussel = useAppStore((s) => s.selectMussel)
  const addMussel = useAppStore((s) => s.addMussel)
  const currentOperator = useCurrentOperator()

  const [showNewForm, setShowNewForm] = useState(false)
  const [newPoolId, setNewPoolId] = useState('P-01')
  const [newBatchId, setNewBatchId] = useState(NUCLEUS_BATCHES[0].id)

  const handleAdd = () => {
    addMussel(newPoolId, newBatchId)
    setShowNewForm(false)
    setNewPoolId('P-01')
    setNewBatchId(NUCLEUS_BATCHES[0].id)
  }

  return (
    <div className={styles.page}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>
            <Fish size={18} /> 蚌列表
          </h2>
          <button className={styles.addBtn} onClick={() => setShowNewForm(!showNewForm)}>
            <Plus size={16} />
          </button>
        </div>

        {showNewForm && (
          <div className={styles.newForm}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>养殖池</label>
              <select
                className={styles.formSelect}
                value={newPoolId}
                onChange={(e) => setNewPoolId(e.target.value)}
              >
                <option value="P-01">P-01</option>
                <option value="P-02">P-02</option>
                <option value="P-03">P-03</option>
              </select>
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>核珠批次</label>
              <select
                className={styles.formSelect}
                value={newBatchId}
                onChange={(e) => setNewBatchId(e.target.value)}
              >
                {NUCLEUS_BATCHES.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
            <button className={styles.formAddBtn} onClick={handleAdd}>
              确认添加
            </button>
          </div>
        )}

        <div className={styles.musselList}>
          {mussels.length === 0 && (
            <div className={styles.emptyList}>暂无蚌记录，点击 + 添加</div>
          )}
          {mussels.map((m) => (
            <button
              key={m.id}
              className={`${styles.musselItem} ${m.id === currentMusselId ? styles.musselItemActive : ''}`}
              onClick={() => selectMussel(m.id)}
            >
              <div className={styles.musselItemHeader}>
                <span className={styles.musselLabel}>{m.label}</span>
                {m.grade && (
                  <span className={`${styles.musselGrade} ${styles[`musselGrade--${m.grade}`]}`}>
                    {m.grade}
                  </span>
                )}
              </div>
              <div className={styles.musselItemMeta}>
                <span>{m.poolId}</span>
                <span>{m.points.length}点</span>
                <span>班次{currentOperator.shift}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.main}>
        <div className={styles.topRow}>
          <div className={styles.diagramCol}>
            <MusselDiagram />
          </div>
          <div className={styles.rightCol}>
            <ThicknessGauge />
            <GradeStatus />
          </div>
        </div>
        <div className={styles.bottomRow}>
          <div className={styles.histCol}>
            <ThicknessHistogram />
          </div>
          <div className={styles.thinCol}>
            <ThinLayerAlert />
          </div>
          <div className={styles.reinspectCol}>
            <ReInspectionPanel />
          </div>
        </div>
      </div>
    </div>
  )
}
