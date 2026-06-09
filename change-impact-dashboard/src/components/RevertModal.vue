<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="store.change.isRevertModalOpen" class="modal-backdrop" @click.self="store.change.closeRevertModal()">
        <div class="modal-panel">
          <div class="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Undo2 class="w-5 h-5 text-amber-500" />
              撤回误判
            </h3>
            <button @click="store.change.closeRevertModal()" class="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <X class="w-5 h-5 text-slate-500" />
            </button>
          </div>
          
          <div class="p-4">
            <div v-if="change" class="space-y-4">
              <div class="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div class="flex items-start gap-3">
                  <AlertTriangle class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div class="text-sm font-medium text-amber-800">撤回说明</div>
                    <div class="text-xs text-amber-700 mt-1">
                      撤回后，旧的影响等级、成本、进度等数据和处理人将保留在历史记录中，用于审计追溯。
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="p-4 bg-slate-50 rounded-lg">
                <div class="text-sm font-medium text-slate-700 mb-2">{{ change.changeNo }} - {{ change.title }}</div>
                <div class="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div class="text-slate-500 mb-1">当前影响等级</div>
                    <span :class="['tag', getImpactClass(change.impactLevel)]">
                      {{ getImpactName(change.impactLevel) }}
                    </span>
                  </div>
                  <div>
                    <div class="text-slate-500 mb-1">当前成本影响</div>
                    <div class="text-sm font-medium text-slate-700">{{ formatCurrency(change.costImpact) }}</div>
                  </div>
                  <div>
                    <div class="text-slate-500 mb-1">当前进度影响</div>
                    <div class="text-sm font-medium text-slate-700">{{ formatDays(change.scheduleImpact) }}</div>
                  </div>
                  <div>
                    <div class="text-slate-500 mb-1">当前处理状态</div>
                    <span :class="['badge', getStatusClass(change.status)]">
                      {{ getStatusName(change.status) }}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">
                  修正为影响等级 <span class="text-red-500">*</span>
                </label>
                <select v-model="form.impactLevel" class="select">
                  <option value="">请选择正确的影响等级</option>
                  <option v-for="i in IMPACT_LEVEL" :key="i.id" :value="i.id">
                    {{ i.name }} - {{ i.description }}
                  </option>
                </select>
              </div>
              
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">
                    修正成本影响（元）<span class="text-red-500">*</span>
                  </label>
                  <input 
                    type="number" 
                    v-model.number="form.costImpact" 
                    class="input"
                    placeholder="请输入正确的成本影响"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">
                    修正进度影响（天）<span class="text-red-500">*</span>
                  </label>
                  <input 
                    type="number" 
                    v-model.number="form.scheduleImpact" 
                    class="input"
                    placeholder="请输入正确的进度影响"
                  />
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">
                  撤回理由 <span class="text-red-500">*</span>
                </label>
                <textarea 
                  v-model="form.reason" 
                  class="input min-h-[80px]"
                  placeholder="请详细说明撤回原因，例如：误将已施工区域判断为图纸阶段..."
                ></textarea>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">
                  处理人 <span class="text-red-500">*</span>
                </label>
                <select v-model="form.operator" class="select">
                  <option value="">请选择处理人</option>
                  <option v-for="p in RESPONSIBLE_PERSONS" :key="p.id" :value="p.id">
                    {{ p.name }} - {{ p.role }}
                  </option>
                </select>
              </div>
            </div>
          </div>
          
          <div class="p-4 border-t border-slate-200 flex justify-end gap-3">
            <button @click="store.change.closeRevertModal()" class="btn-secondary">
              取消
            </button>
            <button 
              @click="submitRevert()"
              :disabled="!isFormValid"
              class="btn-warning"
            >
              <Undo2 class="w-4 h-4 mr-1" />
              确认撤回
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { X, Undo2, AlertTriangle } from 'lucide-vue-next';
import { useChangeStore } from '../stores/changeStore';
import { IMPACT_LEVEL, CHANGE_STATUS, RESPONSIBLE_PERSONS } from '../data/constants';
import { formatCurrency, formatDays } from '../utils/storage';

const store = { change: useChangeStore() };

const form = reactive({
  impactLevel: '',
  costImpact: 0,
  scheduleImpact: 0,
  reason: '',
  operator: ''
});

const change = computed(() => {
  if (!store.change.revertChangeId) return null;
  return store.change.changes.find(c => c.id === store.change.revertChangeId) || null;
});

const isFormValid = computed(() => {
  return form.impactLevel && 
         form.costImpact >= 0 && 
         form.scheduleImpact >= 0 && 
         form.reason.trim() && 
         form.operator;
});

const getImpactName = (id) => {
  const level = IMPACT_LEVEL.find(i => i.id === id);
  return level ? level.name : id;
};

const getImpactClass = (id) => {
  switch (id) {
    case 'high': return 'bg-red-100 text-red-700';
    case 'medium': return 'bg-amber-100 text-amber-700';
    case 'low': return 'bg-green-100 text-green-700';
    case 'none': return 'bg-slate-100 text-slate-700';
    default: return 'bg-slate-100 text-slate-700';
  }
};

const getStatusName = (id) => {
  const status = CHANGE_STATUS.find(s => s.id === id);
  return status ? status.name : id;
};

const getStatusClass = (id) => {
  const status = CHANGE_STATUS.find(s => s.id === id);
  return status ? status.color : 'bg-slate-100 text-slate-700';
};

const submitRevert = () => {
  if (!change.value || !isFormValid.value) return;
  
  const fieldUpdates = {
    impactLevel: form.impactLevel,
    costImpact: form.costImpact,
    scheduleImpact: form.scheduleImpact
  };
  
  store.change.revertChange(
    change.value.id,
    fieldUpdates,
    form.reason,
    form.operator
  );
  
  form.impactLevel = '';
  form.costImpact = 0;
  form.scheduleImpact = 0;
  form.reason = '';
  form.operator = '';
  
  store.change.closeRevertModal();
};
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
