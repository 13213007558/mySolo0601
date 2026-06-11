import { useState, type FormEvent } from 'react'
import { AlertCircle, CheckCircle2, Clock, UserCheck } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useCurrentOrders, useCurrentOperator } from '@/hooks/useStore'
import { OPERATORS } from '@/mock/data'
import styles from './ReInspectionPanel.module.css'

export default function ReInspectionPanel() {
  const orders = useCurrentOrders()
  const currentOp = useCurrentOperator()
  const completeReInspection = useAppStore((s) => s.completeReInspection)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [recheckValue, setRecheckValue] = useState('')
  const [selectedOp, setSelectedOp] = useState('')

  const pendingOrders = orders.filter((o) => o.status === 'pending')
  const completedOrders = orders.filter((o) => o.status === 'completed')
  const differentShiftOps = OPERATORS.filter((op) => op.shift !== currentOp.shift)

  const handleStartComplete = (orderId: string, originalValue: number) => {
    setCompletingId(orderId)
    setRecheckValue(originalValue.toFixed(2))
    setSelectedOp(differentShiftOps[0]?.id ?? '')
  }

  const handleComplete = (e: FormEvent) => {
    e.preventDefault()
    if (!completingId || !selectedOp) return
    const val = parseFloat(recheckValue)
    if (isNaN(val) || val <= 0) return
    completeReInspection(completingId, val, selectedOp)
    setCompletingId(null)
    setRecheckValue('')
    setSelectedOp('')
  }

  const handleCancel = () => {
    setCompletingId(null)
    setRecheckValue('')
    setSelectedOp('')
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>复检工单</h3>
        {pendingOrders.length > 0 && (
          <span className={styles.pendingBadge}>{pendingOrders.length} 待检</span>
        )}
      </div>

      {orders.length === 0 && (
        <div className={styles.empty}>
          <CheckCircle2 size={20} className={styles.emptyIcon} />
          <span className={styles.emptyText}>无复检工单</span>
        </div>
      )}

      <div className={styles.orderList}>
        {pendingOrders.map((order) => (
          <div key={order.id} className={`${styles.orderCard} ${styles.orderCardPending}`}>
            <div className={styles.orderHeader}>
              <span className={styles.orderId}>{order.id}</span>
              <span className={styles.pendingTag}>
                <Clock size={12} /> 待检
              </span>
            </div>
            <div className={styles.orderBody}>
              <p className={styles.orderReason}>{order.reason}</p>
              <div className={styles.orderMeta}>
                <span>原始值: {order.originalValue.toFixed(2)}mm</span>
                <span>操作员: {order.originalOperator}</span>
              </div>
              <div className={styles.orderMeta}>
                <span>{new Date(order.createdAt).toLocaleString('zh-CN')}</span>
              </div>
            </div>
            {completingId === order.id ? (
              <form className={styles.completeForm} onSubmit={handleComplete}>
                <div className={styles.formRow}>
                  <label className={styles.formLabel}>复检厚度 (mm)</label>
                  <input
                    className={styles.formInput}
                    type="number"
                    step="0.01"
                    min="0"
                    value={recheckValue}
                    onChange={(e) => setRecheckValue(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className={styles.formRow}>
                  <label className={styles.formLabel}>复检人员 (须换班)</label>
                  <select
                    className={styles.formSelect}
                    value={selectedOp}
                    onChange={(e) => setSelectedOp(e.target.value)}
                  >
                    {differentShiftOps.map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.name} (班次{op.shift})
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formActions}>
                  <button type="button" className={styles.cancelBtn} onClick={handleCancel}>
                    取消
                  </button>
                  <button type="submit" className={styles.confirmBtn}>
                    <UserCheck size={14} /> 确认复检
                  </button>
                </div>
              </form>
            ) : (
              <button
                className={styles.startBtn}
                onClick={() => handleStartComplete(order.id, order.originalValue)}
              >
                <AlertCircle size={14} /> 执行复检
              </button>
            )}
          </div>
        ))}

        {completedOrders.map((order) => (
          <div key={order.id} className={`${styles.orderCard} ${styles.orderCardDone}`}>
            <div className={styles.orderHeader}>
              <span className={styles.orderId}>{order.id}</span>
              <span className={styles.doneTag}>
                <CheckCircle2 size={12} /> 已完成
              </span>
            </div>
            <div className={styles.orderBody}>
              <p className={styles.orderReason}>{order.reason}</p>
              <div className={styles.orderMeta}>
                <span>原始: {order.originalValue.toFixed(2)}mm</span>
                <span>复检: {order.recheckValue?.toFixed(2)}mm</span>
              </div>
              <div className={styles.orderMeta}>
                <span>复检员: {order.recheckOperator}</span>
                {order.completedAt && (
                  <span>{new Date(order.completedAt).toLocaleString('zh-CN')}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
