<script lang="ts">
  import { onMount } from 'svelte';
  import {
    getState, refreshData, selectZone, setElevationUnit,
    loadSample, clearData, updateZoneElevation, revertChange,
    addRemark, resolveIssue, setExportModalOpen
  } from '$lib/stores.svelte';
  import PlanView from '$lib/components/PlanView.svelte';
  import IssueList from '$lib/components/IssueList.svelte';
  import DetailPanel from '$lib/components/DetailPanel.svelte';
  import VersionHistory from '$lib/components/VersionHistory.svelte';
  import ExportPanel from '$lib/components/ExportPanel.svelte';

  const state = getState();

  onMount(() => {
    refreshData();
  });
</script>

<div class="app">
  <header class="app-header">
    <div class="header-left">
      <h1 class="app-title">风管综合排布协同</h1>
      <span class="header-subtitle">HVAC Duct Coordination</span>
    </div>
    <div class="header-actions">
      <div class="unit-toggle">
        <button
          class="toggle-btn {state.elevationUnit === 'mm' ? 'active' : ''}"
          onclick={() => setElevationUnit('mm')}
        >mm</button>
        <button
          class="toggle-btn {state.elevationUnit === 'm' ? 'active' : ''}"
          onclick={() => setElevationUnit('m')}
        >m</button>
      </div>
      <button class="action-btn" onclick={loadSample} disabled={state.loading}>
        载入样例
      </button>
      <button class="action-btn danger" onclick={clearData} disabled={state.loading || !state.dataLoaded}>
        清空数据
      </button>
      <button
        class="action-btn primary"
        onclick={() => setExportModalOpen(true)}
        disabled={!state.dataLoaded}
      >
        导出纪要
      </button>
    </div>
  </header>

  {#if !state.dataLoaded && !state.loading}
    <div class="welcome">
      <div class="welcome-card">
        <div class="welcome-icon">🏗️</div>
        <h2>风管综合排布协同系统</h2>
        <p>用于暖通工程师核对风管排布、标高调整和现场让路记录</p>
        <div class="welcome-features">
          <div class="feature">
            <span class="feat-icon">📐</span>
            <span>平面定位区 — 可视化风管排布与区域选择</span>
          </div>
          <div class="feature">
            <span class="feat-icon">📏</span>
            <span>标高管理 — 原标高/新标高对比、mm/m切换、负标高支持</span>
          </div>
          <div class="feature">
            <span class="feat-icon">🔄</span>
            <span>版本历史 — 调整记录与撤回，前后差异一目了然</span>
          </div>
          <div class="feature">
            <span class="feat-icon">📝</span>
            <span>协同备注 — 多专业现场备注与问题跟踪</span>
          </div>
          <div class="feature">
            <span class="feat-icon">📄</span>
            <span>导出纪要 — 一键生成协调纪要，含前后差异对比</span>
          </div>
        </div>
        <button class="start-btn" onclick={loadSample} disabled={state.loading}>
          载入样例数据开始体验
        </button>
      </div>
    </div>
  {:else if state.loading}
    <div class="loading">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>
  {:else}
    <div class="main-content">
      <div class="left-panel">
        <PlanView
          zones={state.zones}
          selectedZoneId={state.selectedZoneId}
          elevationUnit={state.elevationUnit}
          onSelect={selectZone}
        />
        <VersionHistory
          changes={state.changes}
          zones={state.zones}
          elevationUnit={state.elevationUnit}
          onRevert={revertChange}
          onSelectZone={selectZone}
        />
      </div>
      <div class="right-panel">
        <IssueList
          issues={state.issues}
          zones={state.zones}
          elevationUnit={state.elevationUnit}
          onSelectZone={selectZone}
        />
        <DetailPanel
          zone={state.selectedZone}
          changes={state.selectedZoneChanges}
          remarks={state.selectedZoneRemarks}
          issues={state.selectedZoneIssues}
          elevationUnit={state.elevationUnit}
          onElevationUpdate={updateZoneElevation}
          onAddRemark={addRemark}
          onRevertChange={revertChange}
          onResolveIssue={resolveIssue}
        />
      </div>
    </div>
  {/if}

  {#if state.exportModalOpen}
    <ExportPanel
      zones={state.zones}
      changes={state.changes}
      remarks={state.remarks}
      issues={state.issues}
      elevationUnit={state.elevationUnit}
      onClose={() => setExportModalOpen(false)}
    />
  {/if}
</div>

<style>
  .app {
    min-height: 100vh;
    background: #f1f5f9;
  }

  .app-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 24px;
    background: #fff;
    border-bottom: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .header-left {
    display: flex;
    align-items: baseline;
    gap: 10px;
  }

  .app-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #0f172a;
  }

  .header-subtitle {
    font-size: 12px;
    color: #94a3b8;
    font-weight: 400;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .unit-toggle {
    display: flex;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    overflow: hidden;
  }

  .toggle-btn {
    padding: 4px 12px;
    font-size: 12px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    background: #fff;
    color: #64748b;
    transition: all 0.15s;
  }

  .toggle-btn.active {
    background: #2563eb;
    color: #fff;
  }

  .toggle-btn:hover:not(.active) {
    background: #f1f5f9;
  }

  .action-btn {
    padding: 6px 16px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #475569;
    transition: all 0.15s;
  }

  .action-btn:hover:not(:disabled) { background: #f8fafc; }
  .action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .action-btn.primary {
    background: #2563eb;
    color: #fff;
    border-color: #2563eb;
  }

  .action-btn.primary:hover:not(:disabled) { background: #1d4ed8; }

  .action-btn.danger {
    color: #dc2626;
    border-color: #fecaca;
  }

  .action-btn.danger:hover:not(:disabled) { background: #fef2f2; }

  .welcome {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px 24px;
  }

  .welcome-card {
    background: #fff;
    border-radius: 12px;
    padding: 40px;
    max-width: 520px;
    text-align: center;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  }

  .welcome-icon {
    font-size: 56px;
    margin-bottom: 16px;
  }

  .welcome-card h2 {
    margin: 0 0 8px 0;
    font-size: 22px;
    font-weight: 700;
    color: #0f172a;
  }

  .welcome-card > p {
    margin: 0 0 24px 0;
    color: #64748b;
    font-size: 14px;
  }

  .welcome-features {
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 28px;
  }

  .feature {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: #475569;
  }

  .feat-icon {
    font-size: 18px;
    flex-shrink: 0;
  }

  .start-btn {
    padding: 12px 32px;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    background: #2563eb;
    color: #fff;
    transition: background 0.15s;
  }

  .start-btn:hover:not(:disabled) { background: #1d4ed8; }
  .start-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px;
    color: #94a3b8;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e2e8f0;
    border-top-color: #2563eb;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
    margin-bottom: 12px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .main-content {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 16px;
    padding: 16px 24px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .left-panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .right-panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  @media (max-width: 900px) {
    .main-content {
      grid-template-columns: 1fr;
    }

    .header-actions {
      flex-wrap: wrap;
      gap: 6px;
    }
  }
</style>
