import { useMemo, useState } from "react";
import type { DecompressionStep, DivePlan, HistoricalProfile } from "~/data/types";
import { formatDepth } from "~/utils/format";
import { Activity } from "lucide-react";

interface Props {
  plan: DivePlan;
  historical: HistoricalProfile[];
  steps: DecompressionStep[];
}

interface HoverInfo {
  x: number;
  y: number;
  label: string;
}

export default function ProfileChart({ plan, historical, steps }: Props) {
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const width = 480;
  const height = 260;
  const padding = { top: 20, right: 20, bottom: 32, left: 46 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const maxDepth = Math.max(plan.maxDepth * 1.1, 20);

  const currentPoints = useMemo(() => {
    const pts: { x: number; y: number; depth: number; time: number }[] = [];
    const sorted = [...steps].sort((a, b) => a.index - b.index);
    const totalDur = sorted.reduce((s, st) => s + st.plannedDuration, 0);
    let accTime = 120; // 假设下潜耗时 2min
    pts.push({
      x: padding.left,
      y: padding.top,
      depth: 0,
      time: 0,
    });
    pts.push({
      x: padding.left + (accTime / (totalDur + 240)) * innerW,
      y: padding.top + (sorted[0].plannedDepth / maxDepth) * innerH,
      depth: sorted[0].plannedDepth,
      time: accTime,
    });
    for (let i = 0; i < sorted.length; i++) {
      const s = sorted[i];
      const startX = pts[pts.length - 1].x;
      const endX = startX + (s.plannedDuration / (totalDur + 240)) * innerW;
      const y = padding.top + (s.plannedDepth / maxDepth) * innerH;
      pts.push({ x: endX, y, depth: s.plannedDepth, time: accTime + s.plannedDuration });
      accTime += s.plannedDuration;
      if (i < sorted.length - 1) {
        const next = sorted[i + 1];
        const transX = endX + 10;
        const transY = padding.top + (next.plannedDepth / maxDepth) * innerH;
        pts.push({ x: transX, y: transY, depth: next.plannedDepth, time: accTime + 15 });
        accTime += 15;
      }
    }
    const last = pts[pts.length - 1];
    pts.push({ x: last.x + 20, y: padding.top, depth: 0, time: accTime + 30 });
    return pts;
  }, [steps, maxDepth, innerW, innerH]);

  const currentPath = useMemo(() => {
    return currentPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  }, [currentPoints]);

  const relevantHistorical = historical.filter(hp => hp.siteName === plan.siteName).slice(0, 3);

  const scaleHistory = (hp: HistoricalProfile) => {
    if (!hp.points.length) return [] as { x: number; y: number; depth: number; time: number; date: string; diver: string }[];
    const maxT = Math.max(...hp.points.map(p => p.time), currentPoints[currentPoints.length - 1]?.time ?? 1);
    return hp.points
      .map(p => {
        const x = padding.left + (p.time / (maxT * 1.05)) * innerW;
        const y = padding.top + (p.depth / maxDepth) * innerH;
        return { x, y, depth: p.depth, time: p.time, date: hp.date, diver: hp.diverName };
      });
  };

  const depthTicks = [];
  for (let d = 0; d <= maxDepth; d += Math.ceil(maxDepth / 6)) {
    depthTicks.push(d);
  }

  return (
    <div className="console-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-indicator-cyan" />
          <h3 className="font-bold tracking-wide text-slate-100 text-sm">Dive Profile 比对</h3>
        </div>
        <div className="flex items-center gap-3 text-[10px] reading-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-0.5 bg-indicator-cyan rounded" /> 当前计划
          </span>
          {relevantHistorical.map((hp, i) => (
            <span key={hp.id} className="flex items-center gap-1.5 text-slate-500">
              <span className="w-5 h-0.5 rounded" style={{ background: `rgba(148, 163, 184, ${0.25 + i * 0.2})` }} />
              {hp.date.slice(5)}
            </span>
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-sm bg-nautical-900/70 border border-nautical-700/50">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto block touch-none"
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="currentFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* 网格 */}
          {depthTicks.map((d, i) => {
            const y = padding.top + (d / maxDepth) * innerH;
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                  stroke="rgba(38, 77, 117, 0.4)"
                  strokeDasharray="2 4"
                />
                <text
                  x={padding.left - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="#64748b"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {formatDepth(d)}
                </text>
              </g>
            );
          })}

          {/* 深度轴标题 */}
          <text
            transform={`rotate(-90, ${10}, ${height / 2})`}
            x={10}
            y={height / 2}
            fontSize="10"
            fill="#475569"
            fontFamily="JetBrains Mono, monospace"
          >
            DEPTH (m)
          </text>
          <text
            x={width - padding.right}
            y={height - 8}
            textAnchor="end"
            fontSize="10"
            fill="#475569"
            fontFamily="JetBrains Mono, monospace"
          >
            TIME →
          </text>

          {/* 历史灰线 */}
          {relevantHistorical.map((hp, i) => {
            const scaled = scaleHistory(hp);
            const path = scaled!.map((p, idx) => (idx === 0 ? "M" : "L") + p.x + "," + p.y).join(" ");
            return (
              <g key={hp.id} className="pointer-events-none">
                <path
                  d={path}
                  fill="none"
                  stroke={`rgba(148, 163, 184, ${0.25 + i * 0.2})`}
                  strokeWidth="1.2"
                  strokeDasharray="4 3"
                />
              </g>
            );
          })}

          {/* 当前计划填充 */}
          <path
            d={`${currentPath} L${currentPoints[currentPoints.length - 1].x},${padding.top + innerH} L${currentPoints[0].x},${padding.top + innerH} Z`}
            fill="url(#currentFill)"
          />
          {/* 当前计划实线 */}
          <path
            d={currentPath}
            fill="none"
            stroke="#00E5FF"
            strokeWidth="2.2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* 阶梯标记圆点 */}
          {steps.sort((a, b) => a.index - b.index).map((s, i) => {
            const pt = currentPoints.find(p => Math.abs(p.depth - s.plannedDepth) < 0.1);
            if (!pt) return null;
            const fillColor =
              s.status === "completed" ? "#30D158" :
              s.status === "skipped" ? "#FF3B30" :
              s.status === "locked" ? "#475569" :
              "#00E5FF";
            return (
              <circle
                key={s.id}
                cx={pt.x}
                cy={pt.y}
                r="5"
                fill={fillColor}
                stroke="#0A1628"
                strokeWidth="2"
                onMouseEnter={(e) => {
                  const rect = (e.target as SVGCircleElement).ownerSVGElement?.getBoundingClientRect();
                  if (!rect) return;
                  const svgX = ((e.clientX - rect.left) / rect.width) * width;
                  const svgY = ((e.clientY - rect.top) / rect.height) * height;
                  setHover({
                    x: svgX,
                    y: svgY,
                    label: `阶${i + 1}：${formatDepth(s.plannedDepth)} 停留${Math.round(s.plannedDuration/60)}min [${s.status}]`,
                  });
                }}
                className="cursor-pointer transition-all"
                style={{ filter: s.status !== "locked" ? `drop-shadow(0 0 4px ${fillColor})` : "" }}
              />
            );
          })}

          {/* 0 水面基线 */}
          <line
            x1={padding.left} x2={width - padding.right}
            y1={padding.top} y2={padding.top}
            stroke="#30D158"
            strokeWidth="1.5"
            strokeDasharray="0"
            opacity="0.7"
          />
          <text
            x={padding.left + 2}
            y={padding.top - 4}
            fontSize="10"
            fill="#30D158"
            fontFamily="JetBrains Mono, monospace"
          >
            SURFACE
          </text>
        </svg>

        {hover && (
          <div
            className="absolute pointer-events-none z-10 bg-nautical-800/95 border border-indicator-cyan/60 px-2.5 py-1.5 rounded-sm text-[11px] text-slate-100 reading-mono shadow-lg"
            style={{
              left: Math.min(width - 150, Math.max(4, hover.x / width * 100)) + "%",
              top: Math.max(4, (hover.y / height) * 100 - 12) + "%",
              transform: "translate(-50%, -100%)",
            }}
          >
            {hover.label}
          </div>
        )}
      </div>
    </div>
  );
}
