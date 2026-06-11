import { useEffect, useRef, useState } from 'react';
import { angleService } from '../../services/angleService';
import { usePreferences } from '../../store/usePreferences';

interface Props {
  value: number;
  onChange: (v: number) => void;
  onChangeEnd?: (v: number) => void;
  size?: number;
}

export function AngleSlider({ value, onChange, onChangeEnd, size = 220 }: Props) {
  const snapTo15 = usePreferences((s) => s.snapTo15);
  const draggingRef = useRef(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const radius = size / 2 - 20;
  const center = size / 2;

  const getAngleFromEvent = (clientX: number, clientY: number): number => {
    if (!svgRef.current) return value;
    const rect = svgRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return angleService.vectorToAngle(clientX - cx, clientY - cy);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true;
    setIsDragging(true);
    (e.target as Element).setPointerCapture(e.pointerId);
    let a = getAngleFromEvent(e.clientX, e.clientY);
    if (snapTo15) a = angleService.snapTo15(a);
    onChange(a);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    let a = getAngleFromEvent(e.clientX, e.clientY);
    if (snapTo15) a = angleService.snapTo15(a);
    onChange(a);
  };

  const handlePointerUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setIsDragging(false);
    onChangeEnd?.(value);
  };

  useEffect(() => {
    const up = () => {
      if (draggingRef.current) {
        draggingRef.current = false;
        setIsDragging(false);
        onChangeEnd?.(value);
      }
    };
    window.addEventListener('pointerup', up);
    return () => window.removeEventListener('pointerup', up);
  }, [value, onChangeEnd]);

  const ticks = Array.from({ length: 24 }, (_, i) => i * 15);
  const handleX =
    center + radius * Math.cos(angleService.toRadians(value));
  const handleY =
    center + radius * Math.sin(angleService.toRadians(value));

  const onLinearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = Number(e.target.value);
    if (snapTo15) v = angleService.snapTo15(v);
    onChange(v);
  };

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      <svg
        ref={svgRef}
        width={size}
        height={size}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="cursor-grab touch-none"
        style={{ touchAction: 'none' }}
      >
        <defs>
          <radialGradient id="dialBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FDF8EC" />
            <stop offset="100%" stopColor="#EFE5CF" />
          </radialGradient>
          <linearGradient id="dialStroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8B6B3D" />
            <stop offset="100%" stopColor="#5C4522" />
          </linearGradient>
        </defs>

        <circle
          cx={center}
          cy={center}
          r={size / 2 - 4}
          fill="url(#dialBg)"
          stroke="url(#dialStroke)"
          strokeWidth={2}
        />

        {ticks.map((t) => {
          const isMajor = t % 90 === 0;
          const isQuarter = t % 45 === 0 && !isMajor;
          const r1 = radius - (isMajor ? 14 : isQuarter ? 10 : 6);
          const r2 = radius + 2;
          const rad = angleService.toRadians(t);
          return (
            <line
              key={t}
              x1={center + r1 * Math.cos(rad)}
              y1={center + r1 * Math.sin(rad)}
              x2={center + r2 * Math.cos(rad)}
              y2={center + r2 * Math.sin(rad)}
              stroke={isMajor ? '#B23A48' : isQuarter ? '#5C4522' : '#8B6B3D'}
              strokeWidth={isMajor ? 3 : isQuarter ? 2 : 1}
            />
          );
        })}

        {ticks.filter((t) => t % 45 === 0).map((t) => {
          const r = radius - 26;
          const rad = angleService.toRadians(t);
          return (
            <text
              key={'label-' + t}
              x={center + r * Math.cos(rad)}
              y={center + r * Math.sin(rad)}
              fill="#3B2F2F"
              fontSize={isDragging ? 12 : 11}
              fontFamily="'Source Han Serif', 'Noto Serif SC', serif"
              textAnchor="middle"
              dominantBaseline="central"
              className="font-semibold"
            >
              {t.toString().padStart(3, '0')}°
            </text>
          );
        })}

        <line
          x1={center}
          y1={center}
          x2={handleX}
          y2={handleY}
          stroke="#2D5A7B"
          strokeWidth={3}
          strokeLinecap="round"
        />

        <circle
          cx={handleX}
          cy={handleY}
          r={isDragging ? 12 : 10}
          fill="#2D5A7B"
          stroke="#FFFFFF"
          strokeWidth={2}
          className="transition-[r] duration-150"
        />

        <circle cx={center} cy={center} r={8} fill="#3B2F2F" />
        <circle cx={center} cy={center} r={4} fill="#FDF8EC" />
      </svg>

      <div className="flex flex-col items-center gap-3 w-full max-w-[320px]">
        <div
          className="px-5 py-2 rounded-lg border border-[#8B6B3D]/40"
          style={{ background: 'rgba(253,248,236,0.6)' }}
        >
          <span
            className="text-4xl font-bold tabular-nums tracking-wider"
            style={{
              fontFamily: "'Source Han Serif', 'Noto Serif SC', serif",
              color: '#2D5A7B',
            }}
          >
            {angleService.formatAngle(value)}
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={360}
          step={snapTo15 ? 15 : 1}
          value={value}
          onChange={onLinearChange}
          onMouseUp={() => onChangeEnd?.(value)}
          onTouchEnd={() => onChangeEnd?.(value)}
          className="w-full h-3 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #2D5A7B 0%, #2D5A7B ${
              (value / 360) * 100
            }%, #D4C5A3 ${(value / 360) * 100}%, #D4C5A3 100%)`,
          }}
        />
        <div className="flex justify-between w-full text-xs text-[#8B6B3D]">
          <span>000°</span>
          <span>090°</span>
          <span>180°</span>
          <span>270°</span>
          <span>360°</span>
        </div>
      </div>
    </div>
  );
}
