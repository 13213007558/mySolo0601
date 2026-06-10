<script lang="ts">
  import type { DuctZone, ElevationUnit } from '$lib/types';
  import { formatElevation, formatElevationDiff } from '$lib/elevation';

  interface Props {
    zones: DuctZone[];
    selectedZoneId: string | null;
    elevationUnit: ElevationUnit;
    onSelect: (id: string) => void;
  }

  let { zones, selectedZoneId, elevationUnit, onSelect }: Props = $props();
</script>

<div class="plan-view">
  {#if zones.length === 0}
    <div class="empty-state">
      <div class="empty-icon">📐</div>
      <p>暂无风管排布数据</p>
      <p class="empty-hint">请点击「载入样例」加载数据</p>
    </div>
  {:else}
    <svg viewBox="0 0 620 320" class="plan-svg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e8e8e8" stroke-width="0.5"/>
        </pattern>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <rect width="620" height="320" fill="url(#grid)"/>

      <text x="310" y="16" text-anchor="middle" font-size="12" fill="#888">F3层 风管平面排布图</text>

      <line x1="20" y1="20" x2="20" y2="300" stroke="#ccc" stroke-width="1"/>
      <line x1="20" y1="300" x2="600" y2="300" stroke="#ccc" stroke-width="1"/>
      <text x="16" y="16" font-size="8" fill="#aaa">N</text>

      {#each zones as zone (zone.id)}
        {@const isSelected = zone.id === selectedZoneId}
        {@const isConflict = zone.status === 'conflict'}
        {@const isResolved = zone.status === 'resolved'}
        <g
          class="duct-zone {isSelected ? 'selected' : ''}"
          onclick={() => onSelect(zone.id)}
          role="button"
          tabindex="0"
          onkeydown={(e) => e.key === 'Enter' && onSelect(zone.id)}
        >
          <rect
            x={zone.x}
            y={zone.y}
            width={zone.width}
            height={zone.height}
            rx="3"
            fill={isConflict ? '#fee2e2' : isResolved ? '#dcfce7' : '#e0f2fe'}
            stroke={isSelected ? '#2563eb' : isConflict ? '#ef4444' : isResolved ? '#22c55e' : '#94a3b8'}
            stroke-width={isSelected ? 2.5 : 1.5}
            filter={isSelected ? 'url(#glow)' : ''}
          />
          <text
            x={zone.x + zone.width / 2}
            y={zone.y + zone.height / 2 - 4}
            text-anchor="middle"
            font-size="10"
            font-weight="600"
            fill="#334155"
          >
            {zone.name}
          </text>
          <text
            x={zone.x + zone.width / 2}
            y={zone.y + zone.height / 2 + 10}
            text-anchor="middle"
            font-size="8"
            fill="#64748b"
          >
            {formatElevation(zone.currentElevationMm, elevationUnit)}
          </text>
          {#if zone.currentElevationMm !== zone.originalElevationMm}
            <text
              x={zone.x + zone.width / 2}
              y={zone.y + zone.height / 2 + 20}
              text-anchor="middle"
              font-size="7"
              fill={isConflict ? '#ef4444' : '#f59e0b'}
            >
              {formatElevationDiff(zone.originalElevationMm, zone.currentElevationMm, elevationUnit)}
            </text>
          {/if}
          {#if isConflict}
            <circle cx={zone.x + zone.width - 6} cy={zone.y + 6} r="4" fill="#ef4444"/>
          {/if}
          {#if isResolved}
            <circle cx={zone.x + zone.width - 6} cy={zone.y + 6} r="4" fill="#22c55e"/>
          {/if}
        </g>
      {/each}

      <line x1="240" y1="25" x2="240" y2="295" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4 4"/>
      <line x1="400" y1="25" x2="400" y2="295" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4 4"/>
      <text x="130" y="308" text-anchor="middle" font-size="9" fill="#94a3b8">A区</text>
      <text x="320" y="308" text-anchor="middle" font-size="9" fill="#94a3b8">B区</text>
      <text x="510" y="308" text-anchor="middle" font-size="9" fill="#94a3b8">C区</text>
    </svg>
  {/if}
</div>

<style>
  .plan-view {
    background: #fafbfc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
    min-height: 320px;
  }

  .plan-svg {
    width: 100%;
    height: auto;
    display: block;
  }

  .duct-zone {
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .duct-zone:hover {
    opacity: 0.85;
  }

  .duct-zone:focus-visible rect {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 320px;
    color: #94a3b8;
  }

  .empty-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }

  .empty-state p {
    margin: 4px 0;
  }

  .empty-hint {
    font-size: 13px;
    color: #cbd5e1;
  }
</style>
