<script lang="ts">
  import type { DuctZone, ElevationChange, FieldRemark, CoordIssue, ElevationUnit } from '$lib/types';
  import { formatElevation, formatElevationDiff } from '$lib/elevation';

  interface Props {
    zones: DuctZone[];
    changes: ElevationChange[];
    remarks: FieldRemark[];
    issues: CoordIssue[];
    elevationUnit: ElevationUnit;
    onClose: () => void;
  }

  let { zones, changes, remarks, issues, elevationUnit, onClose }: Props = $props();

  let copied = $state(false);

  const typeLabels: Record<string, string> = {
    elevation_conflict: '标高冲突',
    ceiling_change: '吊顶变更',
    field_yield: '现场让路',
    other: '其他'
  };

  function generateMinutesText(): string {
    const now = new Date();
    const dateStr = now.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });

    let text = `风管综合排布协调纪要\n`;
    text += `日期: ${dateStr}\n`;
    text += `${'='.repeat(40)}\n\n`;

    const conflictZones = zones.filter(z => z.status === 'conflict');
    const resolvedZones = zones.filter(z => z.status === 'resolved');

    text += `一、标高变更记录\n`;
    text += `${'-'.repeat(30)}\n`;
    if (changes.length === 0) {
      text += `  无变更记录\n`;
    } else {
      for (const c of changes) {
        const zone = zones.find(z => z.id === c.zoneId);
        const zoneName = zone?.name ?? c.zoneId;
        text += `\n  [${zoneName}] ${c.reverted ? '(已撤回)' : ''}\n`;
        text += `    调整前: ${formatElevation(c.oldElevationMm, elevationUnit)}\n`;
        text += `    调整后: ${formatElevation(c.newElevationMm, elevationUnit)}\n`;
        text += `    变化量: ${formatElevationDiff(c.oldElevationMm, c.newElevationMm, elevationUnit)}\n`;
        text += `    原因: ${c.reason}\n`;
        text += `    操作人: ${c.operator}\n`;
        text += `    时间: ${new Date(c.timestamp).toLocaleString('zh-CN')}\n`;
      }
    }

    text += `\n二、当前冲突区域\n`;
    text += `${'-'.repeat(30)}\n`;
    if (conflictZones.length === 0) {
      text += `  无冲突\n`;
    } else {
      for (const z of conflictZones) {
        text += `\n  [${z.name}] (${z.floorRef})\n`;
        text += `    原标高: ${formatElevation(z.originalElevationMm, elevationUnit)}\n`;
        text += `    现标高: ${formatElevation(z.currentElevationMm, elevationUnit)}\n`;
        text += `    规格: ${z.ductSize}\n`;
        text += `    影响专业: ${z.affectedDisciplines.join('、')}\n`;
      }
    }

    text += `\n三、协调问题\n`;
    text += `${'-'.repeat(30)}\n`;
    const openIssues = issues.filter(i => i.status !== 'resolved');
    if (openIssues.length === 0) {
      text += `  无待处理问题\n`;
    } else {
      for (const i of openIssues) {
        const zone = zones.find(z => z.id === i.zoneId);
        text += `\n  [${typeLabels[i.type] ?? i.type}] ${i.title}\n`;
        text += `    关联区域: ${zone?.name ?? i.zoneId}\n`;
        text += `    描述: ${i.description}\n`;
        text += `    状态: ${i.status === 'open' ? '待处理' : '处理中'}\n`;
      }
    }

    text += `\n四、现场备注\n`;
    text += `${'-'.repeat(30)}\n`;
    if (remarks.length === 0) {
      text += `  无备注\n`;
    } else {
      for (const r of remarks) {
        const zone = zones.find(z => z.id === r.zoneId);
        text += `\n  [${zone?.name ?? r.zoneId}]\n`;
        text += `    ${r.content}\n`;
        text += `    — ${r.author}(${r.discipline}) ${new Date(r.timestamp).toLocaleString('zh-CN')}\n`;
      }
    }

    text += `\n五、已解决问题\n`;
    text += `${'-'.repeat(30)}\n`;
    const resolvedIssues = issues.filter(i => i.status === 'resolved');
    if (resolvedIssues.length === 0) {
      text += `  无已解决问题\n`;
    } else {
      for (const i of resolvedIssues) {
        text += `  ✓ ${i.title}\n`;
      }
    }

    return text;
  }

  async function copyToClipboard() {
    const text = generateMinutesText();
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
      setTimeout(() => { copied = false; }, 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      copied = true;
      setTimeout(() => { copied = false; }, 2000);
    }
  }

  function downloadAsFile() {
    const text = generateMinutesText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `风管协调纪要_${dateStr}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleOverlayKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClose();
    }
  }

  function stopModalKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.stopPropagation();
    }
  }

  let minutesText = $derived(generateMinutesText());
</script>

{#if true}
  <div
    class="modal-overlay"
    role="button"
    tabindex="0"
    aria-label="关闭导出协调纪要"
    onclick={onClose}
    onkeydown={handleOverlayKeydown}
  >
    <div class="modal" role="dialog" aria-modal="true" tabindex="-1" onclick={(e) => e.stopPropagation()} onkeydown={stopModalKeydown}>
      <div class="modal-header">
        <h2>导出协调纪要</h2>
        <button class="close-btn" onclick={onClose}>✕</button>
      </div>

      <div class="modal-body">
        <pre class="minutes-preview">{minutesText}</pre>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" onclick={copyToClipboard}>
          {copied ? '✓ 已复制' : '复制到剪贴板'}
        </button>
        <button class="btn btn-primary" onclick={downloadAsFile}>
          下载文件
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 24px;
  }

  .modal {
    background: #fff;
    border-radius: 12px;
    width: 100%;
    max-width: 640px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #e2e8f0;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 18px;
    color: #94a3b8;
    cursor: pointer;
    padding: 4px 8px;
  }

  .close-btn:hover { color: #475569; }

  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
  }

  .minutes-preview {
    font-family: 'Menlo', 'Consolas', 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.6;
    color: #334155;
    white-space: pre-wrap;
    word-wrap: break-word;
    margin: 0;
    background: #f8fafc;
    padding: 16px;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
  }

  .modal-footer {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    padding: 12px 20px;
    border-top: 1px solid #e2e8f0;
  }

  .btn {
    padding: 8px 20px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: background 0.15s;
  }

  .btn-primary {
    background: #2563eb;
    color: #fff;
  }

  .btn-primary:hover { background: #1d4ed8; }

  .btn-secondary {
    background: #f1f5f9;
    color: #475569;
    border: 1px solid #e2e8f0;
  }

  .btn-secondary:hover { background: #e2e8f0; }
</style>
