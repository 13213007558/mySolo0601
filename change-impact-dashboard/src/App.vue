<template>
  <div class="min-h-screen bg-slate-50">
    <header class="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <GitCompare class="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 class="text-xl font-bold text-slate-800">设计变更影响对照页</h1>
              <p class="text-xs text-slate-500">设计变更对工序、成本和已施工区域影响分析</p>
            </div>
          </div>
          
          <div class="flex items-center gap-3">
            <button 
              @click="openImportWizard"
              class="btn-primary text-sm"
            >
              <Upload class="w-4 h-4 mr-1" />
              导入变更
            </button>
            
            <div class="relative" ref="exportDropdownRef">
              <button 
                @click="showExportMenu = !showExportMenu"
                class="btn-secondary text-sm"
              >
                <Download class="w-4 h-4 mr-1" />
                导出
                <ChevronDown class="w-4 h-4 ml-1" />
              </button>
              
              <Transition name="fade">
                <div 
                  v-if="showExportMenu"
                  class="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50"
                >
                  <button 
                    @click="handleExportExcel"
                    class="w-full px-4 py-2 text-sm text-left hover:bg-slate-50 flex items-center gap-2"
                  >
                    <FileSpreadsheet class="w-4 h-4 text-emerald-500" />
                    导出 Excel 清单
                  </button>
                  <button 
                    @click="handleExportReport"
                    class="w-full px-4 py-2 text-sm text-left hover:bg-slate-50 flex items-center gap-2"
                  >
                    <FileText class="w-4 h-4 text-blue-500" />
                    导出影响报告
                  </button>
                  <button 
                    @click="handleExportChecklist"
                    class="w-full px-4 py-2 text-sm text-left hover:bg-slate-50 flex items-center gap-2"
                  >
                    <ListChecks class="w-4 h-4 text-amber-500" />
                    导出核对清单
                  </button>
                  <div class="border-t border-slate-100 my-1"></div>
                  <button 
                    @click="handleVerifyData"
                    class="w-full px-4 py-2 text-sm text-left hover:bg-slate-50 flex items-center gap-2"
                  >
                    <ShieldCheck class="w-4 h-4 text-primary-500" />
                    验证数据一致性
                  </button>
                </div>
              </Transition>
            </div>
            
            <button 
              @click="showHelpModal = true"
              class="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              title="使用帮助"
            >
              <HelpCircle class="w-5 h-5" />
            </button>
            
            <button 
              @click="handleReset"
              class="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              title="重置数据"
            >
              <RefreshCw class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
    
    <main class="max-w-7xl mx-auto px-4 py-6">
      <div class="space-y-6">
        <StatsCards />
        
        <div class="grid grid-cols-12 gap-6">
          <div class="col-span-12 lg:col-span-3 space-y-4">
            <FloorSelector />
            <FilterPanel />
            <MajorBreakdown />
          </div>
          
          <div class="col-span-12 lg:col-span-9">
            <ChangeList />
          </div>
        </div>
      </div>
    </main>
    
    <DetailDrawer />
    <RevertModal />
    <ImportWizard 
      :is-open="isImportWizardOpen" 
      @close="isImportWizardOpen = false" 
    />
    
    <div v-if="showHelpModal" class="modal-backdrop" @click.self="showHelpModal = false">
      <div class="modal-panel max-w-2xl">
        <div class="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <HelpCircle class="w-5 h-5 text-primary-600" />
            使用帮助
          </h3>
          <button @click="showHelpModal = false" class="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X class="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div class="p-4 max-h-[70vh] overflow-y-auto scrollbar-thin space-y-4">
          <div>
            <h4 class="text-sm font-semibold text-slate-700 mb-2">一、快速开始</h4>
            <ol class="text-sm text-slate-600 space-y-1 list-decimal list-inside">
              <li>首次打开会自动加载9条样例变更数据</li>
              <li>点击左侧「楼层选择」切换楼层，右侧统计和列表会联动更新</li>
              <li>使用「筛选条件」按专业、责任人、影响等级等筛选</li>
              <li>点击变更列表中的行查看详细信息</li>
            </ol>
          </div>
          
          <div>
            <h4 class="text-sm font-semibold text-slate-700 mb-2">二、核心功能说明</h4>
            <div class="space-y-2">
              <div class="p-3 bg-blue-50 rounded-lg">
                <div class="text-sm font-medium text-blue-700 mb-1">🔄 楼层联动</div>
                <div class="text-xs text-blue-600">切换楼层时，统计卡片、专业分布、变更列表会自动筛选对应楼层的数据，显示该楼层的成本、进度、责任专业影响。</div>
              </div>
              <div class="p-3 bg-amber-50 rounded-lg">
                <div class="text-sm font-medium text-amber-700 mb-1">⚠️ 已施工标记</div>
                <div class="text-xs text-amber-600">红色边框表示该区域已施工，变更会产生返工成本，需要特别关注。</div>
              </div>
              <div class="p-3 bg-green-50 rounded-lg">
                <div class="text-sm font-medium text-green-700 mb-1">↩️ 撤回机制</div>
                <div class="text-xs text-green-600">已施工且待确认的变更支持撤回误判，旧的影响等级、成本、进度数据和处理人会保留在历史记录中。</div>
              </div>
              <div class="p-3 bg-purple-50 rounded-lg">
                <div class="text-sm font-medium text-purple-700 mb-1">📊 版本对比</div>
                <div class="text-xs text-purple-600">设计院补发新版变更函时，可创建新版本并对比历史版本差异。</div>
              </div>
            </div>
          </div>
          
          <div>
            <h4 class="text-sm font-semibold text-slate-700 mb-2">三、数据刷新验证步骤</h4>
            <ol class="text-sm text-slate-600 space-y-1 list-decimal list-inside">
              <li>点击「导出」→「验证数据一致性」，记录当前哈希值</li>
              <li>按 F5 刷新整个页面</li>
              <li>确认筛选条件保持不变</li>
              <li>确认待确认数量保持不变</li>
              <li>再次点击「导出」→「验证数据一致性」</li>
              <li>确认哈希值与刷新前完全一致</li>
            </ol>
          </div>
          
          <div>
            <h4 class="text-sm font-semibold text-slate-700 mb-2">四、图例说明</h4>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded bg-red-500"></span>
                <span class="text-slate-600">高影响 / 已施工</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded bg-amber-500"></span>
                <span class="text-slate-600">中影响 / 部分施工</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded bg-green-500"></span>
                <span class="text-slate-600">低影响</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded bg-blue-500"></span>
                <span class="text-slate-600">仅图纸</span>
              </div>
            </div>
          </div>
        </div>
        <div class="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
          <p>所有数据存储在浏览器本地 localStorage 中，清理浏览器数据会导致数据丢失。</p>
          <p class="mt-1">数据哈希：<span class="font-mono">{{ store.change.dataHash }}</span></p>
        </div>
      </div>
    </div>
    
    <div v-if="showVerifyModal" class="modal-backdrop" @click.self="showVerifyModal = false">
      <div class="modal-panel max-w-md">
        <div class="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <ShieldCheck class="w-5 h-5 text-primary-600" />
            数据一致性验证
          </h3>
          <button @click="showVerifyModal = false" class="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X class="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div class="p-6">
          <div v-if="verifyResult" class="space-y-4">
            <div class="text-center">
              <div :class="[
                'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3',
                verifyResult.isConsistent ? 'bg-green-100' : 'bg-red-100'
              ]">
                <Check v-if="verifyResult.isConsistent" class="w-8 h-8 text-green-600" />
                <AlertTriangle v-else class="w-8 h-8 text-red-600" />
              </div>
              <div :class="[
                'text-lg font-semibold',
                verifyResult.isConsistent ? 'text-green-600' : 'text-red-600'
              ]">
                {{ verifyResult.isConsistent ? '数据一致 ✓' : '数据不一致 ✗' }}
              </div>
            </div>
            
            <div class="p-4 bg-slate-50 rounded-lg space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-slate-500">记录总数</span>
                <span class="font-medium text-slate-700">{{ verifyResult.recordCount }} 条</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">存储哈希值</span>
                <span class="font-mono text-slate-700">{{ verifyResult.storedHash }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">当前哈希值</span>
                <span class="font-mono text-slate-700">{{ verifyResult.currentHash }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">最后更新</span>
                <span class="text-slate-700">{{ formatDateTime(verifyResult.lastUpdated) }}</span>
              </div>
            </div>
            
            <p class="text-xs text-slate-500 text-center">
              刷新浏览器后重新验证，如哈希值相同则证明数据未发生变化
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { 
  Upload, Download, ChevronDown, HelpCircle, RefreshCw, X,
  GitCompare, FileSpreadsheet, FileText, ListChecks, ShieldCheck,
  Check, AlertTriangle
} from 'lucide-vue-next';
import { useChangeStore } from './stores/changeStore';
import { exportToExcel, exportImpactReport, exportChecklist } from './utils/importExport';
import { formatDateTime } from './utils/storage';

import StatsCards from './components/StatsCards.vue';
import FloorSelector from './components/FloorSelector.vue';
import FilterPanel from './components/FilterPanel.vue';
import MajorBreakdown from './components/MajorBreakdown.vue';
import ChangeList from './components/ChangeList.vue';
import DetailDrawer from './components/DetailDrawer.vue';
import RevertModal from './components/RevertModal.vue';
import ImportWizard from './components/ImportWizard.vue';

const store = { change: useChangeStore() };

const showExportMenu = ref(false);
const showHelpModal = ref(false);
const showVerifyModal = ref(false);
const isImportWizardOpen = ref(false);
const verifyResult = ref(null);
const exportDropdownRef = ref(null);

const openImportWizard = () => {
  isImportWizardOpen.value = true;
  showExportMenu.value = false;
};

const handleExportExcel = () => {
  exportToExcel(store.change.filteredChanges);
  showExportMenu.value = false;
};

const handleExportReport = () => {
  exportImpactReport(store.change.changes, store.change.selectedFloorId);
  showExportMenu.value = false;
};

const handleExportChecklist = () => {
  exportChecklist(store.change.changes);
  showExportMenu.value = false;
};

const handleVerifyData = () => {
  verifyResult.value = store.change.verifyDataConsistency();
  showVerifyModal.value = true;
  showExportMenu.value = false;
};

const handleReset = () => {
  if (confirm('确定要重置所有数据吗？这将恢复为初始样例数据。')) {
    store.change.resetAllData();
  }
};

const handleClickOutside = (event) => {
  if (exportDropdownRef.value && !exportDropdownRef.value.contains(event.target)) {
    showExportMenu.value = false;
  }
};

onMounted(() => {
  store.change.loadStoredData();
  document.addEventListener('click', handleClickOutside);
});
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
