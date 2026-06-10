import Dexie, { type Table } from 'dexie';
import type { DuctZone, ElevationChange, FieldRemark, CoordIssue } from './types';

class DuctCoordDB extends Dexie {
  zones!: Table<DuctZone, string>;
  changes!: Table<ElevationChange, string>;
  remarks!: Table<FieldRemark, string>;
  issues!: Table<CoordIssue, string>;

  constructor() {
    super('DuctCoordDB');
    this.version(1).stores({
      zones: 'id, name, floorRef, status',
      changes: 'id, zoneId, timestamp, reverted',
      remarks: 'id, zoneId, timestamp',
      issues: 'id, zoneId, type, status, createdAt'
    });
  }
}

export const db = new DuctCoordDB();

export async function clearAllData() {
  await db.zones.clear();
  await db.changes.clear();
  await db.remarks.clear();
  await db.issues.clear();
}

export async function loadSampleData() {
  await clearAllData();
  const now = Date.now();

  const zones: DuctZone[] = [
    {
      id: 'zone-a1', name: 'A-1 主风管', x: 40, y: 30, width: 200, height: 40,
      floorRef: 'F3', originalElevationMm: 2800, currentElevationMm: 2650,
      ductSize: '800×400', affectedDisciplines: ['暖通', '装修'],
      status: 'conflict', createdAt: now - 86400000, updatedAt: now - 3600000
    },
    {
      id: 'zone-a2', name: 'A-2 支管', x: 260, y: 90, width: 120, height: 30,
      floorRef: 'F3', originalElevationMm: 2600, currentElevationMm: 2500,
      ductSize: '400×250', affectedDisciplines: ['暖通'],
      status: 'normal', createdAt: now - 86400000, updatedAt: now - 7200000
    },
    {
      id: 'zone-b1', name: 'B-1 回风管', x: 40, y: 180, width: 180, height: 50,
      floorRef: 'F3', originalElevationMm: 2700, currentElevationMm: 2550,
      ductSize: '630×400', affectedDisciplines: ['暖通', '电气'],
      status: 'conflict', createdAt: now - 86400000, updatedAt: now - 1800000
    },
    {
      id: 'zone-b2', name: 'B-2 排烟管', x: 260, y: 220, width: 140, height: 35,
      floorRef: 'F3', originalElevationMm: 2750, currentElevationMm: 2750,
      ductSize: '500×300', affectedDisciplines: ['暖通', '消防'],
      status: 'normal', createdAt: now - 86400000, updatedAt: now - 86400000
    },
    {
      id: 'zone-c1', name: 'C-1 新风管', x: 420, y: 30, width: 160, height: 35,
      floorRef: 'F3', originalElevationMm: 2900, currentElevationMm: 2700,
      ductSize: '500×250', affectedDisciplines: ['暖通', '装修', '给排水'],
      status: 'conflict', createdAt: now - 86400000, updatedAt: now - 900000
    },
    {
      id: 'zone-c2', name: 'C-2 补风管', x: 420, y: 180, width: 160, height: 30,
      floorRef: 'F3', originalElevationMm: 2650, currentElevationMm: 2600,
      ductSize: '400×200', affectedDisciplines: ['暖通'],
      status: 'resolved', createdAt: now - 86400000, updatedAt: now - 600000
    }
  ];

  const changes: ElevationChange[] = [
    {
      id: 'chg-1', zoneId: 'zone-a1', oldElevationMm: 2800, newElevationMm: 2650,
      reason: '装修吊顶高度从2.8m降至2.65m，风管需同步下调', operator: '张工',
      timestamp: now - 3600000, reverted: false
    },
    {
      id: 'chg-2', zoneId: 'zone-b1', oldElevationMm: 2700, newElevationMm: 2550,
      reason: '电气桥架标高2.6m，风管让路下调至2.55m', operator: '李工',
      timestamp: now - 1800000, reverted: false
    },
    {
      id: 'chg-3', zoneId: 'zone-c1', oldElevationMm: 2900, newElevationMm: 2700,
      reason: '给排水管线上移，风管从2.9m下调至2.7m让路', operator: '王工',
      timestamp: now - 900000, reverted: false
    },
    {
      id: 'chg-4', zoneId: 'zone-c2', oldElevationMm: 2650, newElevationMm: 2600,
      reason: '现场实测净高不足，微调50mm', operator: '张工',
      timestamp: now - 600000, reverted: false
    }
  ];

  const remarks: FieldRemark[] = [
    {
      id: 'rmk-1', zoneId: 'zone-a1', content: '吊顶变更通知单已下发，风管需在本周五前调整完毕',
      author: '张工', discipline: '装修', timestamp: now - 3000000
    },
    {
      id: 'rmk-2', zoneId: 'zone-b1', content: '电气桥架已先行安装，风管绕行方案已确认',
      author: '李工', discipline: '电气', timestamp: now - 1200000
    },
    {
      id: 'rmk-3', zoneId: 'zone-c1', content: '给排水管线已做保温，风管间距需≥150mm',
      author: '王工', discipline: '给排水', timestamp: now - 500000
    }
  ];

  const issues: CoordIssue[] = [
    {
      id: 'iss-1', zoneId: 'zone-a1', type: 'ceiling_change',
      title: '吊顶高度变更导致标高冲突',
      description: '装修专业将F3层吊顶高度从2.8m降至2.65m，A-1主风管原标高2.8m需同步下调',
      status: 'open', createdAt: now - 4000000, resolvedAt: null
    },
    {
      id: 'iss-2', zoneId: 'zone-b1', type: 'elevation_conflict',
      title: '电气桥架与风管标高冲突',
      description: 'B-1回风管标高2.7m与电气桥架2.6m空间冲突，需协调让路',
      status: 'in_progress', createdAt: now - 2500000, resolvedAt: null
    },
    {
      id: 'iss-3', zoneId: 'zone-c1', type: 'field_yield',
      title: '给排水管线先行施工让路',
      description: 'C-1新风管区域给排水管线已施工，风管需让路下调',
      status: 'open', createdAt: now - 1500000, resolvedAt: null
    },
    {
      id: 'iss-4', zoneId: 'zone-c2', type: 'field_yield',
      title: '现场净高不足微调',
      description: 'C-2补风管现场实测净高不足，微调50mm后已解决',
      status: 'resolved', createdAt: now - 800000, resolvedAt: now - 600000
    }
  ];

  await db.zones.bulkAdd(zones);
  await db.changes.bulkAdd(changes);
  await db.remarks.bulkAdd(remarks);
  await db.issues.bulkAdd(issues);
}
