<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="card p-4">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs text-slate-500">变更总数</span>
        <span class="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
          {{ currentFloorLabel }}
        </span>
      </div>
      <div class="text-2xl font-bold text-slate-800">{{ store.change.floorStats.total }}</div>
      <div class="mt-2 flex items-center gap-2 text-xs">
        <span class="tag bg-amber-100 text-amber-700">
          待确认 {{ store.change.floorStats.pending }}
        </span>
        <span class="tag bg-blue-100 text-blue-700">
          已确认 {{ store.change.floorStats.confirmed }}
        </span>
      </div>
    </div>
    
    <div class="card p-4">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs text-slate-500">成本影响总计</span>
        <DollarSign class="w-4 h-4 text-emerald-500" />
      </div>
      <div class="text-2xl font-bold text-emerald-600">{{ formatCurrency(store.change.floorStats.totalCost) }}</div>
      <div class="mt-2 flex items-center gap-1 text-xs text-slate-500">
        <span>含</span>
        <span class="text-red-600 font-medium">
          {{ store.change.floorStats.constructedCount }}
        </span>
        <span>条已施工区域返工</span>
      </div>
    </div>
    
    <div class="card p-4">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs text-slate-500">进度影响总计</span>
        <Clock class="w-4 h-4 text-orange-500" />
      </div>
      <div :class="[
        'text-2xl font-bold',
        store.change.floorStats.totalDays > 0 ? 'text-orange-600' : 'text-emerald-600'
      ]">
        {{ formatDays(store.change.floorStats.totalDays) }}
      </div>
      <div class="mt-2 flex items-center gap-2 text-xs">
        <span class="tag bg-amber-100 text-amber-700">
          部分施工 {{ store.change.floorStats.partialCount }}
        </span>
        <span class="tag bg-blue-100 text-blue-700">
          仅图纸 {{ store.change.floorStats.drawingCount }}
        </span>
      </div>
    </div>
    
    <div class="card p-4">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs text-slate-500">影响等级分布</span>
        <AlertTriangle class="w-4 h-4 text-red-500" />
      </div>
      <div class="flex items-center gap-2">
        <span class="text-lg font-bold text-red-600">{{ store.change.floorStats.highImpact }}</span>
        <span class="text-xs text-slate-400">高</span>
        <span class="text-lg font-bold text-amber-600">{{ store.change.floorStats.mediumImpact }}</span>
        <span class="text-xs text-slate-400">中</span>
        <span class="text-lg font-bold text-green-600">{{ store.change.floorStats.lowImpact }}</span>
        <span class="text-xs text-slate-400">低</span>
      </div>
      <div class="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden flex">
        <div 
          v-if="store.change.floorStats.total > 0"
          class="bg-red-500 h-full"
          :style="{ width: (store.change.floorStats.highImpact / store.change.floorStats.total * 100) + '%' }"
        ></div>
        <div 
          v-if="store.change.floorStats.total > 0"
          class="bg-amber-500 h-full"
          :style="{ width: (store.change.floorStats.mediumImpact / store.change.floorStats.total * 100) + '%' }"
        ></div>
        <div 
          v-if="store.change.floorStats.total > 0"
          class="bg-green-500 h-full"
          :style="{ width: (store.change.floorStats.lowImpact / store.change.floorStats.total * 100) + '%' }"
        ></div>
        <div 
          v-if="store.change.floorStats.total > 0"
          class="bg-slate-400 h-full"
          :style="{ width: (store.change.floorStats.noImpact / store.change.floorStats.total * 100) + '%' }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useChangeStore } from '../stores/changeStore';
import { DollarSign, Clock, AlertTriangle } from 'lucide-vue-next';
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
