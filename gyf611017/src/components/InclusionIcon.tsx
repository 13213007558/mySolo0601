import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { InclusionType } from '@/types';
import { getInclusionConfig } from '@/config/inclusionTypes';

const iconMap: Record<string, LucideIcon> = {
  Gem: LucideIcons.Gem,
  Feather: LucideIcons.Feather,
  Cloud: LucideIcons.Cloud,
  Minus: LucideIcons.Minus,
  Circle: LucideIcons.Circle,
  Triangle: LucideIcons.Triangle,
  Zap: LucideIcons.Zap,
  Target: LucideIcons.Target,
  Diamond: LucideIcons.Diamond,
};

interface InclusionIconProps {
  type: InclusionType;
  size?: number;
  className?: string;
}

export const InclusionIcon: React.FC<InclusionIconProps> = ({ type, size = 20, className = '' }) => {
  const cfg = getInclusionConfig(type);
  if (!cfg) return null;

  const IconComp = iconMap[cfg.icon] || LucideIcons.Diamond;

  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      style={{ color: cfg.color }}
    >
      <IconComp size={size} color={cfg.color} strokeWidth={2.5} />
    </span>
  );
};

interface InclusionMarkerProps {
  type: InclusionType;
  x: number;
  y: number;
  selected?: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
  onClick?: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  size?: number;
}

export const InclusionMarker: React.FC<InclusionMarkerProps> = ({
  type,
  x,
  y,
  selected = false,
  onMouseDown,
  onClick,
  onContextMenu,
  size = 28,
}) => {
  const cfg = getInclusionConfig(type);
  const IconComp = iconMap[cfg?.icon || 'Diamond'] || LucideIcons.Diamond;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      className={`inclusion-marker ${selected ? 'selected' : ''}`}
      style={{ cursor: 'move' }}
      onMouseDown={onMouseDown}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      {selected && (
        <circle
          r={size / 2 + 6}
          fill="none"
          stroke={cfg?.color || '#fff'}
          strokeWidth={2}
          strokeDasharray="4 3"
          opacity={0.8}
        />
      )}
      <circle
        r={size / 2 + 2}
        fill="white"
        opacity={0.95}
        stroke={cfg?.color || '#fff'}
        strokeWidth={1.5}
      />
      <foreignObject
        x={-size / 2}
        y={-size / 2}
        width={size}
        height={size}
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconComp size={size * 0.65} color={cfg?.color} strokeWidth={2.5} />
        </div>
      </foreignObject>
    </g>
  );
};

export { iconMap };
