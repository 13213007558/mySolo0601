import { useRef, useEffect, useCallback } from 'react'
import { useCurrentMussel } from '@/hooks/useStore'
import { POOL_HISTORY } from '@/mock/data'
import styles from './HistoryChart.module.css'

export default function HistoryChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mussel = useCurrentMussel()

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    const W = rect.width
    const H = rect.height

    ctx.clearRect(0, 0, W, H)

    const padL = 48
    const padR = 20
    const padT = 20
    const padB = 40
    const chartW = W - padL - padR
    const chartH = H - padT - padB

    const history = mussel ? POOL_HISTORY[mussel.poolId] ?? [] : []
    const currentPoints = mussel?.points ?? []
    const currentAvg = currentPoints.length > 0
      ? currentPoints.reduce((s, p) => s + p.thickness, 0) / currentPoints.length
      : null

    if (history.length === 0 && currentAvg === null) {
      ctx.fillStyle = '#8B95A5'
      ctx.font = '13px "Noto Sans SC", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('选择蚌后显示同池历史对比', W / 2, H / 2)
      return
    }

    const allAvgs = history.map((h) => h.avgThickness)
    const allMins = history.map((h) => h.minThickness)
    const allMaxs = history.map((h) => h.maxThickness)
    if (currentAvg !== null) allAvgs.push(currentAvg)
    const dataMin = Math.min(...allMins, ...(currentAvg !== null ? [currentAvg] : [])) * 0.85
    const dataMax = Math.max(...allMaxs, ...(currentAvg !== null ? [currentAvg] : [])) * 1.1
    const range = dataMax - dataMin || 1

    const yScale = (v: number) => padT + chartH - ((v - dataMin) / range) * chartH

    ctx.fillStyle = '#8B95A5'
    ctx.font = '10px "JetBrains Mono", monospace'
    ctx.textAlign = 'right'
    for (let i = 0; i <= 4; i++) {
      const val = dataMin + (range * i) / 4
      const y = yScale(val)
      ctx.fillText(val.toFixed(1), padL - 6, y + 3)
      ctx.strokeStyle = '#E8E5DE'
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(padL, y)
      ctx.lineTo(padL + chartW, y)
      ctx.stroke()
    }

    if (history.length > 0) {
      const histLen = history.length
      const xStep = chartW / (histLen - 1 || 1)
      const xOfIdx = (i: number) => padL + i * xStep

      const grad = ctx.createLinearGradient(0, padT, 0, padT + chartH)
      grad.addColorStop(0, 'rgba(69, 123, 157, 0.15)')
      grad.addColorStop(1, 'rgba(69, 123, 157, 0.02)')

      ctx.beginPath()
      ctx.moveTo(xOfIdx(0), yScale(history[0].avgThickness))
      for (let i = 1; i < histLen; i++) {
        ctx.lineTo(xOfIdx(i), yScale(history[i].avgThickness))
      }
      ctx.lineTo(xOfIdx(histLen - 1), padT + chartH)
      ctx.lineTo(xOfIdx(0), padT + chartH)
      ctx.closePath()
      ctx.fillStyle = grad
      ctx.fill()

      ctx.strokeStyle = '#457B9D'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(xOfIdx(0), yScale(history[0].avgThickness))
      for (let i = 1; i < histLen; i++) {
        ctx.lineTo(xOfIdx(i), yScale(history[i].avgThickness))
      }
      ctx.stroke()

      history.forEach((h, i) => {
        ctx.fillStyle = '#457B9D'
        ctx.beginPath()
        ctx.arc(xOfIdx(i), yScale(h.avgThickness), 4, 0, Math.PI * 2)
        ctx.fill()
      })

      ctx.fillStyle = '#8B95A5'
      ctx.font = '10px "JetBrains Mono", monospace'
      ctx.textAlign = 'center'
      history.forEach((h, i) => {
        ctx.fillText(h.date, xOfIdx(i), padT + chartH + 16)
      })
    }

    if (currentAvg !== null) {
      const curX = padL + chartW
      ctx.strokeStyle = '#E63946'
      ctx.lineWidth = 2
      ctx.setLineDash([6, 3])
      ctx.beginPath()
      ctx.moveTo(padL, yScale(currentAvg))
      ctx.lineTo(curX, yScale(currentAvg))
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = '#E63946'
      ctx.beginPath()
      ctx.arc(curX, yScale(currentAvg), 5, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#E63946'
      ctx.font = '11px "Noto Sans SC", sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(`当前 ${currentAvg.toFixed(2)}mm`, curX - 12, yScale(currentAvg) - 8)
    }

    ctx.fillStyle = '#8B95A5'
    ctx.font = '10px "Noto Sans SC", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('厚度 (mm)', padL + chartW / 2, padT + chartH + 34)
  }, [mussel])

  useEffect(() => {
    draw()
    window.addEventListener('resize', draw)
    return () => window.removeEventListener('resize', draw)
  }, [draw])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>同池历史厚度对比</h3>
        {mussel && <span className={styles.poolTag}>养殖池 {mussel.poolId}</span>}
      </div>
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={`${styles.legendLine} ${styles.legendLineHist}`} />
          历史平均
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendLine} ${styles.legendLineCur}`} />
          当前蚌
        </span>
      </div>
    </div>
  )
}
