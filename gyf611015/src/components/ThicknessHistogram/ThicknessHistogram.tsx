import { useRef, useEffect, useCallback } from 'react'
import { useCurrentStats, useCurrentMussel } from '@/hooks/useStore'
import { useAppStore } from '@/store/useAppStore'
import styles from './ThicknessHistogram.module.css'

const BINS = 12
const RANGE_MIN = 0.4
const RANGE_MAX = 3.2

export default function ThicknessHistogram() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stats = useCurrentStats()
  const mussel = useCurrentMussel()
  const thinThreshold = useAppStore((s) => s.thinThreshold)

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

    const padL = 44
    const padR = 16
    const padT = 20
    const padB = 36
    const chartW = W - padL - padR
    const chartH = H - padT - padB

    const points = mussel?.points ?? []
    if (points.length === 0) {
      ctx.fillStyle = '#8B95A5'
      ctx.font = '13px "Noto Sans SC", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('添加测量点后显示直方图', W / 2, H / 2)
      return
    }

    const binWidth = (RANGE_MAX - RANGE_MIN) / BINS
    const bins: number[] = new Array(BINS).fill(0)
    points.forEach((p) => {
      const idx = Math.floor((p.thickness - RANGE_MIN) / binWidth)
      if (idx >= 0 && idx < BINS) bins[idx]++
    })
    const maxBin = Math.max(...bins, 1)

    ctx.fillStyle = '#8B95A5'
    ctx.font = '10px "JetBrains Mono", monospace'
    ctx.textAlign = 'right'
    for (let i = 0; i <= 4; i++) {
      const y = padT + chartH - (i / 4) * chartH
      ctx.fillText(String(Math.round((maxBin * i) / 4)), padL - 6, y + 3)
      ctx.strokeStyle = '#E8E5DE'
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(padL, y)
      ctx.lineTo(padL + chartW, y)
      ctx.stroke()
    }

    const barGap = 2
    const barW = (chartW - barGap * (BINS - 1)) / BINS

    bins.forEach((count, i) => {
      const x = padL + i * (barW + barGap)
      const barH = (count / maxBin) * chartH
      const y = padT + chartH - barH
      const binCenter = RANGE_MIN + (i + 0.5) * binWidth

      if (binCenter < thinThreshold) {
        ctx.fillStyle = 'rgba(230, 57, 70, 0.7)'
      } else if (binCenter < 1.5) {
        ctx.fillStyle = 'rgba(212, 168, 67, 0.6)'
      } else if (binCenter < 2.0) {
        ctx.fillStyle = 'rgba(69, 123, 157, 0.6)'
      } else {
        ctx.fillStyle = 'rgba(45, 147, 108, 0.6)'
      }

      ctx.beginPath()
      const r = Math.min(3, barW / 2)
      ctx.moveTo(x, padT + chartH)
      ctx.lineTo(x, y + r)
      ctx.quadraticCurveTo(x, y, x + r, y)
      ctx.lineTo(x + barW - r, y)
      ctx.quadraticCurveTo(x + barW, y, x + barW, y + r)
      ctx.lineTo(x + barW, padT + chartH)
      ctx.closePath()
      ctx.fill()

      if (count > 0) {
        ctx.fillStyle = '#1A1A2E'
        ctx.font = '10px "JetBrains Mono", monospace'
        ctx.textAlign = 'center'
        ctx.fillText(String(count), x + barW / 2, y - 4)
      }
    })

    const threshX = padL + ((thinThreshold - RANGE_MIN) / (RANGE_MAX - RANGE_MIN)) * chartW
    if (threshX > padL && threshX < padL + chartW) {
      ctx.strokeStyle = '#E63946'
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(threshX, padT)
      ctx.lineTo(threshX, padT + chartH)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#E63946'
      ctx.font = '10px "Noto Sans SC", sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('薄层线', threshX + 4, padT + 12)
    }

    ctx.fillStyle = '#8B95A5'
    ctx.font = '10px "JetBrains Mono", monospace'
    ctx.textAlign = 'center'
    for (let i = 0; i <= BINS; i += 2) {
      const x = padL + i * (barW + barGap) - barGap / 2
      const val = RANGE_MIN + i * binWidth
      ctx.fillText(val.toFixed(1), x, padT + chartH + 16)
    }

    ctx.save()
    ctx.translate(12, padT + chartH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillStyle = '#8B95A5'
    ctx.font = '10px "Noto Sans SC", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('频次', 0, 0)
    ctx.restore()

    ctx.fillStyle = '#8B95A5'
    ctx.font = '10px "Noto Sans SC", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('厚度 (mm)', padL + chartW / 2, padT + chartH + 32)
  }, [mussel, thinThreshold])

  useEffect(() => {
    draw()
    window.addEventListener('resize', draw)
    return () => window.removeEventListener('resize', draw)
  }, [draw])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>厚度分布</h3>
        <span className={styles.sampleInfo}>{stats.count} 个测点</span>
      </div>
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendDotRed}`} />
          薄层
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendDotGold}`} />
          偏薄
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendDotBlue}`} />
          正常
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendDotGreen}`} />
          优良
        </span>
      </div>
    </div>
  )
}
