import { useCurrentMussel } from '@/hooks/useStore'
import { AlertTriangle, Link2, CheckCircle2 } from 'lucide-react'
import styles from './ThinLayerAlert.module.css'

export default function ThinLayerAlert() {
  const mussel = useCurrentMussel()
  const thinPoints = mussel?.points.filter((p) => p.isThin) ?? []

  if (thinPoints.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>薄层区警告</h3>
          <span className={styles.countBadge}>0</span>
        </div>
        <div className={styles.emptyState}>
          <CheckCircle2 size={20} className={styles.emptyIcon} />
          <span className={styles.emptyText}>无薄层区域</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>薄层区警告</h3>
        <span className={styles.countBadgePulse}>{thinPoints.length}</span>
      </div>
      <div className={styles.cardList}>
        {thinPoints.map((point, index) => (
          <div
            key={point.id}
            className={styles.card}
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className={styles.cardHeader}>
              <span className={styles.pointId}>测点 Q{point.quadrant}</span>
              <AlertTriangle size={14} className={styles.warnIcon} />
            </div>
            <div className={styles.cardBody}>
              <div className={styles.thicknessRow}>
                <span className={styles.thicknessLabel}>厚度</span>
                <span className={styles.thicknessValue}>{point.thickness.toFixed(2)}mm</span>
              </div>
              <div className={styles.quadrantRow}>
                <span className={styles.quadrantLabel}>象限</span>
                <span className={styles.quadrantValue}>Q{point.quadrant}</span>
              </div>
              {point.batchId && (
                <div className={styles.batchRow}>
                  <span className={styles.batchBadge}>{point.batchId}</span>
                  <span className={styles.traceLink}>
                    <Link2 size={12} />
                    追溯
                  </span>
                </div>
              )}
              <div className={styles.timestamp}>
                {new Date(point.timestamp).toLocaleString('zh-CN')}
              </div>
              {point.isRechecked && point.recheckedBy && (
                <div className={styles.recheckInfo}>
                  <CheckCircle2 size={14} className={styles.recheckIcon} />
                  <span>
                    复检: {point.recheckedBy}
                    {point.recheckedAt &&
                      ` · ${new Date(point.recheckedAt).toLocaleString('zh-CN')}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
