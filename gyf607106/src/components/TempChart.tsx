import { useEffect, useCallback, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Info } from 'lucide-react';
import type { OilTempRecord, SupplementPoint } from '@/types';
import { useOilTempStore } from '@/store/useOilTempStore';
import { useChartInteraction } from '@/hooks/useChartInteraction';
import { parseTimeToMinutes } from '@/utils/hash';
import { useSupplementComparison } from '@/hooks/useSupplementComparison';

interface TempChartProps {
  records: OilTempRecord[];
  showSupplement: boolean;
  supplementId: string | null;
}

const CHART_WIDTH = 800;
const CHART_HEIGHT = 320;
const PADDING = { top: 20, right: 20, bottom: 40, left: 50 };
const Y_RANGE = { min: 40, max: 75 };

export function TempChart({ records, showSupplement, supplementId }: TempChartProps) {
  const { selectedDevice, chartRange, simulateConflict } = useOilTempStore();
  const { supplement, getOriginalPoints } = useSupplementComparison(supplementId);

  const chart = useChartInteraction({
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
    padding: PADDING,
    yRange: Y_RANGE,
  });

  const animationRef = useRef<number>(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [tooltipData, setTooltipData] = useState<{
    time: string;
    original: number | null;
    supplement: number | null;
  } | null>(null);

  const deviceRecords = records.filter(
    r => r.deviceName === selectedDevice && r.measurePoint === '顶层油温'
  );

  const anomalyRecords = deviceRecords.filter(r => r.status === 'abnormal');

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
    ctx.lineWidth = 1;

    for (let value = Y_RANGE.min; value <= Y_RANGE.max; value += 5) {
      const y = chart.valueToY(value);
      ctx.beginPath();
      ctx.moveTo(PADDING.left, y);
      ctx.lineTo(CHART_WIDTH - PADDING.right, y);
      ctx.stroke();

      ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${value}°`, PADDING.left - 8, y + 4);
    }

    const timeLabels = ['22:00', '23:00', '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00'];
    timeLabels.forEach(time => {
      const x = chart.timeToX(time);
      if (x >= PADDING.left && x <= CHART_WIDTH - PADDING.right) {
        ctx.beginPath();
        ctx.moveTo(x, PADDING.top);
        ctx.lineTo(x, CHART_HEIGHT - PADDING.bottom);
        ctx.stroke();

        ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
        ctx.font = '11px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(time, x, CHART_HEIGHT - PADDING.bottom + 20);
      }
    });
  }, [chart]);

  const drawLine = useCallback((
    ctx: CanvasRenderingContext2D,
    points: { x: number; y: number }[],
    color: string,
    dashed = false,
    lineWidth = 2
  ) => {
    if (points.length < 2) return;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (dashed) {
      ctx.setLineDash([6, 4]);
    }

    let animationProgress = 0;
    const animate = () => {
      animationProgress += 0.03;
      if (animationProgress > 1) animationProgress = 1;

      const pointsToDraw = Math.floor(points.length * animationProgress);

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < pointsToDraw; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();

      if (animationProgress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animate();
    ctx.restore();
  }, []);

  const drawArea = useCallback((
    ctx: CanvasRenderingContext2D,
    originalPoints: { x: number; y: number }[],
    supplementPoints: { x: number; y: number }[]
  ) => {
    const origMap = new Map(originalPoints.map(p => [p.x, p.y]));
    const suppMap = new Map(supplementPoints.map(p => [p.x, p.y]));
    const allX = new Set([...origMap.keys(), ...suppMap.keys()]);
    const sortedX = Array.from(allX).sort((a, b) => a - b);

    ctx.save();
    ctx.fillStyle = 'rgba(244, 114, 182, 0.15)';
    ctx.beginPath();

    let started = false;
    for (const x of sortedX) {
      const y1 = origMap.get(x);
      const y2 = suppMap.get(x);
      if (y1 !== undefined && y2 !== undefined && Math.abs(y1 - y2) > 5) {
        if (!started) {
          ctx.moveTo(x, Math.min(y1, y2));
          started = true;
        }
        ctx.lineTo(x, Math.max(y1, y2));
      } else if (started) {
        break;
      }
    }

    for (let i = sortedX.length - 1; i >= 0; i--) {
      const x = sortedX[i];
      const y1 = origMap.get(x);
      const y2 = suppMap.get(x);
      if (y1 !== undefined && y2 !== undefined && Math.abs(y1 - y2) > 5) {
        ctx.lineTo(x, Math.min(y1, y2));
      }
    }

    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }, []);

  const drawAnomalyMarkers = useCallback((
    ctx: CanvasRenderingContext2D,
    points: { x: number; y: number; time: string; value: number }[]
  ) => {
    const anomalyTimes = new Set(anomalyRecords.map(r => r.timestamp));

    points.forEach(point => {
      if (anomalyTimes.has(point.time)) {
        ctx.save();
        ctx.fillStyle = '#EF4444';
        ctx.strokeStyle = '#FCA5A5';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FEE2E2';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${point.value}°`, point.x, point.y - 12);

        ctx.restore();
      }
    });
  }, [anomalyRecords]);

  const drawSelection = useCallback((ctx: CanvasRenderingContext2D) => {
    if (chart.isDragging && chart.dragStart && chart.dragEnd) {
      const minX = Math.min(chart.dragStart.x, chart.dragEnd.x);
      const maxX = Math.max(chart.dragStart.x, chart.dragEnd.x);

      ctx.save();
      ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 2]);

      ctx.fillRect(minX, PADDING.top, maxX - minX, CHART_HEIGHT - PADDING.top - PADDING.bottom);
      ctx.strokeRect(minX, PADDING.top, maxX - minX, CHART_HEIGHT - PADDING.top - PADDING.bottom);

      ctx.fillStyle = 'rgba(59, 130, 246, 0.9)';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      const startTime = chart.xToTime(minX);
      const endTime = chart.xToTime(maxX);
      ctx.fillText(`${startTime} → ${endTime}`, minX + 5, PADDING.top + 18);

      ctx.restore();
    }
  }, [chart]);

  const handleChartMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    chart.handleMouseMove(e);

    const rect = chart.canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const originalPoints = chart.prepareDataPoints(deviceRecords);
    const nearestOrig = chart.findNearestPoint(x, y, originalPoints);

    let suppValue: number | null = null;
    if (showSupplement && supplement) {
      const suppPoints = chart.prepareSupplementPoints(supplement.points);
      const nearestSupp = chart.findNearestPoint(x, y, suppPoints);
      if (nearestSupp) suppValue = nearestSupp.value;
    }

    if (nearestOrig) {
      setShowTooltip(true);
      setTooltipPos({ x, y: y - 10 });
      setTooltipData({
        time: nearestOrig.time,
        original: nearestOrig.value,
        supplement: suppValue,
      });
    } else {
      setShowTooltip(false);
      setTooltipData(null);
    }
  }, [chart, deviceRecords, showSupplement, supplement]);

  const handleChartMouseLeave = useCallback(() => {
    setShowTooltip(false);
    setTooltipData(null);
  }, []);

  useEffect(() => {
    const canvas = chart.canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, CHART_WIDTH, CHART_HEIGHT);

      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, CHART_WIDTH, CHART_HEIGHT);

      drawGrid(ctx);

      const originalPoints = chart.prepareDataPoints(deviceRecords);
      drawLine(ctx, originalPoints, '#3B82F6');
      drawAnomalyMarkers(ctx, originalPoints);

      if (showSupplement && supplement) {
        const supplementPoints = chart.prepareSupplementPoints(supplement.points);
        drawLine(ctx, supplementPoints, '#F59E0B', true);
        drawArea(ctx, originalPoints, supplementPoints);
      }

      drawSelection(ctx);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [chart, deviceRecords, showSupplement, supplement, drawGrid, drawLine, drawArea, drawAnomalyMarkers, drawSelection]);

  const handleSimulateConflict = () => {
    if (deviceRecords.length > 0) {
      simulateConflict(deviceRecords[0].id);
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-slate-200">
            夜间油温曲线 - {selectedDevice}
          </h3>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-0.5 bg-blue-500 rounded" />
              原始数据
            </span>
            {showSupplement && (
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-0.5 bg-amber-500 rounded" style={{ borderStyle: 'dashed', borderWidth: '1.5px' }} />
                小赵补录
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500">
            区间: {chartRange.start} → {chartRange.end}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => chart.setZoomLevel(prev => Math.min(prev * 1.2, 5))}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
            title="放大"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => chart.setZoomLevel(prev => Math.max(prev * 0.8, 0.5))}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
            title="缩小"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={chart.resetView}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
            title="重置视图"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-slate-700 mx-1" />
          <button
            onClick={handleSimulateConflict}
            className="px-2 py-1 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded border border-amber-500/30 transition-colors"
            title="模拟编辑冲突"
          >
            模拟冲突
          </button>
        </div>
      </div>

      <div className="relative p-4">
        <div className="relative inline-block">
          <canvas
            ref={chart.canvasRef}
            width={CHART_WIDTH}
            height={CHART_HEIGHT}
            onMouseDown={chart.handleMouseDown}
            onMouseMove={handleChartMouseMove}
            onMouseUp={chart.handleMouseUp}
            onMouseLeave={handleChartMouseLeave}
            onWheel={chart.handleWheel}
            className="rounded-lg cursor-crosshair"
            style={{ cursor: chart.isPanning ? 'grab' : chart.isDragging ? 'crosshair' : 'crosshair' }}
          />

          {showTooltip && tooltipData && (
            <div
              className="absolute pointer-events-none bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-xs z-10 shadow-xl"
              style={{
                left: tooltipPos.x + 15,
                top: tooltipPos.y - 30,
                transform: 'translateY(-100%)',
              }}
            >
              <div className="text-slate-400 mb-1">{tooltipData.time}</div>
              <div className="text-blue-400 font-mono">
                原始: {tooltipData.original?.toFixed(1)}°C
              </div>
              {tooltipData.supplement !== null && (
                <div className="text-amber-400 font-mono">
                  补录: {tooltipData.supplement.toFixed(1)}°C
                </div>
              )}
              {tooltipData.original !== null && tooltipData.supplement !== null && (
                <div className={`font-mono mt-1 ${
                  Math.abs(tooltipData.supplement - tooltipData.original) >= 2
                    ? 'text-pink-400'
                    : 'text-slate-400'
                }`}>
                  差异: {(tooltipData.supplement - tooltipData.original).toFixed(1)}°C
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <Info className="w-3.5 h-3.5" />
          <span>拖拽选择区间 | 滚轮缩放 | Shift+拖拽平移 | 双击表格编辑</span>
        </div>
      </div>
    </div>
  );
}
