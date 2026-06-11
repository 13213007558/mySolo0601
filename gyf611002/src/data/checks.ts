import type { BladeCheck, WearLevel } from '../types';
import { ATHLETES } from './athletes';

const SESS_ID = 'sess-001';
const EVT_ID = 'evt-championship-2026';

const r1 = (n: number) => Math.round(n * 10) / 10;
const rnd = (min: number, max: number) => min + Math.random() * (max - min);

function seedHistory(): BladeCheck[] {
  const list: BladeCheck[] = [];
  const pastSessions = ['sess-practice-jan', 'sess-practice-feb', 'sess-practice-mar'];
  const wearList: WearLevel[] = ['normal', 'mild', 'moderate', 'severe'];
  ATHLETES.forEach((a, idx) => {
    pastSessions.forEach((sid, i) => {
      if (Math.random() > 0.3 || i === 0) {
        list.push({
          id: `hc-${a.id}-${sid}`,
          athleteId: a.id,
          bladeQr: a.bladeQr,
          eventId: EVT_ID,
          sessionId: sid,
          angleLeft:  r1(rnd(86, 91)),
          angleRight: r1(rnd(85.5, 90)),
          wear: wearList[Math.min(3, Math.floor(Math.random() * (i + 1)))],
          checkerId: 'u-checker-01',
          checkedAt: new Date(Date.now() - (3 - i) * 86400000).toISOString(),
          postponeTag: false
        });
      }
    });
    if (idx % 3 === 0) {
      list.push({
        id: `cur-${a.id}-${SESS_ID}`,
        athleteId: a.id,
        bladeQr: a.bladeQr,
        eventId: EVT_ID,
        sessionId: SESS_ID,
        angleLeft:  r1(rnd(87, 90)),
        angleRight: r1(rnd(86.5, 89.5)),
        wear: wearList[idx % 4],
        checkerId: 'u-checker-01',
        checkedAt: new Date(Date.now() - 3600_000).toISOString(),
        postponeTag: false
      });
    }
  });
  return list;
}

export const INITIAL_CHECKS: BladeCheck[] = seedHistory();
export const CURRENT_SESSION_ID = SESS_ID;
export const CURRENT_EVENT_ID = EVT_ID;

export function lastCheckFor(
  athleteId: string, sessionId?: string, list: BladeCheck[] = INITIAL_CHECKS): BladeCheck | undefined {
  const filtered = list.filter(c => c.athleteId === athleteId && (!sessionId || c.sessionId !== sessionId));
  filtered.sort((a, b) => +new Date(b.checkedAt) - +new Date(a.checkedAt));
  return filtered[0];
}
