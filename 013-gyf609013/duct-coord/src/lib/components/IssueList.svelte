<script lang="ts">
  import type { CoordIssue, DuctZone, ElevationUnit } from '$lib/types';

  interface Props {
    issues: CoordIssue[];
    zones: DuctZone[];
    elevationUnit: ElevationUnit;
    onSelectZone: (zoneId: string) => void;
  }

  let { issues, zones, elevationUnit, onSelectZone }: Props = $props();

  const typeLabels: Record<string, string> = {
    elevation_conflict: '标高冲突',
    ceiling_change: '吊顶变更',
    field_yield: '现场让路',
    other: '其他'
  };

  const statusLabels: Record<string, string> = {
    open: '待处理',
    in_progress: '处理中',
    resolved: '已解决'
  };

  function getZoneName(zoneId: string): string {
    return zones.find(z => z.id === zoneId)?.name ?? zoneId;
  }
</script>

<div class="issue-list">
  <div class="issue-header">
    <h3>问题列表</h3>
    <span class="badge">{issues.length}</span>
  </div>

  {#if issues.length === 0}
    <div class="empty-list">
      <p>暂无协调问题</p>
    </div>
  {:else}
    <div class="issues">
      {#each issues as issue (issue.id)}
        <button class="issue-card status-{issue.status}" onclick={() => onSelectZone(issue.zoneId)}>
          <div class="issue-top">
            <span class="issue-type type-{issue.type}">{typeLabels[issue.type] ?? issue.type}</span>
            <span class="issue-status status-badge-{issue.status}">{statusLabels[issue.status]}</span>
          </div>
          <div class="issue-title">{issue.title}</div>
          <div class="issue-zone">📍 {getZoneName(issue.zoneId)}</div>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .issue-list {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    max-height: 400px;
  }

  .issue-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    border-bottom: 1px solid #f1f5f9;
  }

  .issue-header h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
  }

  .badge {
    background: #fee2e2;
    color: #dc2626;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 10px;
  }

  .empty-list {
    padding: 32px 16px;
    text-align: center;
    color: #94a3b8;
    font-size: 13px;
  }

  .issues {
    overflow-y: auto;
    flex: 1;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .issue-card {
    display: block;
    width: 100%;
    text-align: left;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 10px 12px;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
    font-family: inherit;
    color: inherit;
  }

  .issue-card:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }

  .issue-card.status-resolved {
    opacity: 0.65;
  }

  .issue-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  .issue-type {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 3px;
  }

  .type-elevation_conflict { background: #fef3c7; color: #92400e; }
  .type-ceiling_change { background: #dbeafe; color: #1e40af; }
  .type-field_yield { background: #fce7f3; color: #9d174d; }
  .type-other { background: #f1f5f9; color: #475569; }

  .issue-status {
    font-size: 10px;
    font-weight: 500;
    padding: 2px 6px;
    border-radius: 3px;
  }

  .status-badge-open { background: #fee2e2; color: #dc2626; }
  .status-badge-in_progress { background: #fef3c7; color: #d97706; }
  .status-badge-resolved { background: #dcfce7; color: #16a34a; }

  .issue-title {
    font-size: 13px;
    font-weight: 500;
    color: #1e293b;
    margin-bottom: 2px;
  }

  .issue-zone {
    font-size: 11px;
    color: #64748b;
  }
</style>
