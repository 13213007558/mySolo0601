import HistoryChart from '@/components/HistoryChart/HistoryChart'
import styles from './History.module.css'

export default function History() {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h2 className={styles.title}>同池历史厚度对比</h2>
          <p className={styles.desc}>
            对比当前蚌与同养殖池历史样本的厚度趋势，辅助分级决策
          </p>
        </div>
        <div className={styles.chartArea}>
          <HistoryChart />
        </div>
      </div>
    </div>
  )
}
