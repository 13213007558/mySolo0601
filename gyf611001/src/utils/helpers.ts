export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function speakScore(left: number, right: number): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const text = `${left} 比 ${right}`;
  try {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'zh-CN';
    utter.rate = 1.1;
    utter.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  } catch {
    /* noop */
  }
}

export function speakCard(type: 'yellow' | 'red' | 'black', side: 'left' | 'right'): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const map: Record<string, string> = {
    yellow: '黄牌',
    red: '红牌',
    black: '黑牌',
  };
  const sideText = side === 'left' ? '左方' : '右方';
  try {
    const utter = new SpeechSynthesisUtterance(`${sideText}${map[type]}`);
    utter.lang = 'zh-CN';
    utter.rate = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  } catch {
    /* noop */
  }
}

export function buildFIEXml(state: any): string {
  const now = new Date().toISOString();
  const builder: string[] = [];
  builder.push('<?xml version="1.0" encoding="UTF-8"?>');
  builder.push('<FIE_BOUT_RESULT xmlns="http://www.fie.org/schemas/bout/1.0">');
  builder.push(`  <BOUT_ID>${state.config?.id || uid()}</BOUT_ID>`);
  builder.push(`  <COMPETITION>${escapeXml(state.config?.competitionName || '')}</COMPETITION>`);
  builder.push(`  <EVENT>${escapeXml(state.config?.event || '')}</EVENT>`);
  builder.push(`  <ROUND>${escapeXml(state.config?.round || '')}</ROUND>`);
  builder.push(`  <STRIP>${state.config?.stripNumber || 1}</STRIP>`);
  builder.push(`  <STARTED_AT>${state.startedAt ? new Date(state.startedAt).toISOString() : now}</STARTED_AT>`);
  builder.push(`  <ENDED_AT>${state.endedAt ? new Date(state.endedAt).toISOString() : now}</ENDED_AT>`);
  builder.push('  <FENCERS>');
  builder.push('    <FENCER side="LEFT">');
  builder.push(`      <NAME>${escapeXml(state.config?.leftFencer?.name || 'Left')}</NAME>`);
  builder.push(`      <COUNTRY>${escapeXml(state.config?.leftFencer?.country || '')}</COUNTRY>`);
  builder.push(`      <FINAL_SCORE>${state.config?.leftFencer?.score || 0}</FINAL_SCORE>`);
  builder.push(`      <YELLOW_CARDS>${state.config?.leftFencer?.yellowCards || 0}</YELLOW_CARDS>`);
  builder.push(`      <RED_CARDS>${state.config?.leftFencer?.redCards || 0}</RED_CARDS>`);
  builder.push(`      <BLACK_CARD>${state.config?.leftFencer?.blackCard ? 1 : 0}</BLACK_CARD>`);
  builder.push('    </FENCER>');
  builder.push('    <FENCER side="RIGHT">');
  builder.push(`      <NAME>${escapeXml(state.config?.rightFencer?.name || 'Right')}</NAME>`);
  builder.push(`      <COUNTRY>${escapeXml(state.config?.rightFencer?.country || '')}</COUNTRY>`);
  builder.push(`      <FINAL_SCORE>${state.config?.rightFencer?.score || 0}</FINAL_SCORE>`);
  builder.push(`      <YELLOW_CARDS>${state.config?.rightFencer?.yellowCards || 0}</YELLOW_CARDS>`);
  builder.push(`      <RED_CARDS>${state.config?.rightFencer?.redCards || 0}</RED_CARDS>`);
  builder.push(`      <BLACK_CARD>${state.config?.rightFencer?.blackCard ? 1 : 0}</BLACK_CARD>`);
  builder.push('    </FENCER>');
  builder.push('  </FENCERS>');
  builder.push('  <TOUCHES>');
  (state.touches || []).forEach((t: any, i: number) => {
    builder.push(`    <TOUCH index="${i + 1}">`);
    builder.push(`      <TIMESTAMP>${new Date(t.timestamp).toISOString()}</TIMESTAMP>`);
    builder.push(`      <FENCER>${t.fencerId?.toUpperCase() || 'NONE'}</FENCER>`);
    builder.push(`      <TYPE>${t.type?.toUpperCase() || 'NO_TOUCH'}</TYPE>`);
    builder.push(`      <LIGHT>${t.lightColor?.toUpperCase() || 'NONE'}</LIGHT>`);
    if (t.note) builder.push(`      <NOTE>${escapeXml(t.note)}</NOTE>`);
    builder.push('    </TOUCH>');
  });
  builder.push('  </TOUCHES>');
  builder.push('  <CARDS>');
  (state.cards || []).forEach((c: any) => {
    builder.push('    <CARD>');
    builder.push(`      <TIMESTAMP>${new Date(c.timestamp).toISOString()}</TIMESTAMP>`);
    builder.push(`      <FENCER>${c.fencerId?.toUpperCase()}</FENCER>`);
    builder.push(`      <TYPE>${c.type?.toUpperCase()}</TYPE>`);
    if (c.reason) builder.push(`      <REASON>${escapeXml(c.reason)}</REASON>`);
    builder.push('    </CARD>');
  });
  builder.push('  </CARDS>');
  builder.push(`  <SEALED>${state.isSealed ? 1 : 0}</SEALED>`);
  if (state.sealedAt) builder.push(`  <SEALED_AT>${new Date(state.sealedAt).toISOString()}</SEALED_AT>`);
  builder.push('</FIE_BOUT_RESULT>');
  return builder.join('\n');
}

function escapeXml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
