import type { Point, DiamondMeasure, Distances, Direction } from '../types';

const PIXEL_TO_METER = 5;

export function calculateDistance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function pixelToMeter(pixels: number): number {
  return Math.round(pixels * PIXEL_TO_METER);
}

export function meterToPixel(meters: number): number {
  return meters / PIXEL_TO_METER;
}

export function calculateDiamondDistances(
  center: Point,
  northPt: Point,
  southPt: Point,
  eastPt: Point,
  westPt: Point
): Distances {
  const northPx = calculateDistance(center, northPt);
  const southPx = calculateDistance(center, southPt);
  const eastPx = calculateDistance(center, eastPt);
  const westPx = calculateDistance(center, westPt);

  const north = pixelToMeter(northPx);
  const south = pixelToMeter(southPx);
  const east = pixelToMeter(eastPx);
  const west = pixelToMeter(westPx);

  const values = [north, south, east, west];
  const average = Math.round(values.reduce((a, b) => a + b, 0) / 4);
  const min = Math.min(...values);
  const max = Math.max(...values);

  return { north, south, east, west, average, min, max };
}

export function createInitialDiamond(centerX: number, centerY: number, radiusPx: number = 60): DiamondMeasure {
  const center: Point = { x: centerX, y: centerY };
  const north = { x: centerX, y: centerY - radiusPx, direction: 'north' as Direction };
  const south = { x: centerX, y: centerY + radiusPx, direction: 'south' as Direction };
  const east = { x: centerX + radiusPx, y: centerY, direction: 'east' as Direction };
  const west = { x: centerX - radiusPx, y: centerY, direction: 'west' as Direction };

  const distances = calculateDiamondDistances(center, north, south, east, west);

  return { center, north, south, east, west, distances };
}

export function directionToAngle(direction: Direction): number {
  const angles: Record<Direction, number> = {
    north: 0,
    east: 90,
    south: 180,
    west: 270,
  };
  return angles[direction];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
