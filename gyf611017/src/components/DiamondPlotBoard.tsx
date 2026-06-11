import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useStoneStore, usePlotStore, getSectorFromCoords } from '@/store/useStoneStore';
import { Inclusion, InclusionType } from '@/types';
import { InclusionMarker } from './InclusionIcon';
import { SECTOR_NAMES } from '@/config/inclusionTypes';
import { Trash2, Move, Info } from 'lucide-react';

const VIEW_SIZE = 500;
const CENTER = VIEW_SIZE / 2;
const RADIUS = CENTER - 20;

interface DiamondPlotBoardProps {
  className?: string;
}

export const DiamondPlotBoard: React.FC<DiamondPlotBoardProps> = ({ className = '' }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { getCurrentStone, addInclusion, updateInclusion, removeInclusion } = useStoneStore();
  const {
    currentInclusionType,
    selectedInclusionId,
    setSelectedInclusion,
    setDragging,
    showSectorHints,
    showPhotoOverlay,
    ripple,
    triggerRipple,
    clearRipple,
  } = usePlotStore();

  const [dragId, setDragId] = useState<string | null>(null);
  const [hoveredInclusion, setHoveredInclusion] = useState<string | null>(null);
  const [tooltipInfo, setTooltipInfo] = useState<{ x: number; y: number; sector: number; type?: Inclusion } | null>(null);

  const stone = getCurrentStone();
  const isReadOnly = stone?.status === 'submitted';

  const getSVGCoords = useCallback((e: React.MouseEvent | MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const scaleX = VIEW_SIZE / rect.width;
    const scaleY = VIEW_SIZE / rect.height;
    return {
      x: ((e.clientX - rect.left) * scaleX / VIEW_SIZE) * 100,
      y: ((e.clientY - rect.top) * scaleY / VIEW_SIZE) * 100,
    };
  }, []);

  const toSVGSpace = (pct: number) => (pct / 100) * VIEW_SIZE;

  const isInsideDiamond = useCallback((xpct: number, ypct: number) => {
    const dx = xpct - 50;
    const dy = ypct - 50;
    return Math.sqrt(dx * dx + dy * dy) <= (RADIUS / VIEW_SIZE) * 100;
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (isReadOnly) return;
    const { x, y } = getSVGCoords(e);
    if (!isInsideDiamond(x, y)) return;

    triggerRipple(toSVGSpace(x), toSVGSpace(y));
    setTimeout(clearRipple, 600);

    if (!selectedInclusionId) {
      addInclusion(stone!.id, x, y, currentInclusionType);
    }
  }, [isReadOnly, getSVGCoords, isInsideDiamond, selectedInclusionId, currentInclusionType, stone, addInclusion, triggerRipple, clearRipple]);

  const handleMarkerMouseDown = useCallback((e: React.MouseEvent, inc: Inclusion) => {
    if (isReadOnly) return;
    e.stopPropagation();
    setSelectedInclusion(inc.id);
    setDragId(inc.id);
    setDragging(true);
  }, [isReadOnly, setSelectedInclusion, setDragging]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const { x, y } = getSVGCoords(e);
    if (!isReadOnly && dragId && stone) {
      const clampedX = Math.max(50 - (RADIUS / VIEW_SIZE) * 100, Math.min(50 + (RADIUS / VIEW_SIZE) * 100, x));
      const clampedY = Math.max(50 - (RADIUS / VIEW_SIZE) * 100, Math.min(50 + (RADIUS / VIEW_SIZE) * 100, y));
      updateInclusion(stone.id, dragId, { x: clampedX, y: clampedY });
    }
    const sector = getSectorFromCoords(x, y);
    setTooltipInfo({ x: e.clientX, y: e.clientY, sector, type: hoveredInclusion ? stone?.inclusions.find(i => i.id === hoveredInclusion) : undefined });
  }, [dragId, isReadOnly, stone, getSVGCoords, updateInclusion, hoveredInclusion]);

  const handleMouseUp = useCallback(() => {
    setDragId(null);
    setDragging(false);
  }, [setDragging]);

  const handleRightClick = useCallback((e: React.MouseEvent, incId: string) => {
    if (isReadOnly) return;
    e.preventDefault();
    e.stopPropagation();
    if (stone) {
      removeInclusion(stone.id, incId);
      if (selectedInclusionId === incId) setSelectedInclusion(null);
    }
  }, [isReadOnly, stone, removeInclusion, selectedInclusionId, setSelectedInclusion]);

  const handleSvgContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedInclusion(null);
  }, [setSelectedInclusion]);

  const sectorsCovered = new Set((stone?.inclusions || []).map(inc => getSectorFromCoords(inc.x, inc.y)));
  const requiredSectors = stone?.requiredSectors || [];
  const incompleteSectors = requiredSectors.filter(s => !sectorsCovered.has(s));

  const renderSectors = () => {
    if (!showSectorHints) return null;
    const sectors = [];
    for (let i = 0; i < 8; i++) {
      const startAngle = (i * 45 - 90) * (Math.PI / 180);
      const endAngle = ((i + 1) * 45 - 90) * (Math.PI / 180);
      const x1 = CENTER + RADIUS * Math.cos(startAngle);
      const y1 = CENTER + RADIUS * Math.sin(startAngle);
      const x2 = CENTER + RADIUS * Math.cos(endAngle);
      const y2 = CENTER + RADIUS * Math.sin(endAngle);
      const isIncomplete = incompleteSectors.includes(i);

      sectors.push(
        <path
          key={`sector-${i}`}
          d={`M ${CENTER} ${CENTER} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 0 1 ${x2} ${y2} Z`}
          className={isIncomplete && !isReadOnly ? 'sector-incomplete' : ''}
          fill={isIncomplete && !isReadOnly ? 'rgba(212,175,55,0.05)' : 'transparent'}
          stroke={isIncomplete && !isReadOnly ? 'rgba(212,175,55,0.3)' : 'rgba(148,163,184,0.15)'}
          strokeWidth={1}
          style={{ pointerEvents: 'none' }}
        />
      );
    }
    return sectors;
  };

  const renderConcentricCircles = () => {
    if (!showSectorHints) return null;
    return [0.33, 0.66, 1].map((r, idx) => (
      <circle
        key={`ring-${idx}`}
        cx={CENTER}
        cy={CENTER}
        r={RADIUS * r}
        fill="none"
        stroke="rgba(148,163,184,0.15)"
        strokeWidth={1}
        strokeDasharray={idx === 2 ? 'none' : '4 4'}
        style={{ pointerEvents: 'none' }}
      />
    ));
  };

  const renderSectorLabels = () => {
    if (!showSectorHints) return null;
    return SECTOR_NAMES.map((name, i) => {
      const angle = ((i * 45 + 22.5) - 90) * (Math.PI / 180);
      const r = RADIUS * 0.85;
      const x = CENTER + r * Math.cos(angle);
      const y = CENTER + r * Math.sin(angle);
      const isIncomplete = incompleteSectors.includes(i);
      return (
        <text
          key={`label-${i}`}
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="10"
          fill={isIncomplete && !isReadOnly ? '#D4AF37' : 'rgba(148,163,184,0.4)'}
          fontWeight={isIncomplete ? 600 : 400}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {name}
        </text>
      );
    });
  };

  return (
    <div className={`relative w-full ${className}`} id="plot-board-container">
      {tooltipInfo && (
        <div
          className="bs-card px-3 py-2 text-xs pointer-events-none z-50"
          style={{
            position: 'fixed',
            left: tooltipInfo.x + 16,
            top: tooltipInfo.y + 16,
          }}
        >
          <div className="flex items-center gap-2 text-slate-300">
            <Info size={12} />
            <span>扇区: {SECTOR_NAMES[tooltipInfo.sector]}</span>
          </div>
          {tooltipInfo.type && (
            <div className="mt-1 text-diamond-gold">
              已标记 · {tooltipInfo.type.type}
            </div>
          )}
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
        className="w-full h-auto select-none"
        style={{
          maxHeight: '70vh',
          aspectRatio: '1 / 1',
          cursor: isReadOnly ? 'not-allowed' : (selectedInclusionId ? 'default' : 'crosshair'),
        }}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { handleMouseUp(); setTooltipInfo(null); setHoveredInclusion(null); }}
        onContextMenu={handleSvgContextMenu}
      >
        <defs>
          <radialGradient id="diamondGradient" cx="50%" cy="35%" r="65%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
            <stop offset="40%" stopColor="rgba(226,232,240,0.9)" />
            <stop offset="75%" stopColor="rgba(148,163,184,0.75)" />
            <stop offset="100%" stopColor="rgba(100,116,139,0.6)" />
          </radialGradient>
          <clipPath id="diamondClip">
            <circle cx={CENTER} cy={CENTER} r={RADIUS} />
          </clipPath>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <pattern id="diamondFacet" patternUnits="userSpaceOnUse" width="60" height="60">
            <path d="M0 30 L30 0 L60 30 L30 60 Z" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          </pattern>
        </defs>

        <circle cx={CENTER} cy={CENTER} r={RADIUS + 8} fill="none" stroke="#D4AF37" strokeWidth={2} opacity={0.3} />
        <circle cx={CENTER} cy={CENTER} r={RADIUS + 4} fill="none" stroke="#D4AF37" strokeWidth={1} opacity={0.5} />
        <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="url(#diamondGradient)" stroke="#94a3b8" strokeWidth={1.5} />

        {showPhotoOverlay && stone && (
          <g clipPath="url(#diamondClip)">
            <image
              href={stone.imageUrl}
              x={CENTER - RADIUS}
              y={CENTER - RADIUS}
              width={RADIUS * 2}
              height={RADIUS * 2}
              opacity={0.35}
              preserveAspectRatio="xMidYMid slice"
            />
          </g>
        )}

        <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="url(#diamondFacet)" />

        {renderSectors()}
        {renderConcentricCircles()}

        <g opacity={0.3} stroke="#ffffff" strokeWidth={0.5}>
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = ((i * 45) - 90) * (Math.PI / 180);
            return (
              <line
                key={`spoke-${i}`}
                x1={CENTER}
                y1={CENTER}
                x2={CENTER + RADIUS * Math.cos(angle)}
                y2={CENTER + RADIUS * Math.sin(angle)}
                style={{ pointerEvents: 'none' }}
              />
            );
          })}
        </g>

        <circle cx={CENTER} cy={CENTER} r={RADIUS * 0.55} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={0.8} />
        <polygon
          points={`
            ${CENTER},${CENTER - RADIUS * 0.55}
            ${CENTER + RADIUS * 0.39},${CENTER - RADIUS * 0.39}
            ${CENTER + RADIUS * 0.55},${CENTER}
            ${CENTER + RADIUS * 0.39},${CENTER + RADIUS * 0.39}
            ${CENTER},${CENTER + RADIUS * 0.55}
            ${CENTER - RADIUS * 0.39},${CENTER + RADIUS * 0.39}
            ${CENTER - RADIUS * 0.55},${CENTER}
            ${CENTER - RADIUS * 0.39},${CENTER - RADIUS * 0.39}
          `}
          fill="rgba(255,255,255,0.04)"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={0.8}
        />

        {renderSectorLabels()}

        {stone?.inclusions.map(inc => (
          <g
            key={inc.id}
            onMouseEnter={() => setHoveredInclusion(inc.id)}
            onMouseLeave={() => setHoveredInclusion(null)}
          >
            <InclusionMarker
              type={inc.type}
              x={toSVGSpace(inc.x)}
              y={toSVGSpace(inc.y)}
              selected={selectedInclusionId === inc.id}
              onMouseDown={(e) => handleMarkerMouseDown(e, inc)}
              onClick={(e) => { e.stopPropagation(); setSelectedInclusion(inc.id); }}
              onContextMenu={(e) => handleRightClick(e, inc.id)}
              size={30}
            />
          </g>
        ))}

        {ripple && (
          <circle
            cx={ripple.x}
            cy={ripple.y}
            r={20}
            fill="none"
            stroke="#D4AF37"
            strokeWidth={2}
            className="animate-ripple"
            style={{ transformOrigin: `${ripple.x}px ${ripple.y}px` }}
          />
        )}

        {selectedInclusionId && !isReadOnly && (
          <g transform="translate(16, 16)">
            <rect x={0} y={0} width={180} height={48} rx={8} fill="rgba(15,23,42,0.9)" stroke="#D4AF37" strokeWidth={1} />
            <text x={12} y={20} fill="#e2e8f0" fontSize={11} fontWeight={600}>已选中标记</text>
            <g transform="translate(12, 30)">
              <Move size={12} style={{ color: '#94a3b8', display: 'inline' }} />
              <text x={20} y={12} fill="#94a3b8" fontSize={10}>拖拽移动 · 右键删除</text>
            </g>
          </g>
        )}

        {isReadOnly && (
          <g transform={`translate(${CENTER - 75}, 16)`}>
            <rect x={0} y={0} width={150} height={32} rx={16} fill="rgba(5,150,105,0.9)" />
            <text x={75} y={20} textAnchor="middle" fill="white" fontSize={12} fontWeight={600}>
              已提交 · 只读模式
            </text>
          </g>
        )}

        {incompleteSectors.length > 0 && !isReadOnly && showSectorHints && (
          <g transform={`translate(${CENTER - 95}, ${VIEW_SIZE - 48})`}>
            <rect x={0} y={0} width={190} height={32} rx={16} fill="rgba(212,175,55,0.15)" stroke="#D4AF37" strokeWidth={1} strokeDasharray="4 2" />
            <text x={95} y={20} textAnchor="middle" fill="#D4AF37" fontSize={11} fontWeight={600}>
              剩余 {incompleteSectors.length} 扇区需标记
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
