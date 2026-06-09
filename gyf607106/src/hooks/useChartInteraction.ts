import { useState, useRef, useCallback, useEffect } from 'react';
import type { ChartRange, OilTempRecord, SupplementPoint } from '@/types';
import { useOilTempStore } from '@/store/useOilTempStore';
import { parseTimeToMinutes, minutesToTimeString } from '@/utils/hash';

interface Point {
  x: number;
  y: number;
  time: string;
  value: number;
}

interface UseChartInteractionOptions {
  width: number;
  height: number;
  padding: { top: number; right: number; bottom: number; left: number };
  yRange: { min: number; max: number };
}

export function useChartInteraction(options: UseChartInteractionOptions) {
  const { width, height, padding, yRange } = options;
  const { chartRange, setChartRange } = useOilTempStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ x: number; y: number } | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<Point | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const timeToX = useCallback((time: string): number => {
    const minutes = parseTimeToMinutes(time);
    const rangeStart = parseTimeToMinutes(chartRange.start);
    let rangeEnd = parseTimeToMinutes(chartRange.end);
    if (rangeEnd < rangeStart) rangeEnd += 24 * 60;
    const totalRange = rangeEnd - rangeStart;
    let relMinutes = minutes - rangeStart;
    if (relMinutes < 0) relMinutes += 24 * 60;
    return padding.left + (relMinutes / totalRange) * chartWidth * zoomLevel + panOffset.x;
  }, [chartRange, chartWidth, padding.left, zoomLevel, panOffset.x]);

  const xToTime = useCallback((x: number): string => {
    const relX = (x - padding.left - panOffset.x) / (chartWidth * zoomLevel);
    const rangeStart = parseTimeToMinutes(chartRange.start);
    const rangeEnd = parseTimeToMinutes(chartRange.end);
    let totalRange = rangeEnd - rangeStart;
    if (totalRange < 0) totalRange += 24 * 60;
    let minutes = rangeStart + relX * totalRange;
    if (minutes >= 24 * 60) minutes -= 24 * 60;
    if (minutes < 0) minutes += 24 * 60;
    return minutesToTimeString(Math.round(minutes));
  }, [chartRange, chartWidth, padding.left, zoomLevel, panOffset.x]);

  const valueToY = useCallback((value: number): number => {
    const range = yRange.max - yRange.min;
    return padding.top + chartHeight - ((value - yRange.min) / range) * chartHeight + panOffset.y;
  }, [yRange, chartHeight, padding.top, panOffset.y]);

  const yToValue = useCallback((y: number): number => {
    const relY = (padding.top + chartHeight - y + panOffset.y) / chartHeight;
    return yRange.min + relY * (yRange.max - yRange.min);
  }, [yRange, chartHeight, padding.top, panOffset.y]);

  const prepareDataPoints = useCallback((records: OilTempRecord[]): Point[] => {
    return records
      .filter(r => {
        const minutes = parseTimeToMinutes(r.timestamp);
        const start = parseTimeToMinutes(chartRange.start);
        const end = parseTimeToMinutes(chartRange.end);
        let m = minutes;
        let s = start;
        let e = end;
        if (e < s) e += 24 * 60;
        if (m < s) m += 24 * 60;
        return m >= s && m <= e;
      })
      .sort((a, b) => parseTimeToMinutes(a.timestamp) - parseTimeToMinutes(b.timestamp))
      .map(r => ({
        x: timeToX(r.timestamp),
        y: valueToY(r.temperature),
        time: r.timestamp,
        value: r.temperature,
      }));
  }, [chartRange, timeToX, valueToY]);

  const prepareSupplementPoints = useCallback((points: SupplementPoint[]): Point[] => {
    return points
      .filter(p => {
        const minutes = parseTimeToMinutes(p.time);
        const start = parseTimeToMinutes(chartRange.start);
        const end = parseTimeToMinutes(chartRange.end);
        let m = minutes;
        let s = start;
        let e = end;
        if (e < s) e += 24 * 60;
        if (m < s) m += 24 * 60;
        return m >= s && m <= e;
      })
      .sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time))
      .map(p => ({
        x: timeToX(p.time),
        y: valueToY(p.temperature),
        time: p.time,
        value: p.temperature,
      }));
  }, [chartRange, timeToX, valueToY]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (e.shiftKey) {
      setIsPanning(true);
      setDragStart({ x, y });
    } else {
      setIsDragging(true);
      setDragStart({ x, y });
      setDragEnd({ x, y });
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isPanning && dragStart) {
      setPanOffset(prev => ({
        x: prev.x + (x - dragStart.x),
        y: prev.y + (y - dragStart.y),
      }));
      setDragStart({ x, y });
    } else if (isDragging) {
      setDragEnd({ x, y });
    }
  }, [isDragging, isPanning, dragStart]);

  const handleMouseUp = useCallback(() => {
    if (isDragging && dragStart && dragEnd) {
      const minX = Math.min(dragStart.x, dragEnd.x);
      const maxX = Math.max(dragStart.x, dragEnd.x);
      if (maxX - minX > 10) {
        const startTime = xToTime(minX);
        const endTime = xToTime(maxX);
        setChartRange({ start: startTime, end: endTime });
      }
    }
    setIsDragging(false);
    setIsPanning(false);
    setDragStart(null);
    setDragEnd(null);
  }, [isDragging, dragStart, dragEnd, xToTime, setChartRange]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoomLevel(prev => Math.min(Math.max(prev * delta, 0.5), 5));
  }, []);

  const findNearestPoint = useCallback((mouseX: number, mouseY: number, points: Point[]): Point | null => {
    let nearest: Point | null = null;
    let minDist = Infinity;
    for (const point of points) {
      const dist = Math.sqrt(Math.pow(mouseX - point.x, 2) + Math.pow(mouseY - point.y, 2));
      if (dist < 15 && dist < minDist) {
        minDist = dist;
        nearest = point;
      }
    }
    return nearest;
  }, []);

  const resetView = useCallback(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setChartRange({ start: '22:00', end: '06:00' });
  }, [setChartRange]);

  useEffect(() => {
    return () => {
      setIsDragging(false);
      setIsPanning(false);
      setDragStart(null);
      setDragEnd(null);
    };
  }, []);

  return {
    canvasRef,
    isDragging,
    isPanning,
    dragStart,
    dragEnd,
    hoveredPoint,
    setHoveredPoint,
    zoomLevel,
    setZoomLevel,
    panOffset,
    chartWidth,
    chartHeight,
    timeToX,
    xToTime,
    valueToY,
    yToValue,
    prepareDataPoints,
    prepareSupplementPoints,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    findNearestPoint,
    resetView,
  };
}
