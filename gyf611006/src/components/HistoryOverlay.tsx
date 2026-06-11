import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { calculateFanPoints } from '../utils/wind';

interface HistoryOverlayProps {
  width?: number;
  height?: number;
}

export const HistoryOverlay: React.FC<HistoryOverlayProps> = () => {
  const { historyRecords, showHistoryOverlay, selectedHistoryId } = useAppStore();

  if (!showHistoryOverlay) return null;

  const displayRecords = selectedHistoryId
    ? historyRecords.filter((r) => r.id === selectedHistoryId)
    : historyRecords.slice(0, 5);

  const colors = [
    { stroke: '#A855F7', fill: 'rgba(168, 85, 247, 0.15)' },
    { stroke: '#EC4899', fill: 'rgba(236, 72, 153, 0.15)' },
    { stroke: '#06B6D4', fill: 'rgba(6, 182, 212, 0.15)' },
    { stroke: '#84CC16', fill: 'rgba(132, 204, 22, 0.15)' },
    { stroke: '#F59E0B', fill: 'rgba(245, 158, 11, 0.15)' },
  ];

  return (
    <g className="pointer-events-none">
      {displayRecords.map((record, index) => {
        const color = colors[index % colors.length];
        const center = record.leakSource;
        const radius = record.correctedDistances.average / 5;
        const fanPath = calculateFanPoints(
          center,
          radius,
          record.wind.angle,
          record.wind.fanAngle
        );

        const diamondPath = `M ${record.diamond.north.x} ${record.diamond.north.y} L ${record.diamond.east.x} ${record.diamond.east.y} L ${record.diamond.south.x} ${record.diamond.south.y} L ${record.diamond.west.x} ${record.diamond.west.y} Z`;

        return (
          <g key={record.id} opacity={selectedHistoryId ? 0.6 : 0.4}>
            <path
              d={diamondPath}
              fill="none"
              stroke={color.stroke}
              strokeWidth="1.5"
              strokeDasharray="4,4"
            />
            
            <path
              d={fanPath}
              fill={color.fill}
              stroke={color.stroke}
              strokeWidth="1"
              strokeDasharray="3,3"
            />

            <circle
              cx={center.x}
              cy={center.y}
              r="4"
              fill={color.stroke}
            />

            {selectedHistoryId && (
              <text
                x={center.x + 8}
                y={center.y - 8}
                fill={color.stroke}
                fontSize="10"
                fontWeight="500"
              >
                {record.location.split('-')[1] || '历史'}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
};
