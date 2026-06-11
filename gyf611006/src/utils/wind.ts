import type { WindData, CorrectionFactors, CorrectedDistances, Distances, Direction } from '../types';
import { directionToAngle } from './distance';

const DEFAULT_FAN_ANGLE = 60;

export function normalizeAngle(angle: number): number {
  let result = angle % 360;
  if (result < 0) result += 360;
  return result;
}

export function angleDifference(angle1: number, angle2: number): number {
  let diff = Math.abs(angle1 - angle2) % 360;
  if (diff > 180) diff = 360 - diff;
  return diff;
}

export function getWindCorrectionFactor(windAngle: number, directionAngle: number): number {
  const diff = angleDifference(windAngle, directionAngle);

  if (diff <= 20) {
    return 1.8;
  } else if (diff <= 45) {
    return 1.5;
  } else if (diff <= 75) {
    return 1.2;
  } else if (diff <= 105) {
    return 1.0;
  } else if (diff <= 135) {
    return 0.85;
  } else if (diff <= 160) {
    return 0.65;
  } else {
    return 0.5;
  }
}

export function calculateCorrectedDistances(
  distances: Distances,
  windData: WindData
): CorrectedDistances {
  const directions: Direction[] = ['north', 'east', 'south', 'west'];
  
  const corrected: Record<Direction, number> = {
    north: 0,
    south: 0,
    east: 0,
    west: 0,
  };

  for (const dir of directions) {
    const dirAngle = directionToAngle(dir);
    const factor = getWindCorrectionFactor(windData.angle, dirAngle);
    corrected[dir] = Math.round(distances[dir] * factor);
  }

  const values = Object.values(corrected);
  const min = Math.min(...values);
  const average = Math.round(values.reduce((a, b) => a + b, 0) / 4);

  return {
    ...corrected,
    min,
    average,
  };
}

export function createInitialWindData(): WindData {
  return {
    angle: 0,
    speed: 2,
    fanAngle: DEFAULT_FAN_ANGLE,
  };
}

export function getCorrectionFactors(windData: WindData): CorrectionFactors {
  return {
    upwind: getWindCorrectionFactor(windData.angle, normalizeAngle(windData.angle + 180)),
    downwind: getWindCorrectionFactor(windData.angle, windData.angle),
    crosswind: getWindCorrectionFactor(windData.angle, normalizeAngle(windData.angle + 90)),
  };
}

export function calculateFanPoints(
  center: { x: number; y: number },
  radius: number,
  windAngle: number,
  fanAngle: number
): string {
  const startAngle = windAngle - fanAngle / 2;
  const endAngle = windAngle + fanAngle / 2;
  
  const startRad = (startAngle - 90) * (Math.PI / 180);
  const endRad = (endAngle - 90) * (Math.PI / 180);
  
  const x1 = center.x + radius * Math.cos(startRad);
  const y1 = center.y + radius * Math.sin(startRad);
  const x2 = center.x + radius * Math.cos(endRad);
  const y2 = center.y + radius * Math.sin(endRad);
  
  const largeArc = fanAngle > 180 ? 1 : 0;
  
  return `M ${center.x} ${center.y} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}
