<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-inner">
        <div class="brand">
          <span class="logo">🚿</span>
          <div class="title-group">
            <h1 class="app-title">防水闭水试验记录墙</h1>
            <p class="app-subtitle">质量员专用 · 闭水时长 · 水位证据 · 返修复测闭环</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-ghost" @click="openGuide">📘 使用说明</button>
          <button class="btn btn-primary" @click="openForm()">➕ 新增记录</button>
        </div>
      </div>
      <nav class="tab-bar">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-item"
          :class="{ active: state.ui.activeTab === tab.key }"
          @click="state.ui.activeTab = tab.key"
        >
          <span class="tab-icon">{{ tab.icon }}</span>{{ tab.label }}
          <span v-if="tab.badge" class="tab-badge">{{ tab.badge }}</span>
        </button>
      </nav>
    </header>

    <main class="app-main">
      <section v-if="state.ui.activeTab === 'records'" class="records-view">
        <FilterBar :count="filteredRecords.length">
          <div class="toolbar">
            <button class="btn btn-warn" @click="setPendingFilter">🎯 筛选待复测</button>
            <button class="btn btn-ghost" @click="doExport">📤 导出当前结果(CSV)</button>
          </div>
        </FilterBar>

        <div v-if="state.records.length === 0" class="empty-state">
          <div class="empty-card">
            <div class="empty-icon">🏗️</div>
            <h3>暂无闭水试验记录</h3>
            <p>点击下方按钮开始录入，或一键加载演示样例查看效果。</p>
            <div class="empty-actions">
              <button class="btn btn-primary" @click="openForm()">➕ 新增第一条记录</button>
              <button class="btn btn-ghost" @click="openGuide">📥 加载样例数据</button>
            </div>
          </div>
        </div>

        <div v-else-if="filteredRecords.length === 0" class="no-match">
          <div class="nm-inner">
            <div class="nm-icon">🔍</div>
            <h3>没有匹配的记录</h3>
            <p>请调整筛选条件，或 <button class="link-btn" @click="resetFilters">重置筛选</button></p>
          </div>
        </div>

        <div v-else class="records-list">
          <RoomGroup v-for="g in groupedRecords" :key="g.building + g.unit + g.roomNumber" :group="g" @preview="onPreview" />
        </div>
      </section>

      <section v-else-if="state.ui.activeTab === 'dashboard'" class="dashboard-view">
        <Dashboard />
      </section>
    </main>

    <footer class="app-footer">
      <div class="footer-inner">
        <span>数据存储：localStorage · 关闭浏览器前请定期导出报告</span>
        <span>共 {{ statistics.total }} 条记录 · 更新时间 {{ updatedAt }}</span>
      </div>
    </footer>

    <RecordForm />
    <RetestForm />
    <GuideModal />

    <div v-if="previewUrl" class="photo-preview" @click="previewUrl = ''">
      <div class="pp-inner" @click.stop>
        <button class="close-preview" @click="previewUrl = ''">×</button>
        <img :src="previewUrl" alt="预览" />
      </div>
    </div>
  </div>
  </template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useWaterproofStore } from './stores/waterproof.js'
import { formatDateTime } from './utils/validators.js'
import { buildReportRows, exportCSV } from './utils/report.js'
import FilterBar from './components/FilterBar.vue'
import RoomGroup from './components/RoomGroup.vue'
import Dashboard from './components/Dashboard.vue'
import RecordForm from './components/RecordForm.vue'
import RetestForm from './components/RetestForm.vue'
import GuideModal from './components/GuideModal.vue'

const {
  state, filteredRecords, groupedRecords, statistics, statusMap,
  initStore, openForm, openGuide, setFilters, resetFilters, loadSampleData
} = useWaterproofStore()

const tabs = computed(() => ([
  { key: 'records', label: '记录列表', icon: '📋', badge: state.records.length || null },
  { key: 'dashboard', label: '数据看板', icon: '📊' }
]))

const previewUrl = ref('')
const updatedAt = computed(() => {
  try {
    const raw = localStorage.getItem('waterproof_test_records_v1')
    if (raw) {
      const o = JSON.parse(raw)
      if (o?.updatedAt) return formatDateTime(new Date(o.updatedAt))
    }
  } catch {}
  return '--'
})

onMounted(() => {
  initStore()
  if (!localStorage.getItem('waterproof_test_initialized_v1')) {
    setTimeout(() => openGuide(), 500)
  }
})

function setPendingFilter() {
  setFilters({ status: 'pending_retest' })
}
function doExport() {
  const rows = buildReportRows(filteredRecords.value, statusMap.value)
  if (rows.length === 0) { alert('没有可导出的记录'); return }
  exportCSV(rows)
}
function onPreview(url) { previewUrl.value = url }
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f0f5ff 0%, #f5f7fa 100%);
}

.app-header {
  background: linear-gradient(135deg, #1677ff 0%, #0958d9 100%);
  color: #fff;
  box-shadow: 0 4px 14px rgba(22,119,255,0.25);
  position: sticky;
  top: 0;
  z-index: 100;
}
.header-inner {
  max-width: 1400px;
  margin: 0 auto;
  padding: 18px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 14px;
}
.logo {
  width: 52px; height: 52px;
  border-radius: 14px;
  background: rgba(255,255,255,0.2);
  display: flex; align-items: center; justify-content: center;
  font-size: 28px;
  backdrop-filter: blur(4px);
}
.title-group { display: flex; flex-direction: column; gap: 2px; }
.app-title { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
.app-subtitle { margin: 0; font-size: 12px; opacity: 0.85; }
.header-actions { display: flex; gap: 10px; }
.header-actions .btn {
  background: rgba(255,255,255,0.15);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.3);
}
.header-actions .btn:hover { background: rgba(255,255,255,0.25); }
.header-actions .btn-primary {
  background: #fff;
  color: #1677ff;
  border-color: #fff;
  font-weight: 600;
}
.header-actions .btn-primary:hover { background: #e6f4ff; }

.tab-bar {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 28px;
  display: flex;
  gap: 4px;
  background: rgba(0,0,0,0.06);
}
.tab-item {
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.8);
  padding: 10px 20px;
  font-size: 14px;
  cursor: pointer;
  border-radius: 8px 8px 0 0;
  display: flex; align-items: center; gap: 6px;
  transition: all 0.2s;
  position: relative;
}
.tab-item:hover { background: rgba(255,255,255,0.1); color: #fff; }
.tab-item.active {
  background: #fff;
  color: #1677ff;
  font-weight: 600;
}
.tab-badge {
  background: #ff4d4f;
  color: #fff;
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 10px;
  font-weight: 600;
  line-height: 1.4;
}
.tab-item.active .tab-badge { background: #ff7875; }

.app-main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 28px 40px;
  flex: 1;
  width: 100%;
  box-sizing: border-box;
}

.records-view, .dashboard-view { }

.toolbar { display: flex; gap: 10px; }

.empty-state {
  background: #fff;
  border-radius: 16px;
  padding: 80px 40px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}
.empty-card { max-width: 480px; margin: 0 auto; }
.empty-icon { font-size: 72px; margin-bottom: 20px; }
.empty-state h3 { margin: 0 0 12px; font-size: 20px; color: #262626; }
.empty-state p { margin: 0 0 28px; color: #8c8c8c; font-size: 14px; line-height: 1.7; }
.empty-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

.no-match { padding: 60px 20px; }
.nm-inner { text-align: center; background: #fff; border-radius: 12px; padding: 40px; max-width: 420px; margin: 0 auto; }
.nm-icon { font-size: 56px; margin-bottom: 14px; }
.no-match h3 { margin: 0 0 8px; color: #595959; font-size: 18px; }
.no-match p { margin: 0; color: #8c8c8c; font-size: 14px; }
.link-btn {
  background: none;
  border: none;
  color: #1677ff;
  padding: 0;
  font-size: 14px;
  cursor: pointer;
  text-decoration: underline;
}

.app-footer {
  background: #fff;
  border-top: 1px solid #f0f0f0;
  padding: 16px 28px;
  margin-top: auto;
}
.footer-inner {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #8c8c8c;
  flex-wrap: wrap;
  gap: 10px;
}

.photo-preview {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 40px;
  backdrop-filter: blur(4px);
}
.pp-inner {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
}
.photo-preview img {
  max-width: 90vw;
  max-height: 85vh;
  display: block;
}
.close-preview {
  position: absolute;
  top: 8px; right: 8px;
  width: 36px; height: 36px;
  border: none;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 24px;
  border-radius: 50%;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  z-index: 2;
}
.close-preview:hover { background: rgba(0,0,0,0.8); }
</style>
