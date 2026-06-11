import { useRef, useCallback, useEffect } from 'react';
import type { Point } from '../types';

interface UseDragOptions {
  onDragStart?: (point: Point) => void;
  onDragMove?: (point: Point) => void;
  onDragEnd?: (point: Point) => void;
  getBounds?: () => { minX: number; maxX: number; minY: number; maxY: number };
}

export function useDrag(options: UseDragOptions = {}) {
  const isDragging = useRef(false);
  const containerRef = useRef<SVGSVGElement | HTMLDivElement | null>(null);

  const getSvgPoint = useCallback((clientX: number, clientY: number): Point | null => {
    if (!containerRef.current) return null;
    
    const svg = containerRef.current as SVGSVGElement;
    if (svg.createSVGPoint) {
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
      return { x: svgP.x, y: svgP.y };
    }
    
    const rect = svg.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    const point = getSvgPoint(clientX, clientY);
    if (!point) return;
    
    isDragging.current = true;
    options.onDragStart?.(point);
  }, [getSvgPoint, options]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging.current) return;
    
    let point = getSvgPoint(clientX, clientY);
    if (!point) return;
    
    if (options.getBounds) {
      const bounds = options.getBounds();
      point = {
        x: Math.max(bounds.minX, Math.min(bounds.maxX, point.x)),
        y: Math.max(bounds.minY, Math.min(bounds.maxY, point.y)),
      };
    }
    
    options.onDragMove?.(point);
  }, [getSvgPoint, options]);

  const handleEnd = useCallback((clientX: number, clientY: number) => {
    if (!isDragging.current) return;
    
    const point = getSvgPoint(clientX, clientY);
    isDragging.current = false;
    if (point) {
      options.onDragEnd?.(point);
    }
  }, [getSvgPoint, options]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const handleMouseUp = (e: MouseEvent) => handleEnd(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 1) {
        handleEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMove, handleEnd]);

  const bindMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  }, [handleStart]);

  const bindTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handleStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [handleStart]);

  return {
    containerRef,
    bindMouseDown,
    bindTouchStart,
    isDragging: isDragging.current,
  };
}
