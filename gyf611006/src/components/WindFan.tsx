import React, { useMemo } from 'react';
import { Wind, Thermometer } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { calculateFanPoints } from '../utils/wind';

interface WindFanProps {
  width?: number;
  height?: number;
}

export const WindFan: React.FC<WindFanProps> = ({
  width = 600,
  height = 600,
}) => {
  const { diamond, wind, setWindAngle, setWindSpeed, hasWindReading, setHasWindReading } = useAppStore();

  const fanPath = useMemo(() => {
    const maxDistance = Math.max(
      diamond.distances.north,
      diamond.distances.south,
      diamond.distances.east,
      diamond.distances.west
    );
    const radiusPx = maxDistance / 5 + 40;
    return calculateFanPoints(diamond.center, radiusPx, wind.angle, wind.fanAngle);
  }, [diamond, wind]);

  const angleToRad = (angle: number) => (angle - 90) * (Math.PI / 180);

  const arrowPoints = useMemo(() => {
    const center = diamond.center;
    const length = Math.min(width, height) * 0.35;
    const rad = angleToRad(wind.angle);
    const endX = center.x + length * Math.cos(rad);
    const endY = center.y + length * Math.sin(rad);
    
    const headLen = 15;
    const headAngle = Math.PI / 6;
    const head1X = endX - headLen * Math.cos(rad - headAngle);
    const head1Y = endY - headLen * Math.sin(rad - headAngle);
    const head2X = endX - headLen * Math.cos(rad + headAngle);
    const head2Y = endY - headLen * Math.sin(rad + headAngle);
    
    return { endX, endY, head1X, head1Y, head2X, head2Y };
  }, [diamond.center, wind.angle, width, height]);

  const presets = [
    { label: '北', angle: 0 },
    { label: '东北', angle: 45 },
    { label: '东', angle: 90 },
    { label: '东南', angle: 135 },
    { label: '南', angle: 180 },
    { label: '西南', angle: 225 },
    { label: '西', angle: 270 },
    { label: '西北', angle: 315 },
  ];

  return (
    <div className="flex flex-col h-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full flex-shrink-0"
        style={{ maxHeight: '280px' }}
      >
        <defs>
          <radialGradient id="fanGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05" />
          </radialGradient>
        </defs>

        <path
          d={fanPath}
          fill="url(#fanGradient)"
          stroke="#3B82F6"
          strokeWidth="1.5"
          strokeDasharray="6,4"
          opacity="0.7"
        />

        <line
          x1={diamond.center.x}
          y1={diamond.center.y}
          x2={arrowPoints.endX}
          y2={arrowPoints.endY}
          stroke="#3B82F6"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <polygon
          points={`${arrowPoints.endX},${arrowPoints.endY} ${arrowPoints.head1X},${arrowPoints.head1Y} ${arrowPoints.head2X},${arrowPoints.head2Y}`}
          fill="#3B82F6"
        />

        <text
          x={arrowPoints.endX + 15}
          y={arrowPoints.endY}
          fill="#60A5FA"
          fontSize="12"
          fontWeight="500"
          textAnchor="start"
          dominantBaseline="middle"
        >
          风向
        </text>
      </svg>

      <div className="mt-4 space-y-4 px-1">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-dark-300 flex items-center gap-2">
              <Wind size={14} className="text-blue-400" />
              风向角度
            </label>
            <span className="text-sm font-mono text-blue-400">
              {Math.round(wind.angle)}°
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {presets.map((preset) => (
              <button
                key={preset.angle}
                onClick={() => setWindAngle(preset.angle)}
                className={`py-1.5 text-xs rounded transition-colors ${
                  wind.angle === preset.angle
                    ? 'bg-blue-500 text-white'
                    : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="360"
            value={wind.angle}
            onChange={(e) => setWindAngle(Number(e.target.value))}
            className="flex-1 h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-dark-300 flex items-center gap-2">
              <Thermometer size={14} className="text-warning-400" />
              风速
            </label>
            <span className="text-sm font-mono text-warning-400">
              {wind.speed.toFixed(1)} m/s
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {[1, 3, 5, 8, 12].map((speed) => (
              <button
                key={speed}
                onClick={() => setWindSpeed(speed)}
                className={`py-1.5 text-xs rounded transition-colors ${
                  Math.abs(wind.speed - speed) < 0.5
                    ? 'bg-warning-500 text-white'
                    : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                }`}
              >
                {speed}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-dark-700">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hasWindReading}
              onChange={(e) => setHasWindReading(e.target.checked)}
              className="w-4 h-4 rounded accent-safety-500"
            />
            <span className="text-sm text-dark-300">
              已上传风向仪读数
            </span>
          </label>
          {hasWindReading && (
            <p className="text-xs text-safety-400 mt-2 ml-6">
              ✓ 风向数据已记录
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
