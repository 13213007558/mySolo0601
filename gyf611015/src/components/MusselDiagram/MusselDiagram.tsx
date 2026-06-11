import { useState, useCallback, type FormEvent } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useCurrentMussel } from '@/hooks/useStore'
import styles from './MusselDiagram.module.css'

export default function MusselDiagram() {
  const mussel = useCurrentMussel()
  const addPoint = useAppStore((s) => s.addPoint)
  const editingPointId = useAppStore((s) => s.editingPointId)
  const setEditingPoint = useAppStore((s) => s.setEditingPoint)
  const updatePoint = useAppStore((s) => s.updatePoint)
  const thinThreshold = useAppStore((s) => s.thinThreshold)

  const [dialogState, setDialogState] = useState<{
    x: number
    y: number
    mode: 'add' | 'edit'
    pointId?: string
  } | null>(null)
  const [inputValue, setInputValue] = useState('')

  const handleShellClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!mussel) return
      const svg = e.currentTarget
      const rect = svg.getBoundingClientRect()
      const scaleX = 500 / rect.width
      const scaleY = 400 / rect.height
      const x = (e.clientX - rect.left) * scaleX
      const y = (e.clientY - rect.top) * scaleY

      const dx = (x - 250) / 200
      const dy = (y - 200) / 160
      if (dx * dx + dy * dy > 1) return

      setDialogState({ x, y, mode: 'add' })
      setInputValue('')
    },
    [mussel],
  )

  const handlePointClick = useCallback(
    (e: React.MouseEvent, pointId: string) => {
      e.stopPropagation()
      if (!mussel) return
      const point = mussel.points.find((p) => p.id === pointId)
      if (!point) return

      setEditingPoint(pointId)
      setDialogState({ x: point.x, y: point.y, mode: 'edit', pointId })
      setInputValue(point.thickness.toFixed(2))
    },
    [mussel, setEditingPoint],
  )

  const handleConfirm = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      const value = parseFloat(inputValue)
      if (isNaN(value) || value <= 0) return

      if (dialogState?.mode === 'add') {
        addPoint(dialogState.x, dialogState.y, value)
      } else if (dialogState?.mode === 'edit' && dialogState.pointId) {
        updatePoint(dialogState.pointId, value)
        setEditingPoint(null)
      }

      setDialogState(null)
      setInputValue('')
    },
    [dialogState, inputValue, addPoint, updatePoint, setEditingPoint],
  )

  const handleCancel = useCallback(() => {
    if (dialogState?.mode === 'edit') {
      setEditingPoint(null)
    }
    setDialogState(null)
    setInputValue('')
  }, [dialogState, setEditingPoint])

  if (!mussel) {
    return (
      <div className={styles.container}>
        <div className={styles.placeholder}>请先选择一只蚌</div>
      </div>
    )
  }

  const threshold = thinThreshold

  return (
    <div className={styles.container}>
      <svg
        className={styles.shellSvg}
        viewBox="0 0 500 400"
        onClick={handleShellClick}
      >
        <defs>
          <radialGradient id="shellGradient" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#F8F6F0" />
            <stop offset="100%" stopColor="#F1DDBF" />
          </radialGradient>
        </defs>

        <ellipse
          className={styles.shellFill}
          cx={250}
          cy={200}
          rx={200}
          ry={160}
        />

        <line
          className={styles.quadrantLine}
          x1={50}
          y1={200}
          x2={450}
          y2={200}
        />
        <line
          className={styles.quadrantLine}
          x1={250}
          y1={40}
          x2={250}
          y2={360}
        />

        {mussel.points.map((point) => {
          const isThin = point.thickness < threshold
          const isEditing = point.id === editingPointId
          const label = `${point.thickness.toFixed(2)}`
          const labelW = label.length * 6.5 + 8
          const labelH = 14
          const labelY = point.y - 18

          return (
            <g
              key={point.id}
              className={styles.pointGroup}
              onClick={(e) => handlePointClick(e, point.id)}
            >
              <circle
                cx={point.x}
                cy={point.y}
                r={7}
                className={`${styles.pointCircle} ${isThin ? styles.pointCircleThin : styles.pointCircleNormal} ${isEditing ? styles.pointCircleEditing : ''} ${isThin && !isEditing ? styles.thinPulse : ''}`}
              />
              <rect
                x={point.x - labelW / 2}
                y={labelY - labelH / 2}
                width={labelW}
                height={labelH}
                className={styles.pointLabelBg}
              />
              <text
                x={point.x}
                y={labelY + 4}
                className={styles.pointLabel}
              >
                {label}
              </text>
            </g>
          )
        })}
      </svg>

      {dialogState && (
        <div className={styles.dialogOverlay}>
          <form className={styles.dialogCard} onSubmit={handleConfirm}>
            <h3 className={styles.dialogTitle}>
              {dialogState.mode === 'add' ? '添加测量点' : '编辑厚度值'}
            </h3>
            <div className={styles.dialogInputRow}>
              <input
                className={styles.dialogInput}
                type="number"
                step="0.01"
                min="0"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                autoFocus
              />
              <span className={styles.dialogUnit}>mm</span>
            </div>
            <div className={styles.dialogActions}>
              <button
                type="button"
                className={`${styles.dialogBtn} ${styles.dialogBtnCancel}`}
                onClick={handleCancel}
              >
                取消
              </button>
              <button
                type="submit"
                className={`${styles.dialogBtn} ${styles.dialogBtnConfirm}`}
              >
                确认
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
