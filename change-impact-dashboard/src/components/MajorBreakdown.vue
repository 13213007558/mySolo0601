<template>
  <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
    <h3 class="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-4">
      <PieChart class="w-4 h-4" />
      责任专业分布（{{ currentFloorLabel }}）
    </h3>
    
    <div class="space-y-3">
      <div 
        v-for="major in store.change.majorBreakdown" 
        :key="major.id"
        class="p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span :class="['tag', major.color]">{{ major.name }}</span>
            <span class="text-sm font-semibold text-slate-700">{{ major.count }} 条</span>
            <span v-if="major.pending > 0" class="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
              {{ major.pending }} 待确认
            </span>
          </div>
          <div v-if="major.constructed > 0" class="text-xs text-red-600 flex items-center gap-1">
            <AlertCircle class="w-3 h-3" />
            {{ major.constructed }} 条已施工
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="flex items-center gap-1.5 text-slate-600">
            <DollarSign class="w-3 h-3 text-emerald-500" />
            <span>成本：</span>
            <span class="font-medium text-emerald-700">{{ formatCurrency(major.cost) }}</span>
          </div>
          <div class="flex items-center gap-1.5 text-slate-600">
            <Clock class="w-3 h-3 text-orange-500" />
            <span>工期：</span>
            <span :class="['font-medium', major.days > 0 ? 'text-orange-700' : 'text-emerald-700']">
              {{ formatDays(major.days) }}
            </span>
          </div>
        </div>
      </div>
      
      <div v-if="store.change.majorBreakdown.length === 0" class="text-center py-8 text-slate-400 text-sm">
        该楼层暂无变更
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { PieChart, AlertCircle, DollarSign, Clock } from 'lucide-vue-next';
import { useChangeStore } from '../stores/changeStore';
import { FLOORS } from '../data/constants';
import { formatCurrency, formatDays } from '../utils/storage';

const store = { change: useChangeStore() };

const currentFloorLabel = computed(() => {
  const floorId = store.change.selectedFloorId;
  if (floorId === 'all') return '全部楼层';
  const floor = FLOORS.find(f => f.id === floorId);
  return floor ? floor.name : floorId;
});
</script>
