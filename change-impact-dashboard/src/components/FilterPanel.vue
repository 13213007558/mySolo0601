<template>
  <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-semibold text-slate-700 flex items-center gap-2">
        <Filter class="w-4 h-4" />
        筛选条件
      </h3>
      <button 
        @click="store.change.resetFilters()"
        class="text-xs text-slate-500 hover:text-primary-600 transition-colors"
      >
        重置筛选
      </button>
    </div>
    
    <div class="space-y-3">
      <div>
        <label class="block text-xs text-slate-500 mb-1">关键词搜索</label>
        <input
          type="text"
          v-model="localFilters.keyword"
          @input="updateFilters()"
          class="input"
          placeholder="变更编号/标题/内容..."
        />
      </div>
      
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs text-slate-500 mb-1">责任专业</label>
          <select
            v-model="localFilters.major"
            @change="updateFilters()"
            class="select"
          >
            <option value="all">全部专业</option>
            <option v-for="m in MAJORS" :key="m.id" :value="m.id">{{ m.name }}</option>
          </select>
        </div>
        
        <div>
          <label class="block text-xs text-slate-500 mb-1">责任人</label>
          <select
            v-model="localFilters.responsiblePerson"
            @change="updateFilters()"
            class="select"
          >
            <option value="all">全部责任人</option>
            <option v-for="p in RESPONSIBLE_PERSONS" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>
      </div>
      
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs text-slate-500 mb-1">影响等级</label>
          <select
            v-model="localFilters.impactLevel"
            @change="updateFilters()"
            class="select"
          >
            <option value="all">全部等级</option>
            <option v-for="i in IMPACT_LEVEL" :key="i.id" :value="i.id">{{ i.name }}</option>
          </select>
        </div>
        
        <div>
          <label class="block text-xs text-slate-500 mb-1">施工状态</label>
          <select
            v-model="localFilters.constructionStatus"
            @change="updateFilters()"
            class="select"
          >
            <option value="all">全部状态</option>
            <option v-for="s in CONSTRUCTION_STATUS" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
      </div>
      
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs text-slate-500 mb-1">处理状态</label>
          <select
            v-model="localFilters.status"
            @change="updateFilters()"
            class="select"
          >
            <option value="all">全部状态</option>
            <option v-for="s in CHANGE_STATUS" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
        
        <div>
          <label class="block text-xs text-slate-500 mb-1">来源类型</label>
          <select
            v-model="localFilters.sourceType"
            @change="updateFilters()"
            class="select"
          >
            <option value="all">全部来源</option>
            <option v-for="s in SOURCE_TYPES" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
      </div>
    </div>
    
    <div class="mt-4 pt-4 border-t border-slate-100">
      <div class="text-xs text-slate-500 flex items-center justify-between">
        <span>当前筛选结果</span>
        <span class="font-semibold text-slate-700">
          {{ store.change.filteredChanges.length }} 条
        </span>
      </div>
      <div class="text-xs text-slate-400 mt-1">
        待确认：{{ pendingCount }} 条
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { Filter } from 'lucide-vue-next';
import { useChangeStore } from '../stores/changeStore';
import { 
  MAJORS, 
  RESPONSIBLE_PERSONS, 
  IMPACT_LEVEL, 
  CONSTRUCTION_STATUS, 
  CHANGE_STATUS, 
  SOURCE_TYPES 
} from '../data/constants';

const store = { change: useChangeStore() };

const localFilters = reactive({ ...store.change.filters });

const pendingCount = computed(() => 
  store.change.filteredChanges.filter(c => c.status === 'pending').length
);

const updateFilters = () => {
  store.change.setFilters({ ...localFilters });
};

watch(
  () => ({ ...store.change.filters }),
  (newFilters) => {
    Object.assign(localFilters, newFilters);
  },
  { deep: true }
);
</script>
