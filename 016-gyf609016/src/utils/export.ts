import type { StoneRecord, PhotoAttachment } from '@/types';

export function exportPavingSuggestion(stones: StoneRecord[], photosMap: Record<string, PhotoAttachment[]>) {
  const lines: string[] = [];
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  lines.push('外立面石材铺贴建议书');
  lines.push(`生成日期：${dateStr}`);
  lines.push('');

  const byZone = new Map<string, StoneRecord[]>();
  for (const s of stones) {
    const zone = s.facadeZone;
    if (!byZone.has(zone)) byZone.set(zone, []);
    byZone.get(zone)!.push(s);
  }

  const problemStones: StoneRecord[] = [];
  const normalStones: StoneRecord[] = [];

  for (const s of stones) {
    const photos = photosMap[s.id] || [];
    const hasMissing = photos.some((p) => p.isMissing);
    const isProblem = s.wallStatus === 'conflict' || s.wallStatus === 'pending' || s.colorGrade === 'D' || hasMissing;
    if (isProblem) problemStones.push(s);
    else normalStones.push(s);
  }

  lines.push('一、分区铺贴统计');
  lines.push('');
  for (const [zone, zoneStones] of byZone) {
    const canWall = zoneStones.filter((s) => !problemStones.includes(s)).length;
    const cannotWall = zoneStones.filter((s) => problemStones.includes(s)).length;
    lines.push(`【${zone}】 共${zoneStones.length}块，可上墙${canWall}块，问题石材${cannotWall}块`);
    for (const s of zoneStones) {
      const photos = photosMap[s.id] || [];
      const hasMissing = photos.some((p) => p.isMissing);
      const status = problemStones.includes(s) ? '⚠ 问题' : '✓ 正常';
      const missing = hasMissing ? ' [缺照片]' : '';
      lines.push(`  - ${s.stoneNo} | 批次${s.batchNo} | 色差${s.colorGrade} | ${status}${missing}`);
    }
    lines.push('');
  }

  lines.push('二、问题石材汇总');
  lines.push('');
  if (problemStones.length === 0) {
    lines.push('当前筛选范围内无问题石材。');
  } else {
    for (const s of problemStones) {
      const photos = photosMap[s.id] || [];
      const hasMissing = photos.some((p) => p.isMissing);
      const reasons: string[] = [];
      if (s.wallStatus === 'conflict') reasons.push('分区冲突');
      if (s.wallStatus === 'pending') reasons.push('待确认');
      if (s.colorGrade === 'D') reasons.push('严重色差');
      if (hasMissing) reasons.push('照片缺失');
      lines.push(`${s.stoneNo} | 批次${s.batchNo} | 分区${s.facadeZone} | 色差${s.colorGrade} | 问题：${reasons.join('、')}`);
    }
  }
  lines.push('');

  lines.push('三、统计摘要');
  lines.push('');
  lines.push(`总石材数：${stones.length}`);
  lines.push(`可正常上墙：${normalStones.length}`);
  lines.push(`问题石材：${problemStones.length}`);
  lines.push(`色差A/B/C/D：${stones.filter(s=>s.colorGrade==='A').length}/${stones.filter(s=>s.colorGrade==='B').length}/${stones.filter(s=>s.colorGrade==='C').length}/${stones.filter(s=>s.colorGrade==='D').length}`);

  return lines.join('\n');
}

export function downloadAsFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
