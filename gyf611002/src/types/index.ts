export type Role = 'checker' | 'coach';

export interface User {
  id: string;
  username: string;
  password: string;
  role: Role;
  displayName: string;
}

export interface Suspension {
  startDate: string;
  endDate: string | null;
  reason: string;
  status: 'active' | 'ended';
}

export interface Athlete {
  id: string;
  name: string;
  country: string;
  flag: string;
  isuId: string;
  bladeQr: string;
  suspension: Suspension[];
}

export type WearLevel = 'normal' | 'mild' | 'moderate' | 'severe';

export const WEAR_META: Record<WearLevel, { label: string; color: string; ring: string; desc: string }> = {
  normal:   { label: '正常',   color: 'bg-emerald-500/900', ring: 'ring-emerald-400', desc: '刃口锋利，粗糙度 Ra≤0.2μm' },
  mild:     { label: '轻度',   color: 'bg-sky-500/900',  ring: 'ring-sky-400',  desc: '轻微起毛，可继续使用' },
  moderate: { label: '中度',   color: 'bg-amber-500/900', ring: 'ring-amber-400', desc: '刃口可见磨损，建议赛后重磨' },
  severe:   { label: '重度',   color: 'bg-rose-600/900',  ring: 'ring-rose-500',  desc: '明显崩口/卷刃，必须重磨后复测' }
};

export interface BladeCheck {
  id: string;
  athleteId: string;
  bladeQr: string;
  eventId: string;
  sessionId: string;
  angleLeft: number;
  angleRight: number;
  wear: WearLevel;
  checkerId: string;
  checkedAt: string;
  postponeTag: boolean;
  difference?: { left: number; right: number };
}

export interface EventSession {
  id: string;
  eventName: string;
  sessionName: string;
  startTime: string;
  lockMinutes: number;
  status: 'open' | 'locked' | 'finished';
}

export interface CalibrationParams {
  calibratedAt: string;
  corners: { tl: [number, number]; tr: [number, number]; bl: [number, number]; br: [number, number] };
  scale: number;
}
