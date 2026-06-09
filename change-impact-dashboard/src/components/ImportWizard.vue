<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="modal-backdrop" @click.self="closeWizard">
        <div class="modal-panel">
          <div class="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Upload class="w-5 h-5 text-primary-600" />
              导入设计变更
            </h3>
            <button @click="closeWizard" class="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <X class="w-5 h-5 text-slate-500" />
            </button>
          </div>
          
          <div class="p-4">
            <div class="flex items-center justify-center mb-6">
              <div class="flex items-center">
                <div 
                  v-for="(step, index) in steps" 
                  :key="step.id"
                  class="flex items-center"
                >
                  <div 
                    :class="[
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                      currentStep === index + 1 
                        ? 'bg-primary-600 text-white' 
                        : currentStep > index + 1
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-200 text-slate-500'
                    ]"
                  >
                    <Check v-if="currentStep > index + 1" class="w-4 h-4" />
                    <span v-else>{{ index + 1 }}</span>
                  </div>
                  <span 
                    :class="[
                      'ml-2 text-sm font-medium',
                      currentStep >= index + 1 ? 'text-slate-700' : 'text-slate-400'
                    ]"
                  >
                    {{ step.name }}
                  </span>
                  <div 
                    v-if="index < steps.length - 1"
                    :class="[
                      'w-16 h-0.5 mx-3',
                      currentStep > index + 1 ? 'bg-green-500' : 'bg-slate-200'
                    ]"
                  ></div>
                </div>
              </div>
            </div>
            
            <div v-if="currentStep === 1">
              <div class="text-center py-8">
                <FileUp class="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h4 class="text-base font-medium text-slate-700 mb-2">选择 Excel 文件</h4>
                <p class="text-sm text-slate-500 mb-6">
                  支持 .xlsx 格式，请确保文件格式正确
                </p>
                
                <div class="grid grid-cols-2 gap-3 max-w-md mx-auto mb-4">
                  <label class="cursor-pointer">
                    <div class="border-2 border-dashed border-slate-300 rounded-xl p-6 hover:border-primary-400 hover:bg-primary-50/50 transition-all">
                      <Upload class="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <div class="text-sm font-medium text-slate-700">选择文件</div>
                      <div class="text-xs text-slate-400 mt-1">点击上传</div>
                    </div>
                    <input 
                      type="file" 
                      ref="fileInput"
                      accept=".xlsx,.xls"
                      class="hidden"
                      @change="handleFileSelect"
                    />
                  </label>
                  
                  <div 
                    @click="importSampleData"
                    class="cursor-pointer border-2 border-dashed border-slate-300 rounded-xl p-6 hover:border-green-400 hover:bg-green-50/50 transition-all"
                  >
                    <Database class="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <div class="text-sm font-medium text-slate-700">导入样例数据</div>
                    <div class="text-xs text-slate-400 mt-1">快速体验</div>
                  </div>
                </div>
                
                <button 
                  @click="downloadTemplate"
                  class="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 mx-auto"
                >
                  <Download class="w-4 h-4" />
                  下载导入模板
                </button>
              </div>
            </div>
            
            <div v-if="currentStep === 2">
              <h4 class="text-base font-medium text-slate-700 mb-4">确认导入数据</h4>
              
              <div v-if="previewData.length > 0" class="space-y-4">
                <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div class="text-sm text-slate-600">
                    共 <span class="font-semibold text-slate-700">{{ previewData.length }}</span> 条数据待导入
                  </div>
                  <div class="flex items-center gap-3 text-xs">
                    <span class="text-green-600 flex items-center gap-1">
                      <Check class="w-3 h-3" />
                      可导入 {{ importResult?.imported || 0 }}
                    </span>
                    <span v-if="importResult?.skipped > 0" class="text-amber-600 flex items-center gap-1">
                      <AlertCircle class="w-3 h-3" />
                      跳过 {{ importResult.skipped }}
                    </span>
                    <span v-if="importResult?.errors > 0" class="text-red-600 flex items-center gap-1">
                      <X class="w-3 h-3" />
                      错误 {{ importResult.errors }}
                    </span>
                  </div>
                </div>
                
                <div class="max-h-64 overflow-y-auto scrollbar-thin border border-slate-200 rounded-lg">
                  <table class="w-full text-sm">
                    <thead class="bg-slate-50 sticky top-0">
                      <tr>
                        <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">变更编号</th>
                        <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">标题</th>
                        <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">楼层</th>
                        <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">专业</th>
                        <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">状态</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      <tr 
                        v-for="(item, index) in previewData" 
                        :key="index"
                        class="hover:bg-slate-50"
                      >
                        <td class="px-3 py-2 font-mono text-xs">{{ item.changeNo }}</td>
                        <td class="px-3 py-2 max-w-xs truncate" :title="item.title">{{ item.title }}</td>
                        <td class="px-3 py-2">{{ getFloorName(item.floorId) }}</td>
                        <td class="px-3 py-2">{{ getMajorName(item.major) }}</td>
                        <td class="px-3 py-2">
                          <span v-if="importResult?.skippedItems?.find(s => s.changeNo === item.changeNo)" class="text-amber-600 text-xs">
                            重复，跳过
                          </span>
                          <span v-else-if="importResult?.errorItems?.find(e => e.includes(item.changeNo))" class="text-red-600 text-xs">
                            数据错误
                          </span>
                          <span v-else class="text-green-600 text-xs">可导入</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <div v-if="currentStep === 3">
              <div class="text-center py-12">
                <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check class="w-8 h-8 text-green-600" />
                </div>
                <h4 class="text-lg font-semibold text-slate-800 mb-2">导入完成</h4>
                <p class="text-sm text-slate-500 mb-6">
                  成功导入 {{ importResult?.imported || 0 }} 条变更数据
                </p>
                
                <div v-if="importResult?.skipped > 0 || importResult?.errors > 0" class="max-w-md mx-auto space-y-2 text-left">
                  <div v-if="importResult?.skipped > 0" class="p-3 bg-amber-50 rounded-lg text-sm">
                    <div class="text-amber-700 font-medium mb-1">跳过 {{ importResult.skipped }} 条</div>
                    <div v-for="item in importResult.skippedItems" :key="item.changeNo" class="text-xs text-amber-600">
                      • {{ item.changeNo }} - {{ item.reason }}
                    </div>
                  </div>
                  <div v-if="importResult?.errors > 0" class="p-3 bg-red-50 rounded-lg text-sm">
                    <div class="text-red-700 font-medium mb-1">错误 {{ importResult.errors }} 条</div>
                    <div v-for="(error, index) in importResult.errorItems" :key="index" class="text-xs text-red-600">
                      • {{ error }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="p-4 border-t border-slate-200 flex justify-between">
            <button 
              v-if="currentStep > 1"
              @click="prevStep"
              class="btn-secondary"
            >
              上一步
            </button>
            <div v-else></div>
            
            <div class="flex gap-3">
              <button @click="closeWizard" class="btn-secondary">
                {{ currentStep === 3 ? '关闭' : '取消' }}
              </button>
              <button 
                v-if="currentStep < 3"
                @click="nextStep"
                :disabled="!canProceed"
                class="btn-primary"
              >
                {{ currentStep === 2 ? '确认导入' : '下一步' }}
              </button>
              <button 
                v-if="currentStep === 3"
                @click="closeWizard"
                class="btn-primary"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { X, Upload, Check, FileUp, Database, Download, AlertCircle } from 'lucide-vue-next';
import { useChangeStore } from '../stores/changeStore';
import { FLOORS, MAJORS } from '../data/constants';
import { parseExcelFile, downloadImportTemplate } from '../utils/importExport';
import { importTemplate } from '../data/mockData';
import { v4 as uuidv4 } from 'uuid';

const props = defineProps({
  isOpen: Boolean
});

const emit = defineEmits(['close']);

const store = { change: useChangeStore() };

const steps = [
  { id: 1, name: '选择文件' },
  { id: 2, name: '预览确认' },
  { id: 3, name: '导入完成' }
];

const currentStep = ref(1);
const fileInput = ref(null);
const previewData = ref([]);
const importResult = ref(null);

const canProceed = computed(() => {
  if (currentStep.value === 1) return previewData.value.length > 0;
  if (currentStep.value === 2) return importResult.value?.imported > 0;
  return true;
});

const getFloorName = (id) => {
  const floor = FLOORS.find(f => f.id === id);
  return floor ? floor.name : id;
};

const getMajorName = (id) => {
  const major = MAJORS.find(m => m.id === id);
  return major ? major.name : id;
};

const closeWizard = () => {
  currentStep.value = 1;
  previewData.value = [];
  importResult.value = null;
  emit('close');
};

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const nextStep = async () => {
  if (currentStep.value === 2) {
    const result = store.change.importChanges(previewData.value, true);
    importResult.value = result;
    currentStep.value = 3;
  } else if (currentStep.value < 3) {
    currentStep.value++;
  }
};

const handleFileSelect = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  
  try {
    const changes = await parseExcelFile(file);
    previewData.value = changes;
    
    const existingNos = new Set(store.change.changes.map(c => c.changeNo));
    const skipped = [];
    const errors = [];
    
    changes.forEach((change, index) => {
      if (existingNos.has(change.changeNo)) {
        skipped.push({ changeNo: change.changeNo, reason: '变更编号已存在' });
      }
      if (!change.floorId) {
        errors.push(`变更 ${change.changeNo} 缺少楼层信息`);
      }
    });
    
    importResult.value = {
      imported: changes.length - skipped.length - errors.length,
      skipped: skipped.length,
      errors: errors.length,
      skippedItems: skipped,
      errorItems: errors
    };
    
    currentStep.value = 2;
  } catch (error) {
    alert('文件解析失败：' + error.message);
  }
  
  event.target.value = '';
};

const importSampleData = () => {
  const sampleChanges = importTemplate.map(row => {
    const affectedAreas = typeof row.affectedAreas === 'string' 
      ? row.affectedAreas.split(/[,，、]/).map(s => s.trim()).filter(Boolean)
      : [];
      
    return {
      id: uuidv4(),
      changeNo: row.changeNo,
      version: 1,
      title: row.title,
      description: row.description,
      source: row.source || 'design_letter',
      sourceRef: row.sourceRef || '',
      dateIssued: row.dateIssued,
      dateReceived: row.dateReceived,
      floorId: row.floorId,
      major: row.major,
      affectedAreas,
      constructionStatus: row.constructionStatus || 'drawing',
      constructionProgress: row.constructionProgress || '',
      impactLevel: row.impactLevel || 'medium',
      costImpact: Number(row.costImpact) || 0,
      scheduleImpact: Number(row.scheduleImpact) || 0,
      processImpact: row.processImpact || '',
      responsiblePerson: row.responsiblePerson || null,
      status: row.status || 'pending',
      attachments: [],
      remarks: row.remarks || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [
        {
          id: uuidv4(),
          action: 'import',
          timestamp: new Date().toISOString(),
          operator: 'sun',
          oldValue: null,
          newValue: { status: 'pending', imported: true },
          reason: '导入样例数据'
        }
      ]
    };
  });
  
  previewData.value = sampleChanges;
  
  const existingNos = new Set(store.change.changes.map(c => c.changeNo));
  const skipped = [];
  const errors = [];
  
  sampleChanges.forEach(change => {
    if (existingNos.has(change.changeNo)) {
      skipped.push({ changeNo: change.changeNo, reason: '变更编号已存在' });
    }
  });
  
  importResult.value = {
    imported: sampleChanges.length - skipped.length,
    skipped: skipped.length,
    errors: 0,
    skippedItems: skipped,
    errorItems: errors
  };
  
  currentStep.value = 2;
};

const downloadTemplate = () => {
  downloadImportTemplate();
};

watch(() => props.isOpen, (newVal) => {
  if (!newVal) {
    currentStep.value = 1;
    previewData.value = [];
    importResult.value = null;
  }
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
