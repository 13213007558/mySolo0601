import type { Zone, MeasurePoint, SlopeResult, Evidence, Suggestion, SuggestionVersion, RiskLevel } from '@/types';
import { getRiskLabel, getDrainageArrow, getDrainageLabel } from './slopeCalc';

interface ExportData {
  zone: Zone;
  points: MeasurePoint[];
  slopes: SlopeResult[];
  evidences: Evidence[];
  suggestion: Suggestion | undefined;
  versions: SuggestionVersion[];
  filteredRiskLevels: RiskLevel[];
}

export function generateExportHtml(data: ExportData): string {
  const { zone, points, slopes, evidences, suggestion, versions, filteredRiskLevels } = data;

  const filteredSlopes = slopes.filter((s) => filteredRiskLevels.length === 0 || filteredRiskLevels.includes(s.riskLevel));

  const criticalCount = filteredSlopes.filter((s) => s.riskLevel === 'critical').length;
  const warningCount = filteredSlopes.filter((s) => s.riskLevel === 'warning').length;
  const safeCount = filteredSlopes.filter((s) => s.riskLevel === 'safe').length;
  const emptyCount = points.filter((p) => p.elevationMm === null).length;

  const pointRows = points.map((p) => {
    const elev = p.elevationMm !== null ? `${p.elevationMm}mm` : '未录入';
    const supp = p.isSupplemented ? ' <span style="color:#F59E0B">[补录]</span>' : '';
    return `<tr><td><a name="point-${p.label}"></a>${p.label}</td><td>${elev}${supp}</td><td>${p.isSupplemented ? '是' : '否'}</td></tr>`;
  }).join('\n');

  const slopeRows = filteredSlopes.map((s) => {
    const color = s.riskLevel === 'critical' ? '#EF4444' : s.riskLevel === 'warning' ? '#F59E0B' : '#10B981';
    const supp = s.involvesSupplemented ? ' <span style="color:#F59E0B">[含补录]</span>' : '';
    return `<tr><td><a href="#point-${s.fromPoint}" style="color:#1B2A4A">${s.fromPoint}</a>→<a href="#point-${s.toPoint}" style="color:#1B2A4A">${s.toPoint}</a></td><td>${s.slopePercent}%</td><td style="color:${color}">${getRiskLabel(s.riskLevel)}${supp}</td></tr>`;
  }).join('\n');

  const evidenceRows = evidences.map((e) => {
    const supp = e.isSupplemented ? ' <span style="color:#F59E0B">[补录]</span>' : '';
    return `<tr><td>${new Date(e.timestamp).toLocaleDateString('zh-CN')}${supp}</td><td>${e.description}</td></tr>`;
  }).join('\n');

  const versionRows = versions.map((v) => {
    return `<div style="margin-bottom:12px;padding:10px;border-left:3px solid #64748B;background:#F8FAFC"><div style="font-size:12px;color:#64748B">v${v.versionNumber} · ${new Date(v.createdAt).toLocaleString('zh-CN')} · ${v.changeNote}</div><div style="white-space:pre-wrap;margin-top:4px">${v.content}</div></div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>屋面找坡排查摘要 - ${zone.name}</title>
<style>
body{font-family:'DM Sans',system-ui,sans-serif;max-width:900px;margin:0 auto;padding:24px;color:#1E293B;background:#fff}
h1{color:#1B2A4A;border-bottom:2px solid #1B2A4A;padding-bottom:8px}
h2{color:#334155;margin-top:32px}
table{width:100%;border-collapse:collapse;margin:12px 0}
th{background:#F1F5F9;text-align:left;padding:8px 12px;font-size:13px;color:#64748B;border-bottom:2px solid #E2E8F0}
td{padding:8px 12px;border-bottom:1px solid #E2E8F0;font-size:14px}
.risk-badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600}
a{color:#1B2A4A;text-decoration:none}
a:hover{text-decoration:underline}
.summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0}
.summary-card{padding:16px;border-radius:8px;text-align:center}
.summary-card .num{font-size:28px;font-weight:700}
.summary-card .label{font-size:12px;color:#64748B;margin-top:4px}
</style>
</head>
<body>
<h1>🏗 屋面找坡排查摘要</h1>
<div style="color:#64748B;font-size:14px;margin-bottom:16px">
  分区：${zone.name} · 排水方向：${getDrainageArrow(zone.drainageDirection)} ${getDrainageLabel(zone.drainageDirection)} · 最低坡度要求：${zone.minSlopePercent}% · 导出时间：${new Date().toLocaleString('zh-CN')}
</div>

<h2>📊 风险概览</h2>
<div class="summary-grid">
  <div class="summary-card" style="background:#FEF2F2"><div class="num" style="color:#EF4444">${criticalCount}</div><div class="label">严重不足</div></div>
  <div class="summary-card" style="background:#FFFBEB"><div class="num" style="color:#F59E0B">${warningCount}</div><div class="label">偏低</div></div>
  <div class="summary-card" style="background:#ECFDF5"><div class="num" style="color:#10B981">${safeCount}</div><div class="label">合格</div></div>
  <div class="summary-card" style="background:#F1F5F9"><div class="num" style="color:#64748B">${emptyCount}</div><div class="label">未录入</div></div>
</div>

<h2>📐 测点高程</h2>
<table>
<thead><tr><th>测点</th><th>高程(mm)</th><th>补录</th></tr></thead>
<tbody>${pointRows}</tbody>
</table>

<h2>📈 坡度分析${filteredRiskLevels.length > 0 ? `（筛选：${filteredRiskLevels.map(getRiskLabel).join('、')}）` : ''}</h2>
<table>
<thead><tr><th>区间</th><th>坡度</th><th>风险</th></tr></thead>
<tbody>${slopeRows || '<tr><td colspan="3" style="text-align:center;color:#94A3B8">无匹配数据</td></tr>'}</tbody>
</table>

<h2>🌧 雨后证据</h2>
<table>
<thead><tr><th>时间</th><th>描述</th></tr></thead>
<tbody>${evidenceRows || '<tr><td colspan="2" style="text-align:center;color:#94A3B8">暂无证据</td></tr>'}</tbody>
</table>

${suggestion ? `<h2>📝 返工建议（当前 v${versions.length}）</h2>
<div style="white-space:pre-wrap;padding:16px;background:#F8FAFC;border-radius:8px;border:1px solid #E2E8F0">${suggestion.currentContent}</div>

<h2>📜 建议版本历史</h2>
${versionRows}` : ''}

<div style="margin-top:48px;padding-top:16px;border-top:1px solid #E2E8F0;color:#94A3B8;font-size:12px;text-align:center">
  屋面找坡排查系统 · 本摘要由系统自动生成 · 测点编号可点击回溯至原文
</div>
</body>
</html>`;
}

export function downloadHtml(html: string, filename: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
