import React, { useRef, useMemo } from 'react';
import { Move } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import type { Direction } from '../types';

interface DiamondRulerProps {
  width?: number;
  height?: number;
}

const directionLabels: Record<Direction, string> = {
  north: '北',
  south: '南',
  east: '东',
  west: '西',
};

export const DiamondRuler: React.FC<DiamondRulerProps> = ({
  width = 600,
  height = 600,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { diamond, setDiamondVertex } = useAppStore();
  const dragState = useRef<{ direction: Direction | null; startX: number; startY: number }>({
    direction: null,
    startX: 0,
    startY: 0,
  });

  const getSvgPoint = (clientX: number, clientY: number) => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (direction: Direction) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragState.current.direction = direction;
  };

  const handleTouchStart = (direction: Direction) => (e: React.TouchEvent) => {
    e.stopPropagation();
    if (e.touches.length === 1) {
      dragState.current.direction = direction;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.current.direction) return;
    
    const point = getSvgPoint(e.clientX, e.clientY);
    if (!point) return;

    const dir = dragState.current.direction;
    const center = diamond.center;

    let newX = point.x;
    let newY = point.y;

    if (dir === 'north' || dir === 'south') {
      newX = center.x;
    }
    if (dir === 'east' || dir === 'west') {
      newY = center.y;
    }

    newX = Math.max(20, Math.min(width - 20, newX));
    newY = Math.max(20, Math.min(height - 20, newY));

    setDiamondVertex(dir, newX, newY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragState.current.direction || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const point = getSvgPoint(touch.clientX, touch.clientY);
    if (!point) return;

    const dir = dragState.current.direction;
    const center = diamond.center;

    let newX = point.x;
    let newY = point.y;

    if (dir === 'north' || dir === 'south') {
      newX = center.x;
    }
    if (dir === 'east' || dir === 'west') {
      newY = center.y;
    }

    newX = Math.max(20, Math.min(width - 20, newX));
    newY = Math.max(20, Math.min(height - 20, newY));

    setDiamondVertex(dir, newX, newY);
  };

  const handleMouseUp = () => {
    dragState.current.direction = null;
  };

  const handleTouchEnd = () => {
    dragState.current.direction = null;
  };

  const diamondPath = useMemo(() => {
    return `M ${diamond.north.x} ${diamond.north.y} L ${diamond.east.x} ${diamond.east.y} L ${diamond.south.x} ${diamond.south.y} L ${diamond.west.x} ${diamond.west.y} Z`;
  }, [diamond]);

  const directions: Direction[] = ['north', 'east', 'south', 'west'];

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full touch-none"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          </pattern>
          <linearGradient id="diamondGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FF6B35" stopOpacity="0.1" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width={width} height={height} fill="url(#grid)" />

        <line
          x1={diamond.center.x}
          y1={0}
          x2={diamond.center.x}
          y2={height}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
          strokeDasharray="5,5"
        />
        <line
          x1={0}
          y1={diamond.center.y}
          x2={width}
          y2={diamond.center.y}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
          strokeDasharray="5,5"
        />

        <path
          d={diamondPath}
          fill="url(#diamondGradient)"
          stroke="#FF6B35"
          strokeWidth="2"
          filter="url(#glow)"
        />

        {directions.map((dir) => {
          const point = diamond[dir];
          const distance = diamond.distances[dir];
          const isNorth = dir === 'north';
          const isSouth = dir === 'south';
          const isEast = dir === 'east';
          const isWest = dir === 'west';

          let labelX = point.x;
          let labelY = point.y;
          let textAnchor = 'middle';
          let dy = '0.35em';

          if (isNorth) {
            labelY -= 24;
          } else if (isSouth) {
            labelY += 36;
          } else if (isEast) {
            labelX += 40;
            textAnchor = 'start';
          } else if (isWest) {
            labelX -= 40;
            textAnchor = 'end';
          }

          return (
            <g key={dir}>
              <line
                x1={diamond.center.x}
                y1={diamond.center.y}
                x2={point.x}
                y2={point.y}
                stroke="#FF6B35"
                strokeWidth="1.5"
                strokeDasharray="4,4"
                opacity="0.6"
              />

              <text
                x={(diamond.center.x + point.x) / 2}
                y={(diamond.center.y + point.y) / 2}
                fill="#FFB088"
                fontSize="12"
                textAnchor="middle"
                dy="-4"
              >
                {distance}m
              </text>

              <circle
                cx={point.x}
                cy={point.y}
                r="20"
                fill="transparent"
                className="cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown(dir)}
                onTouchStart={handleTouchStart(dir)}
              />

              <circle
                cx={point.x}
                cy={point.y}
                r="10"
                fill="#1A1A2E"
                stroke="#FF6B35"
                strokeWidth="2"
                className="pointer-events-none"
              />
              <circle
                cx={point.x}
                cy={point.y}
                r="4"
                fill="#FF6B35"
                className="pointer-events-none"
              />

              <text
                x={labelX}
                y={labelY}
                fill="#E8E8E8"
                fontSize="13"
                fontWeight="500"
                textAnchor={textAnchor as any}
                dy={dy}
                className="pointer-events-none select-none"
              >
                <tspan fill="#9A9ABF" fontSize="11">{directionLabels[dir]}</tspan>
                <tspan dx="4" fill="#FF6B35" fontFamily="monospace" fontSize="16" fontWeight="bold">
                  {distance}
                </tspan>
                <tspan fill="#6B6B9E" fontSize="11"> m</tspan>
              </text>
            </g>
          );
        })}

        <circle
          cx={diamond.center.x}
          cy={diamond.center.y}
          r="6"
          fill="#2ECC71"
          filter="url(#glow)"
        />
        <circle
          cx={diamond.center.x}
          cy={diamond.center.y}
          r="12"
          fill="none"
          stroke="#2ECC71"
          strokeWidth="1"
          opacity="0.5"
        />

        <text
          x={diamond.center.x + 16}
          y={diamond.center.y - 16}
          fill="#2ECC71"
          fontSize="11"
          fontWeight="500"
        >
          泄漏源
        </text>
      </svg>

      <div className="absolute top-3 left-3 flex items-center gap-2 text-xs text-dark-400 bg-dark-800/80 px-2 py-1 rounded">
        <Move size={12} />
        <span>拖拽菱形顶点调整距离</span>
      </div>
    </div>
  );
};
