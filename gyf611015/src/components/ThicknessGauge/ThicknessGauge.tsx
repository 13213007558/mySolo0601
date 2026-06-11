import { useCurrentStats } from '@/hooks/useStore'
import styles from './ThicknessGauge.module.css'

export default function ThicknessGauge() {
  const stats = useCurrentStats()

  const statCards = [
    { key: 'avg', label: '平均厚度', value: stats.avg, accent: 'avg' as const },
    { key: 'min', label: '最小厚度', value: stats.min, accent: 'min' as const },
    { key: 'max', label: '最大厚度', value: stats.max, accent: 'max' as const },
    { key: 'stdDev', label: '标准差', value: stats.stdDev, accent: 'stdDev' as const },
  ]

  return (
    <div className={styles.panel}>
      <div className={styles.grid}>
        {statCards.map((card) => (
          <div key={card.key} className={`${styles.card} ${styles[`card--${card.accent}`]}`}>
            <span className={styles.card__label}>{card.label}</span>
            <span className={styles.card__value}>{card.value.toFixed(2)}</span>
            <span className={styles.card__unit}>mm</span>
          </div>
        ))}
      </div>
      <div className={styles.extraRow}>
        <div className={styles.extraItem}>
          <span className={styles.extraLabel}>测点总数</span>
          <span className={styles.extraValue}>{stats.count}</span>
        </div>
        <div className={`${styles.extraItem} ${styles.extraItemDanger}`}>
          <span className={styles.extraLabel}>薄层点数</span>
          <span className={styles.extraValue}>{stats.thinCount}</span>
        </div>
        <div className={styles.extraItem}>
          <span className={styles.extraLabel}>象限覆盖</span>
          <span className={styles.extraValue}>{stats.coveredQuadrants.length}/4</span>
        </div>
      </div>
    </div>
  )
}
