import { FileDown, ShieldCheck, ShieldAlert } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useCurrentMussel } from '@/hooks/useStore'
import { useCurrentOperator } from '@/hooks/useStore'
import { exportCertificate } from '@/mock/data'
import styles from './GradeStatus.module.css'

export default function GradeStatus() {
  const mussel = useCurrentMussel()
  const operator = useCurrentOperator()
  const requiredPoints = useAppStore((s) => s.requiredPoints)
  const requiredQuadrants = useAppStore((s) => s.requiredQuadrants)

  const handleExport = () => {
    if (!mussel || mussel.points.length === 0) return
    const text = exportCertificate(mussel, operator.name)
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `分级证书-${mussel.label}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!mussel) {
    return (
      <div className={styles.container}>
        <div className={styles.placeholder}>请先选择一只蚌</div>
      </div>
    )
  }

  const pointProgress = Math.min(mussel.points.length / requiredPoints, 1)
  const quadrantProgress = Math.min(
    new Set(mussel.points.map((p) => p.quadrant)).size / requiredQuadrants,
    1,
  )

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>分级状态</h3>
        {mussel.grade && (
          <span className={`${styles.gradeBadge} ${styles[`gradeBadge--${mussel.grade}`]}`}>
            {mussel.grade}
          </span>
        )}
      </div>

      <div className={styles.progressSection}>
        <div className={styles.progressRow}>
          <span className={styles.progressLabel}>
            测点数量 {mussel.points.length}/{requiredPoints}
          </span>
          <div className={styles.progressBar}>
            <div
              className={`${styles.progressFill} ${pointProgress >= 1 ? styles.progressFillSuccess : ''}`}
              style={{ width: `${pointProgress * 100}%` }}
            />
          </div>
        </div>
        <div className={styles.progressRow}>
          <span className={styles.progressLabel}>
            象限覆盖 {new Set(mussel.points.map((p) => p.quadrant)).size}/{requiredQuadrants}
          </span>
          <div className={styles.progressBar}>
            <div
              className={`${styles.progressFill} ${quadrantProgress >= 1 ? styles.progressFillSuccess : ''}`}
              style={{ width: `${quadrantProgress * 100}%` }}
            />
          </div>
        </div>
      </div>

      {!mussel.canGrade && mussel.gradeReason && (
        <div className={styles.blockMessage}>
          <ShieldAlert size={16} className={styles.blockIcon} />
          <span>{mussel.gradeReason}</span>
        </div>
      )}

      {mussel.canGrade && mussel.grade && (
        <div className={styles.gradeInfo}>
          <ShieldCheck size={16} className={styles.gradeInfoIcon} />
          <span>可分级 — 等级 {mussel.grade}</span>
        </div>
      )}

      <button
        className={`${styles.exportBtn} ${!mussel.canGrade ? styles.exportBtnDisabled : ''}`}
        onClick={handleExport}
        disabled={!mussel.canGrade}
      >
        <FileDown size={16} />
        导出分级证书草稿
      </button>
    </div>
  )
}
