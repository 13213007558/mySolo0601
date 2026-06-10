import type { DuctZone, ElevationChange, FieldRemark, CoordIssue, ElevationUnit } from './types';
import { db, loadSampleData, clearAllData } from './db';

let zones = $state<DuctZone[]>([]);
let changes = $state<ElevationChange[]>([]);
let remarks = $state<FieldRemark[]>([]);
let issues = $state<CoordIssue[]>([]);
let selectedZoneId = $state<string | null>(null);
let elevationUnit = $state<ElevationUnit>('mm');
let dataLoaded = $state(false);
let loading = $state(false);
let exportModalOpen = $state(false);

let selectedZone = $derived<DuctZone | null>(zones.find(z => z.id === selectedZoneId) ?? null);
let selectedZoneChanges = $derived<ElevationChange[]>(changes.filter(c => c.zoneId === selectedZoneId).sort((a, b) => b.timestamp - a.timestamp));
let selectedZoneRemarks = $derived<FieldRemark[]>(remarks.filter(r => r.zoneId === selectedZoneId).sort((a, b) => b.timestamp - a.timestamp));
let selectedZoneIssues = $derived<CoordIssue[]>(issues.filter(i => i.zoneId === selectedZoneId).sort((a, b) => b.createdAt - a.createdAt));
let conflictZones = $derived(zones.filter(z => z.status === 'conflict'));
let openIssues = $derived(issues.filter(i => i.status !== 'resolved'));

export function getState() {
  return {
    get zones() { return zones; },
    get changes() { return changes; },
    get remarks() { return remarks; },
    get issues() { return issues; },
    get selectedZoneId() { return selectedZoneId; },
    get elevationUnit() { return elevationUnit; },
    get dataLoaded() { return dataLoaded; },
    get loading() { return loading; },
    get exportModalOpen() { return exportModalOpen; },
    get selectedZone() { return selectedZone; },
    get selectedZoneChanges() { return selectedZoneChanges; },
    get selectedZoneRemarks() { return selectedZoneRemarks; },
    get selectedZoneIssues() { return selectedZoneIssues; },
    get conflictZones() { return conflictZones; },
    get openIssues() { return openIssues; }
  };
}

export async function refreshData() {
  loading = true;
  try {
    zones = await db.zones.toArray();
    changes = await db.changes.toArray();
    remarks = await db.remarks.toArray();
    issues = await db.issues.toArray();
    dataLoaded = zones.length > 0;
  } finally {
    loading = false;
  }
}

export function selectZone(id: string | null) {
  selectedZoneId = id;
}

export function setElevationUnit(unit: ElevationUnit) {
  elevationUnit = unit;
}

export function setExportModalOpen(open: boolean) {
  exportModalOpen = open;
}

export async function loadSample() {
  loading = true;
  try {
    await loadSampleData();
    await refreshData();
    selectedZoneId = null;
  } finally {
    loading = false;
  }
}

export async function clearData() {
  loading = true;
  try {
    await clearAllData();
    zones = [];
    changes = [];
    remarks = [];
    issues = [];
    dataLoaded = false;
    selectedZoneId = null;
  } finally {
    loading = false;
  }
}

export async function updateZoneElevation(zoneId: string, newElevationMm: number, reason: string, operator: string) {
  const zone = await db.zones.get(zoneId);
  if (!zone) return;

  const oldElevationMm = zone.currentElevationMm;
  if (oldElevationMm === newElevationMm) return;

  const change: ElevationChange = {
    id: `chg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    zoneId,
    oldElevationMm,
    newElevationMm,
    reason,
    operator,
    timestamp: Date.now(),
    reverted: false
  };

  await db.changes.add(change);
  await db.zones.update(zoneId, {
    currentElevationMm: newElevationMm,
    updatedAt: Date.now()
  });

  await refreshData();
}

export async function revertChange(changeId: string) {
  const change = await db.changes.get(changeId);
  if (!change || change.reverted) return;

  await db.changes.update(changeId, { reverted: true });

  const revertChange: ElevationChange = {
    id: `chg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    zoneId: change.zoneId,
    oldElevationMm: change.newElevationMm,
    newElevationMm: change.oldElevationMm,
    reason: `撤回: ${change.reason}`,
    operator: change.operator,
    timestamp: Date.now(),
    reverted: false
  };

  await db.changes.add(revertChange);
  await db.zones.update(change.zoneId, {
    currentElevationMm: change.oldElevationMm,
    updatedAt: Date.now()
  });

  await refreshData();
}

export async function addRemark(zoneId: string, content: string, author: string, discipline: string) {
  const remark: FieldRemark = {
    id: `rmk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    zoneId,
    content,
    author,
    discipline,
    timestamp: Date.now()
  };

  await db.remarks.add(remark);
  await refreshData();
}

export async function resolveIssue(issueId: string) {
  await db.issues.update(issueId, {
    status: 'resolved',
    resolvedAt: Date.now()
  });

  const issue = await db.issues.get(issueId);
  if (issue) {
    await db.zones.update(issue.zoneId, {
      status: 'resolved',
      updatedAt: Date.now()
    });
  }

  await refreshData();
}
