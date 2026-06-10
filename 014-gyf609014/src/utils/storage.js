const STORAGE_KEY = 'mech_hole_inspection_data';
const META_KEY = 'mech_hole_inspection_meta';

export function getAllHoles() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('读取本地存储失败:', e);
    return [];
  }
}

export function saveAllHoles(holes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(holes));
    return true;
  } catch (e) {
    console.error('保存本地存储失败:', e);
    return false;
  }
}

export function getHoleById(id) {
  const holes = getAllHoles();
  return holes.find(h => h.id === id) || null;
}

export function addHole(hole) {
  const holes = getAllHoles();
  const newHole = {
    ...hole,
    id: hole.id || generateId(),
    createdAt: hole.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  holes.push(newHole);
  saveAllHoles(holes);
  return newHole;
}

export function updateHole(id, updates) {
  const holes = getAllHoles();
  const index = holes.findIndex(h => h.id === id);
  if (index === -1) return null;

  holes[index] = {
    ...holes[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  saveAllHoles(holes);
  return holes[index];
}

export function deleteHole(id) {
  const holes = getAllHoles();
  const filtered = holes.filter(h => h.id !== id);
  saveAllHoles(filtered);
  return filtered.length !== holes.length;
}

export function addRepairApplication(holeId, application) {
  const hole = getHoleById(holeId);
  if (!hole) return null;

  const repairApps = hole.repairApplications || [];
  const newApp = {
    ...application,
    id: generateId(),
    createdAt: new Date().toISOString(),
    status: 'pending'
  };

  repairApps.push(newApp);

  const latestStatus = getLatestStatus(repairApps);

  return updateHole(holeId, {
    repairApplications: repairApps,
    status: latestStatus
  });
}

export function reviewRepairApplication(holeId, appId, decision) {
  const hole = getHoleById(holeId);
  if (!hole) return null;

  const repairApps = hole.repairApplications || [];
  const appIndex = repairApps.findIndex(a => a.id === appId);
  if (appIndex === -1) return null;

  repairApps[appIndex] = {
    ...repairApps[appIndex],
    status: decision.status,
    reviewComment: decision.comment,
    reviewedAt: new Date().toISOString(),
    reviewedBy: decision.reviewedBy || '审核员'
  };

  if (decision.supplemental) {
    repairApps[appIndex].supplemental = decision.supplemental;
    repairApps[appIndex].supplementedAt = new Date().toISOString();
  }

  const latestStatus = getLatestStatus(repairApps);

  return updateHole(holeId, {
    repairApplications: repairApps,
    status: latestStatus
  });
}

function getLatestStatus(repairApps) {
  if (!repairApps || repairApps.length === 0) return null;

  const latest = repairApps[repairApps.length - 1];
  return latest.status;
}

export function generateId() {
  return 'hole_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

export function getMeta() {
  try {
    const data = localStorage.getItem(META_KEY);
    return data ? JSON.parse(data) : { initialized: false };
  } catch {
    return { initialized: false };
  }
}

export function setMeta(meta) {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
    return true;
  } catch {
    return false;
  }
}

export function getFloors() {
  const holes = getAllHoles();
  const floors = new Set(holes.map(h => h.floor).filter(Boolean));
  return Array.from(floors).sort();
}

export function getProfessions() {
  const holes = getAllHoles();
  const professions = new Set(holes.map(h => h.profession).filter(Boolean));
  return Array.from(professions).sort();
}

export function exportData() {
  const holes = getAllHoles();
  const meta = getMeta();
  return {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    meta,
    holes
  };
}

export function importData(data) {
  if (!data || !data.holes) return false;
  try {
    saveAllHoles(data.holes);
    if (data.meta) {
      setMeta(data.meta);
    }
    return true;
  } catch {
    return false;
  }
}
