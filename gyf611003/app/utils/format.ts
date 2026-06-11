export function formatTime(timestamp?: number) {
  if (!timestamp) return "--:--:--";
  const d = new Date(timestamp);
  return d.toLocaleTimeString("zh-CN", { hour12: false });
}

export function formatDateTime(timestamp?: number) {
  if (!timestamp) return "--";
  const d = new Date(timestamp);
  return d.toLocaleString("zh-CN", { hour12: false });
}

export function formatGps(lat?: number, lng?: number) {
  if (lat === undefined || lng === undefined) return "GPS 定位中…";
  const ns = lat >= 0 ? "N" : "S";
  const ew = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}°${ns}  ${Math.abs(lng).toFixed(4)}°${ew}`;
}

export function formatDepth(m: number) {
  return `${m.toFixed(1)}m`;
}

export function formatDurationMM(sec: number) {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s ? `${m}m${s}s` : `${m}min`;
}

export function generateTokenId() {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `SRF-${date}-${rand}`;
}

export function roleLabel(role: string) {
  return (
    {
      diver: "潜水员",
      instructor: "教练",
      support: "水面支援",
      admin: "管理员",
    } as Record<string, string>
  )[role] || role;
}

export function stepStatusLabel(s: string) {
  return (
    {
      locked: "未解锁",
      unlocked: "待到达",
      arrived: "已到达",
      counting: "倒计时中",
      diverSigned: "待教练副签",
      completed: "已完成",
      skipped: "紧急跳过",
    } as Record<string, string>
  )[s] || s;
}
