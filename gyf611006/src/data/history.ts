import type { HistoryRecord } from '../types';
import { createInitialDiamond } from '../utils/distance';

export const mockHistoryRecords: HistoryRecord[] = [
  {
    id: 'record-20240610-001',
    timestamp: Date.now() - 86400000 * 2,
    mode: 'real',
    location: '化工园区A区-3号储罐',
    leakSource: { x: 280, y: 290 },
    diamond: {
      ...createInitialDiamond(280, 290, 80),
    },
    wind: {
      angle: 45,
      speed: 3.5,
      fanAngle: 60,
    },
    correctedDistances: {
      north: 420,
      south: 380,
      east: 650,
      west: 320,
      min: 320,
      average: 443,
    },
    isCompliant: false,
  },
  {
    id: 'record-20240609-002',
    timestamp: Date.now() - 86400000 * 5,
    mode: 'drill',
    location: '化工园区B区-装卸区',
    leakSource: { x: 320, y: 280 },
    diamond: {
      ...createInitialDiamond(320, 280, 100),
    },
    wind: {
      angle: 180,
      speed: 2.0,
      fanAngle: 60,
    },
    correctedDistances: {
      north: 350,
      south: 700,
      east: 520,
      west: 510,
      min: 350,
      average: 520,
    },
    isCompliant: false,
  },
  {
    id: 'record-20240605-003',
    timestamp: Date.now() - 86400000 * 10,
    mode: 'real',
    location: '化工园区C区-泵房',
    leakSource: { x: 300, y: 310 },
    diamond: {
      ...createInitialDiamond(300, 310, 120),
    },
    wind: {
      angle: 270,
      speed: 5.0,
      fanAngle: 60,
    },
    correctedDistances: {
      north: 580,
      south: 590,
      east: 300,
      west: 900,
      min: 300,
      average: 593,
    },
    isCompliant: false,
  },
  {
    id: 'record-20240601-004',
    timestamp: Date.now() - 86400000 * 15,
    mode: 'drill',
    location: '化工园区A区-1号储罐',
    leakSource: { x: 290, y: 300 },
    diamond: {
      ...createInitialDiamond(290, 300, 140),
    },
    wind: {
      angle: 90,
      speed: 1.5,
      fanAngle: 60,
    },
    correctedDistances: {
      north: 650,
      south: 640,
      east: 950,
      west: 350,
      min: 350,
      average: 648,
    },
    isCompliant: false,
  },
];
