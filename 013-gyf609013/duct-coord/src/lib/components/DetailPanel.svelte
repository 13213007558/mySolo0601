<script lang="ts">
  import type { DuctZone, ElevationChange, FieldRemark, CoordIssue, ElevationUnit } from '$lib/types';
  import { formatElevation, formatElevationDiff, mmToM, validateElevation, parseElevationInput } from '$lib/elevation';

  interface Props {
    zone: DuctZone | null;
    changes: ElevationChange[];
    remarks: FieldRemark[];
    issues: CoordIssue[];
    elevationUnit: ElevationUnit;
    onElevationUpdate: (zoneId: string, newMm: number, reason: string, operator: string) => Promise<void>;
    onAddRemark: (zoneId: string, content: string, author: string, discipline: string) => Promise<void>;
    onRevertChange: (changeId: string) => Promise<void>;
    onResolveIssue: (issueId: string) => Promise<void>;
  }

  let {
    zone, changes, remarks, issues, elevationUnit,
    onElevationUpdate, onAddRemark, onRevertChange, onResolveIssue
  }: Props = $props();

  let editingElevation = $state(false);
  let newElevationInput = $state('');
  let changeReason = $state('');
  let operatorName = $state('');
  let remarkContent = $state('');
  let remarkAuthor = $state('');
  let remarkDiscipline = $state('');
  let elevationWarning = $state('');
  let submitting = $state(false);

  function startEditElevation() {
    if (!zone) return;
    const currentVal = elevationUnit === 'mm'
      ? String(zone.currentElevationMm)
      : mmToM(zone.currentElevationMm).toFixed(3);
    newElevationInput = currentVal;
    changeReason = '';
    elevationWarning = '';
    editingElevation = true;
  }

  function cancelEdit() {
    editingElevation = false;
    newElevationInput = '';
    changeReason = '';
    elevationWarning = '';
  }

  function onElevationInput(value: string) {
    newElevationInput = value;
    const parsed = parseElevationInput(value);
    if (parsed !== null && zone) {
      const validation = validateElevation(parsed, zone.floorRef);
      elevationWarning = validation.warning ?? '';
    } else {
      elevationWarning = '';
    }
  }

  async function submitElevation() {
    if (!zone) return;
    const newMm = parseElevationInput(newElevationInput);
    if (newMm === null) return;
    if (!changeReason.trim()) return;
    if (!operatorName.trim()) return;

    submitting = true;
    try {
      await onElevationUpdate(zone.id, newMm, changeReason.trim(), operatorName.trim());
      editingElevation = false;
      newElevationInput = '';
      changeReason = '';
      elevationWarning = '';
    } finally {
      submitting = false;
    }
  }

  async function submitRemark() {
    if (!zone) return;
    if (!remarkContent.trim()) return;
    if (!remarkAuthor.trim()) return;

    submitting = true;
    try {
      await onAddRemark(zone.id, remarkContent.trim(), remarkAuthor.trim(), remarkDiscipline.trim() || '暖通');
      remarkContent = '';
      remarkAuthor = '';
      remarkDiscipline = '';
    } finally {
      submitting = false;
    }
  }

  function formatTime(ts: number): string {
    return new Date(ts).toLocaleString('zh-CN', {
      month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  }

  const statusLabels: Record<string, string> = {
    normal: '正常',
    conflict: '冲突',
    resolved: '已解决'
  };

  const typeLabels: Record<string, string> = {
    elevation_conflict: '标高冲突',
    ceiling_change: '吊顶变更',
    field_yield: '现场让路',
    other: '其他'
  };
</script>

<div class="detail-panel">
  {#if !zone}
    <div class="no-selection">
      <div class="no-sel-icon">🔍</div>
      <p>请在平面图中选择一个风管区域</p>
      <p class="no-sel-hint">选中后可查看标高详情、版本历史与协同备注</p>
    </div>
  {:else}
    <div class="detail-content">
      <div class="zone-header">
        <div class="zone-title-row">
          <h3>{zone.name}</h3>
          <span class="zone-status status-{zone.status}">{statusLabels[zone.status]}</span>
        </div>
        <div class="zone-meta">
          <span>楼层: {zone.floorRef}</span>
          <span>规格: {zone.ductSize}</span>
        </div>
      </div>

      <div class="elevation-section">
        <div class="elev-row">
          <div class="elev-item elev-original">
            <span class="elev-label">原标高</span>
            <span class="elev-value">{formatElevation(zone.originalElevationMm, elevationUnit)}</span>
          </div>
          <div class="elev-arrow">
            {#if zone.currentElevationMm !== zone.originalElevationMm}
              <span class="diff-badge">
                {formatElevationDiff(zone.originalElevationMm, zone.currentElevationMm, elevationUnit)}
              </span>
            {:else}
              —
            {/if}
          </div>
          <div class="elev-item elev-current">
            <span class="elev-label">现标高</span>
            <span class="elev-value">{formatElevation(zone.currentElevationMm, elevationUnit)}</span>
          </div>
        </div>
        <div class="affected-disciplines">
          <span class="disc-label">影响专业:</span>
          {#each zone.affectedDisciplines as d}
            <span class="disc-tag">{d}</span>
          {/each}
        </div>
        {#if !editingElevation}
          <button class="btn btn-primary" onclick={startEditElevation}>调整标高</button>
        {:else}
          <div class="edit-form">
            <div class="form-row">
              <label for="new-elevation">新标高 ({elevationUnit})</label>
              <input
                id="new-elevation"
                type="text"
                value={newElevationInput}
                oninput={(e) => onElevationInput(e.currentTarget.value)}
                placeholder={elevationUnit === 'mm' ? '如 2600 或 +2600' : '如 2.600 或 +2.600m'}
              />
              {#if elevationWarning}
                <span class="warning-text">⚠ {elevationWarning}</span>
              {/if}
            </div>
            <div class="form-row">
              <label for="change-reason">调整原因</label>
              <input id="change-reason" type="text" bind:value={changeReason} placeholder="如：吊顶高度变更" />
            </div>
            <div class="form-row">
              <label for="operator-name">操作人</label>
              <input id="operator-name" type="text" bind:value={operatorName} placeholder="如：张工" />
            </div>
            <div class="form-actions">
              <button class="btn btn-primary" onclick={submitElevation} disabled={submitting || !changeReason.trim() || !operatorName.trim()}>
                {submitting ? '提交中...' : '确认调整'}
              </button>
              <button class="btn btn-ghost" onclick={cancelEdit}>取消</button>
            </div>
          </div>
        {/if}
      </div>

      {#if issues.length > 0}
        <div class="section">
          <h4>关联问题</h4>
          {#each issues as issue (issue.id)}
            <div class="issue-row">
              <span class="issue-type-badge type-{issue.type}">{typeLabels[issue.type]}</span>
              <span class="issue-title-text">{issue.title}</span>
              {#if issue.status !== 'resolved'}
                <button class="btn btn-xs" onclick={() => onResolveIssue(issue.id)}>标记解决</button>
              {:else}
                <span class="resolved-tag">✓ 已解决</span>
              {/if}
            </div>
          {/each}
        </div>
      {/if}

      <div class="section">
        <h4>版本历史</h4>
        {#if changes.length === 0}
          <p class="empty-text">暂无变更记录</p>
        {:else}
          <div class="change-list">
            {#each changes as change (change.id)}
              <div class="change-item {change.reverted ? 'reverted' : ''}">
                <div class="change-main">
                  <span class="change-elev">
                    {formatElevation(change.oldElevationMm, elevationUnit)}
                    →
                    {formatElevation(change.newElevationMm, elevationUnit)}
                    <span class="change-diff">
                      ({formatElevationDiff(change.oldElevationMm, change.newElevationMm, elevationUnit)})
                    </span>
                  </span>
                  <span class="change-meta">
                    {change.operator} · {formatTime(change.timestamp)}
                  </span>
                  {#if change.reverted}
                    <span class="reverted-badge">已撤回</span>
                  {/if}
                </div>
                <div class="change-reason">{change.reason}</div>
                {#if !change.reverted}
                  <button class="btn btn-xs btn-revert" onclick={() => onRevertChange(change.id)}>
                    撤回
                  </button>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <div class="section">
        <h4>现场备注</h4>
        <div class="remark-form">
          <input type="text" bind:value={remarkContent} placeholder="备注内容" class="remark-input" />
          <div class="remark-meta-row">
            <input type="text" bind:value={remarkAuthor} placeholder="姓名" class="remark-short" />
            <input type="text" bind:value={remarkDiscipline} placeholder="专业" class="remark-short" />
            <button class="btn btn-xs" onclick={submitRemark} disabled={submitting || !remarkContent.trim() || !remarkAuthor.trim()}>
              添加
            </button>
          </div>
        </div>
        {#if remarks.length > 0}
          <div class="remark-list">
            {#each remarks as remark (remark.id)}
              <div class="remark-item">
                <div class="remark-content">{remark.content}</div>
                <div class="remark-meta">{remark.author} · {remark.discipline} · {formatTime(remark.timestamp)}</div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .detail-panel {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    max-height: 600px;
    overflow-y: auto;
  }

  .no-selection {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    color: #94a3b8;
    text-align: center;
  }

  .no-sel-icon { font-size: 40px; margin-bottom: 12px; }
  .no-sel-hint { font-size: 12px; color: #cbd5e1; margin-top: 4px; }

  .detail-content {
    padding: 16px;
  }

  .zone-header {
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f1f5f9;
  }

  .zone-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  .zone-title-row h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
  }

  .zone-status {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 10px;
  }

  .status-normal { background: #dcfce7; color: #16a34a; }
  .status-conflict { background: #fee2e2; color: #dc2626; }
  .status-resolved { background: #dbeafe; color: #2563eb; }

  .zone-meta {
    display: flex;
    gap: 16px;
    font-size: 12px;
    color: #64748b;
  }

  .elevation-section {
    background: #f8fafc;
    border-radius: 6px;
    padding: 12px;
    margin-bottom: 16px;
  }

  .elev-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
  }

  .elev-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
  }

  .elev-label {
    font-size: 11px;
    color: #94a3b8;
    margin-bottom: 2px;
  }

  .elev-value {
    font-size: 18px;
    font-weight: 700;
    color: #1e293b;
    font-variant-numeric: tabular-nums;
  }

  .elev-original .elev-value { color: #64748b; }
  .elev-current .elev-value { color: #2563eb; }

  .elev-arrow {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .diff-badge {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 10px;
    background: #fef3c7;
    color: #d97706;
  }

  .affected-disciplines {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }

  .disc-label {
    font-size: 11px;
    color: #94a3b8;
  }

  .disc-tag {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 10px;
    background: #e0f2fe;
    color: #0369a1;
  }

  .edit-form {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;
  }

  .form-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .form-row label {
    font-size: 11px;
    color: #64748b;
    font-weight: 500;
  }

  .form-row input {
    padding: 6px 10px;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    font-size: 13px;
    outline: none;
    transition: border-color 0.15s;
  }

  .form-row input:focus {
    border-color: #2563eb;
  }

  .warning-text {
    font-size: 11px;
    color: #d97706;
  }

  .form-actions {
    display: flex;
    gap: 8px;
    margin-top: 4px;
  }

  .btn {
    padding: 6px 14px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: background 0.15s, opacity 0.15s;
  }

  .btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-primary {
    background: #2563eb;
    color: #fff;
  }

  .btn-primary:hover:not(:disabled) { background: #1d4ed8; }

  .btn-ghost {
    background: transparent;
    color: #64748b;
    border: 1px solid #e2e8f0;
  }

  .btn-ghost:hover { background: #f1f5f9; }

  .btn-xs {
    padding: 3px 8px;
    font-size: 11px;
    border-radius: 3px;
    background: #f1f5f9;
    color: #475569;
    border: 1px solid #e2e8f0;
  }

  .btn-xs:hover { background: #e2e8f0; }

  .btn-revert {
    color: #dc2626;
    border-color: #fecaca;
  }

  .btn-revert:hover { background: #fee2e2; }

  .section {
    margin-bottom: 16px;
  }

  .section h4 {
    margin: 0 0 8px 0;
    font-size: 13px;
    font-weight: 600;
    color: #475569;
  }

  .issue-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
    font-size: 12px;
  }

  .issue-type-badge {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 3px;
    font-weight: 500;
  }

  .type-elevation_conflict { background: #fef3c7; color: #92400e; }
  .type-ceiling_change { background: #dbeafe; color: #1e40af; }
  .type-field_yield { background: #fce7f3; color: #9d174d; }

  .issue-title-text {
    flex: 1;
    color: #334155;
  }

  .resolved-tag {
    font-size: 11px;
    color: #16a34a;
    font-weight: 500;
  }

  .empty-text {
    font-size: 12px;
    color: #94a3b8;
    margin: 0;
  }

  .change-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .change-item {
    position: relative;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    padding: 8px 10px;
  }

  .change-item.reverted {
    background: #fef2f2;
    border-color: #fecaca;
  }

  .change-main {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .change-elev {
    font-size: 12px;
    font-weight: 600;
    color: #1e293b;
    font-variant-numeric: tabular-nums;
  }

  .change-diff {
    font-weight: 400;
    color: #d97706;
    font-size: 11px;
  }

  .change-meta {
    font-size: 11px;
    color: #94a3b8;
  }

  .reverted-badge {
    font-size: 10px;
    padding: 1px 6px;
    border-radius: 3px;
    background: #fee2e2;
    color: #dc2626;
    font-weight: 500;
  }

  .change-reason {
    font-size: 11px;
    color: #64748b;
    margin-top: 4px;
  }

  .remark-form {
    margin-bottom: 8px;
  }

  .remark-input {
    width: 100%;
    padding: 6px 10px;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    font-size: 12px;
    outline: none;
    box-sizing: border-box;
    margin-bottom: 4px;
  }

  .remark-input:focus { border-color: #2563eb; }

  .remark-meta-row {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  .remark-short {
    width: 70px;
    padding: 4px 8px;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    font-size: 11px;
    outline: none;
  }

  .remark-short:focus { border-color: #2563eb; }

  .remark-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .remark-item {
    background: #f8fafc;
    border-radius: 4px;
    padding: 6px 10px;
  }

  .remark-content {
    font-size: 12px;
    color: #334155;
  }

  .remark-meta {
    font-size: 10px;
    color: #94a3b8;
    margin-top: 2px;
  }
</style>
