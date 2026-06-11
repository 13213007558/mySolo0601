import type { EventSession } from '../types';

function futureISO(hoursFromNow: number): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() + hoursFromNow * 60);
  return d.toISOString();
}

export const SESSIONS: EventSession[] = [
  {
    id: 'sess-001',
    eventName: '2026 全国短道速滑冠军赛',
    sessionName: '女子 1500m 预赛 · 第 2 组',
    startTime: futureISO(2),
    lockMinutes: 30,
    status: 'open'
  },
  {
    id: 'sess-002',
    eventName: '2026 全国短道速滑冠军赛',
    sessionName: '男子 500m 初赛 · A 组',
    startTime: futureISO(26),
    lockMinutes: 30,
    status: 'open'
  }
];
