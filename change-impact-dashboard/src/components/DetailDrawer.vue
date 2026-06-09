<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="store.change.isDetailDrawerOpen" class="drawer-backdrop" @click.self="store.change.closeDetail()"></div>
    </Transition>
    
    <Transition name="slide">
      <div v-if="store.change.isDetailDrawerOpen" class="drawer-panel">
        <div class="h-full flex flex-col">
          <div class="flex items-center justify-between p-4 border-b border-slate-200">
            <div class="flex items-center gap-3">
              <FileText class="w-5 h-5 text-primary-600" />
              <div>
                <h2 class="text-lg font-semibold text-slate-800">{{ change?.changeNo }}</h2>
                <p class="text-xs text-slate-500">版本 v{{ change?.version }}</p>
              </div>
            </div>
            <button @click="store.change.closeDetail()" class="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <X class="w-5 h-5 text-slate-500" />
            </button>
          </div>
          
          <div class="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-6">
            <div v-if="change">
              <div class="mb-6">
                <h3 class="text-base font-semibold text-slate-800 mb-2">{{ change.title }}</h3>
                <p class="text-sm text-slate-600">{{ change.description }}</p>
              </div>
              
              <div class="grid grid-cols-2 gap-4 mb-6">
                <div class="p-3 bg-slate-50 rounded-lg">
                  <div class="text-xs text-slate-500 mb-1">责任专业</div>
                  <span :class="['tag', getMajorColor(change.major)]">{{ getMajorName(change.major) }}</span>
                </div>
                <div class="p-3 bg-slate-50 rounded-lg">
                  <div class="text-xs text-slate-500 mb-1">所在楼层</div>
                  <span class="text-sm font-medium text-slate-700">{{ getFloorName(change.floorId) }}</span>
                </div>
                <div class="p-3 bg-slate-50 rounded-lg">
                  <div class="text-xs text-slate-500 mb-1">施工状态</div>
                  <span :class="['tag', getConstructionTagClass(change.constructionStatus)]">
                    {{ getConstructionName(change.constructionStatus) }}
                  </span>
                </div>
                <div class="p-3 bg-slate-50 rounded-lg">
                  <div class="text-xs text-slate-500 mb-1">影响等级</div>
                  <span :class="['tag', getImpactClass(change.impactLevel)]">
                    {{ getImpactName(change.impactLevel) }}
                  </span>
                </div>
              </div>
              
              <div class="mb-6">
                <h4 class="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <DollarSign class="w-4 h-4" />
                  影响评估
                </h4>
                <div class="grid grid-cols-3 gap-3">
                  <div class="p-3 bg-emerald-50 rounded-lg text-center">
                    <div class="text-xl font-bold text-emerald-600">{{ formatCurrency(change.costImpact) }}</div>
                    <div class="text-xs text-emerald-600">成本影响</div>
                  </div>
                  <div class="p-3 bg-orange-50 rounded-lg text-center">
                    <div class="text-xl font-bold text-orange-600">{{ formatDays(change.scheduleImpact) }}</div>
                    <div class="text-xs text-orange-600">进度影响</div>
                  </div>
                  <div class="p-3 bg-blue-50 rounded-lg text-center">
                    <div class="text-lg font-bold text-blue-600">{{ change.responsiblePerson ? getPersonName(change.responsiblePerson) : '未分派' }}</div>
                    <div class="text-xs text-blue-600">责任人</div>
                  </div>
                </div>
                <div class="mt-3 p-3 bg-slate-50 rounded-lg">
                  <div class="text-xs text-slate-500 mb-1">工序影响说明</div>
                  <p class="text-sm text-slate-700">{{ change.processImpact || '暂无说明' }}</p>
                </div>
                <div class="mt-3 p-3 bg-slate-50 rounded-lg">
                  <div class="text-xs text-slate-500 mb-1">施工进度</div>
                  <p class="text-sm text-slate-700">{{ change.constructionProgress || '暂无说明' }}</p>
                </div>
              </div>
              
              <div class="mb-6">
                <h4 class="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <MapPin class="w-4 h-4" />
                  影响区域
                </h4>
                <div class="flex flex-wrap gap-1.5">
                  <span 
                    v-for="area in change.affectedAreas" 
                    :key="area"
                    class="tag bg-slate-100 text-slate-700"
                  >
                    {{ area }}
                  </span>
                </div>
              </div>
              
              <div class="mb-6">
                <h4 class="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <FileText class="w-4 h-4" />
                  来源信息
                </h4>
                <div class="p-3 bg-slate-50 rounded-lg space-y-2">
                  <div class="flex items-center gap-2 text-sm">
                    <span class="text-slate-500">来源类型：</span>
                    <span class="text-slate-700">{{ getSourceName(change.source) }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-sm">
                    <span class="text-slate-500">来源编号：</span>
                    <span class="text-slate-700">{{ change.sourceRef || '-' }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-sm">
                    <span class="text-slate-500">发出日期：</span>
                    <span class="text-slate-700">{{ formatDate(change.dateIssued) }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-sm">
                    <span class="text-slate-500">收到日期：</span>
                    <span class="text-slate-700">{{ formatDate(change.dateReceived) }}</span>
                  </div>
                </div>
              </div>
              
              <div v-if="change.attachments && change.attachments.length > 0" class="mb-6">
                <h4 class="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Paperclip class="w-4 h-4" />
                  附件资料
                </h4>
                <div class="space-y-2">
                  <div 
                    v-for="(attachment, index) in change.attachments" 
                    :key="index"
                    class="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div class="flex items-center gap-3">
                      <File class="w-5 h-5 text-slate-400" />
                      <div>
                        <div class="text-sm text-slate-700">{{ attachment.name }}</div>
                        <div class="text-xs text-slate-400">{{ attachment.size }}</div>
                      </div>
                    </div>
                    <Download class="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>
              
              <div class="mb-6">
                <h4 class="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Clock class="w-4 h-4" />
                  历史记录
                  <span class="text-xs font-normal text-slate-400">（撤回记录保留旧理由和处理人）</span>
                </h4>
                <div class="space-y-1">
                  <div 
                    v-for="record in change.history" 
                    :key="record.id"
                    :class="[
                      'history-card',
                      record.action === 'revert' ? 'bg-amber-50 rounded-r-lg' : ''
                    ]"
                  >
                    <div class="flex items-start justify-between mb-1">
                      <div class="flex items-center gap-2">
                        <span :class="[
                          'text-xs font-medium',
                          getActionClass(record.action)
                        ]">
                          {{ getActionName(record.action) }}
                        </span>
                        <span class="text-xs text-slate-400">{{ formatDateTime(record.timestamp) }}</span>
                      </div>
                      <span class="text-xs text-slate-500">{{ getPersonName(record.operator) }}</span>
                    </div>
                    <p class="text-sm text-slate-700">{{ record.reason }}</p>
                    <div v-if="record.action === 'revert'" class="mt-2 text-xs text-amber-700 bg-amber-100/50 p-2 rounded">
                      <div class="font-medium mb-1">撤回详情：</div>
                      <div v-if="record.oldValue && record.newValue">
                        <template v-for="(value, key) in record.oldValue" :key="key">
                          <div class="flex items-center gap-2">
                            <span class="text-slate-500">{{ getFieldLabel(key) }}：</span>
                            <span class="line-through">{{ formatValue(key, value) }}</span>
                            <ArrowRight class="w-3 h-3" />
                            <span class="font-medium">{{ formatValue(key, record.newValue[key]) }}</span>
                          </div>
                        </template>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="mb-6">
                <h4 class="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Edit3 class="w-4 h-4" />
                  快速操作
                </h4>
                <div class="grid grid-cols-2 gap-2">
                  <select 
                    v-model="editForm.responsiblePerson"
                    class="select"
                    @change="updateResponsiblePerson()"
                  >
                    <option value="">选择责任人...</option>
                    <option v-for="p in RESPONSIBLE_PERSONS" :key="p.id" :value="p.id">
                      {{ p.name }} - {{ p.role }}
                    </option>
                  </select>
                  <select 
                    v-model="editForm.status"
                    class="select"
                    @change="updateStatus()"
                  >
                    <option value="">更新状态...</option>
                    <option v-for="s in CHANGE_STATUS" :key="s.id" :value="s.id">
                      {{ s.name }}
                    </option>
                  </select>
                </div>
                <div class="mt-2 flex gap-2">
                  <button 
                    v-if="change.constructionStatus === 'constructed' && change.status === 'pending'"
                    @click="store.change.openRevertModal(change.id); store.change.closeDetail();"
                    class="btn-warning flex-1 text-sm"
                  >
                    <Undo2 class="w-4 h-4 mr-1" />
                    撤回误判
                  </button>
                  <button @click="showVersionModal = true" class="btn-secondary flex-1 text-sm">
                    <GitCompare class="w-4 h-4 mr-1" />
                    版本对比
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div class="p-4 border-t border-slate-200 bg-slate-50">
            <div class="flex items-center justify-between text-xs text-slate-500">
              <span>创建时间：{{ formatDateTime(change?.createdAt) }}</span>
              <span>更新时间：{{ formatDateTime(change?.updatedAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
    
    <div v-if="showVersionModal" class="modal-backdrop" @click.self="showVersionModal = false">
      <div class="modal-panel">
        <div class="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <GitCompare class="w-5 h-5 text-primary-600" />
            版本对比
          </h3>
          <button @click="showVersionModal = false" class="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X class="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div class="p-4 max-h-[60vh] overflow-y-auto scrollbar-thin">
          <div v-if="change && change.history.length > 1" class="space-y-4">
            <div 
              v-for="(record, index) in change.history.filter(h => h.action === 'version_update').reverse()"
              :key="record.id"
              class="p-4 bg-slate-50 rounded-lg"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-slate-700">
                  版本 {{ record.oldValue?.version || '?' }} → {{ record.newValue?.version || '?' }}
                </span>
                <span class="text-xs text-slate-400">{{ formatDateTime(record.timestamp) }}</span>
              </div>
              <div class="text-sm text-slate-600 mb-2">{{ record.reason }}</div>
              <div class="grid grid-cols-2 gap-4 text-xs">
                <div class="p-3 bg-red-50 rounded-lg">
                  <div class="text-slate-500 mb-1">旧版本</div>
                  <div class="text-slate-700">{{ record.oldValue?.description || '-' }}</div>
                </div>
                <div class="p-3 bg-green-50 rounded-lg">
                  <div class="text-slate-500 mb-1">新版本</div>
                  <div class="text-slate-700">{{ record.newValue?.description || '-' }}</div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-12 text-slate-400">
            <GitCompare class="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p class="text-sm">该变更暂无版本更新记录</p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { 
  X, FileText, DollarSign, Clock, MapPin, Paperclip, File, Download,
  Edit3, Undo2, GitCompare, ArrowRight
} from 'lucide-vue-next';
import { useChangeStore } from '../stores/changeStore';
import { 
  FLOORS, MAJORS, CONSTRUCTION_STATUS, IMPACT_LEVEL, CHANGE_STATUS, 
  RESPONSIBLE_PERSONS, SOURCE_TYPES 
} from '../data/constants';
import { formatCurrency, formatDays, formatDate, formatDateTime } from '../utils/storage';

const store = { change: useChangeStore() };

const showVersionModal = ref(false);
const editForm = reactive({
  responsiblePerson: '',
  status: ''
});

const change = computed(() => store.change.selectedChange);

watch(
  () => change.value,
  (newChange) => {
    if (newChange) {
      editForm.responsiblePerson = newChange.responsiblePerson || '';
      editForm.status = newChange.status || '';
    }
  },
  { immediate: true }
);

const updateResponsiblePerson = () => {
  if (!change.value || !editForm.responsiblePerson) return;
  store.change.updateChange(
    change.value.id,
    { responsiblePerson: editForm.responsiblePerson },
    '更新责任人',
    'sun'
  );
};

const updateStatus = () => {
  if (!change.value || !editForm.status) return;
  store.change.updateChange(
    change.value.id,
    { status: editForm.status },
    '更新处理状态',
    'sun'
  );
};

const getFloorName = (id) => {
  const floor = FLOORS.find(f => f.id === id);
  return floor ? floor.name : id;
};

const getMajorName = (id) => {
  const major = MAJORS.find(m => m.id === id);
  return major ? major.name : id;
};

const getMajorColor = (id) => {
  const major = MAJORS.find(m => m.id === id);
  return major ? major.color : 'bg-slate-100 text-slate-700';
};

const getConstructionName = (id) => {
  const status = CONSTRUCTION_STATUS.find(s => s.id === id);
  return status ? status.name : id;
};

const getConstructionTagClass = (id) => {
  switch (id) {
    case 'constructed': return 'bg-red-100 text-red-700';
    case 'partial': return 'bg-amber-100 text-amber-700';
    case 'drawing': return 'bg-blue-100 text-blue-700';
    default: return 'bg-slate-100 text-slate-700';
  }
};

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

const getSourceName = (id) => {
  const source = SOURCE_TYPES.find(s => s.id === id);
  return source ? source.name : id;
};

const getPersonName = (id) => {
  const person = RESPONSIBLE_PERSONS.find(p => p.id === id);
  return person ? person.name : id;
};

const getActionName = (action) => {
  const actions = {
    create: '创建',
    update: '更新',
    revert: '撤回',
    version_update: '版本更新',
    import: '导入'
  };
  return actions[action] || action;
};

const getActionClass = (action) => {
  switch (action) {
    case 'create': return 'text-green-600';
    case 'update': return 'text-blue-600';
    case 'revert': return 'text-amber-600';
    case 'version_update': return 'text-purple-600';
    case 'import': return 'text-slate-600';
    default: return 'text-slate-600';
  }
};

const getFieldLabel = (key) => {
  const labels = {
    impactLevel: '影响等级',
    costImpact: '成本影响',
    scheduleImpact: '进度影响',
    responsiblePerson: '责任人',
    status: '状态',
    version: '版本',
    description: '变更说明'
  };
  return labels[key] || key;
};

const formatValue = (key, value) => {
  if (key === 'responsiblePerson') return getPersonName(value);
  if (key === 'impactLevel') return getImpactName(value);
  if (key === 'status') return getStatusName(value);
  if (key === 'costImpact') return formatCurrency(value);
  if (key === 'scheduleImpact') return formatDays(value);
  return value || '-';
};

const getStatusName = (id) => {
  const status = CHANGE_STATUS.find(s => s.id === id);
  return status ? status.name : id;
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

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
