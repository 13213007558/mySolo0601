<script lang="ts">
  import type { ElevationChange, DuctZone, ElevationUnit } from '$lib/types';
  import { formatElevation, formatElevationDiff } from '$lib/elevation';

  interface Props {
    changes: ElevationChange[];
    zones: DuctZone[];
    elevationUnit: ElevationUnit;
    onRevert: (changeId: string) => Promise<void>;
    onSelectZone: (zoneId: string) => void;
  }

  let { changes, zones, elevationUnit, onRevert, onSelectZone }: Props = $props();

  function getZoneName(zoneId: string): string {
    return zones.find(z => z.id === zoneId)?.name ?? zoneId;
  }

  function formatTime(ts: number): string {
    return new Date(ts).toLocaleString('zh-CN', {
      month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  }
</script>

<div class="version-history">
  <div class="vh-header">
    <h3>版本历史</h3>
    <span class="vh-count">{changes.length} 条记录</span>
  </div>

  {#if changes.length === 0}
    <div class="vh-empty">暂无变更记录</div>
  {:else}
    <div class="vh-timeline">
      {#each changes as change (change.id)}
        <div class="vh-item {change.reverted ? 'reverted' : ''}">
          <div class="vh-dot"></div>
          <div class="vh-body">
            <button class="vh-zone-link" onclick={() => onSelectZone(change.zoneId)}>
              {getZoneName(change.zoneId)}
            </button>
            <span class="vh-elev">
              {formatElevation(change.oldElevationMm, elevationUnit)}
              →
              {formatElevation(change.newElevationMm, elevationUnit)}
            </span>
            <span class="vh-diff">
              {formatElevationDiff(change.oldElevationMm, change.newElevationMm, elevationUnit)}
            </span>
            {#if change.reverted}
              <span class="vh-reverted">已撤回</span>
            {/if}
            <div class="vh-meta">
              <span>{change.operator}</span>
              <span>{formatTime(change.timestamp)}</span>
            </div>
            <div class="vh-reason">{change.reason}</div>
            {#if !change.reverted}
              <button class="vh-revert-btn" onclick={() => onRevert(change.id)}>撤回此次调整</button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .version-history {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
  }

  .vh-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid #f1f5f9;
  }

  .vh-header h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
  }

  .vh-count {
    font-size: 11px;
    color: #94a3b8;
  }

  .vh-empty {
    padding: 24px;
    text-align: center;
    color: #94a3b8;
    font-size: 13px;
  }

  .vh-timeline {
    padding: 12px 16px;
    max-height: 280px;
    overflow-y: auto;
  }

  .vh-item {
    display: flex;
    gap: 10px;
    position: relative;
    padding-bottom: 12px;
  }

  .vh-item:not(:last-child)::after {
    content: '';
    position: absolute;
    left: 5px;
    top: 14px;
    bottom: 0;
    width: 1px;
    background: #e2e8f0;
  }

  .vh-dot {
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: #2563eb;
    flex-shrink: 0;
    margin-top: 3px;
    border: 2px solid #dbeafe;
  }

  .reverted .vh-dot {
    background: #94a3b8;
    border-color: #e2e8f0;
  }

  .vh-body {
    flex: 1;
    min-width: 0;
  }

  .vh-zone-link {
    background: none;
    border: none;
    font-size: 13px;
    font-weight: 600;
    color: #2563eb;
    cursor: pointer;
    padding: 0;
    margin-right: 6px;
  }

  .vh-zone-link:hover { text-decoration: underline; }

  .vh-elev {
    font-size: 12px;
    color: #334155;
    font-variant-numeric: tabular-nums;
  }

  .vh-diff {
    font-size: 11px;
    color: #d97706;
    margin-left: 4px;
  }

  .vh-reverted {
    font-size: 10px;
    padding: 1px 6px;
    border-radius: 3px;
    background: #fee2e2;
    color: #dc2626;
    margin-left: 4px;
    font-weight: 500;
  }

  .vh-meta {
    display: flex;
    gap: 8px;
    font-size: 11px;
    color: #94a3b8;
    margin-top: 2px;
  }

  .vh-reason {
    font-size: 11px;
    color: #64748b;
    margin-top: 2px;
  }

  .vh-revert-btn {
    margin-top: 4px;
    padding: 2px 8px;
    font-size: 10px;
    background: none;
    border: 1px solid #fecaca;
    border-radius: 3px;
    color: #dc2626;
    cursor: pointer;
  }

  .vh-revert-btn:hover { background: #fee2e2; }
</style>
