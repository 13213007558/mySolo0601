<template>
  <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-semibold text-slate-700 flex items-center gap-2">
        <Building2 class="w-4 h-4" />
        楼层选择
      </h3>
      <span class="text-xs text-slate-500">
        切换楼层联动显示成本、进度、责任专业影响
      </span>
    </div>
    
    <div class="space-y-3">
      <div class="flex items-center gap-2">
        <button
          @click="store.setSelectedFloor('all')"
          :class="[
            'floor-btn',
            store.selectedFloorId === 'all' ? 'floor-btn-active' : 'floor-btn-inactive'
          ]"
        >
          <Layers class="w-4 h-4" />
          全部楼层
        </button>
      </div>
      
      <div>
        <div class="text-xs text-slate-400 mb-1.5">地下层</div>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="floor in basementFloors"
            :key="floor.id"
            @click="store.setSelectedFloor(floor.id)"
            :class="[
              'floor-btn text-xs',
              store.selectedFloorId === floor.id ? 'floor-btn-active' : 'floor-btn-inactive'
            ]"
          >
            {{ floor.name }}
          </button>
        </div>
      </div>
      
      <div>
        <div class="text-xs text-slate-400 mb-1.5">地上层</div>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="floor in aboveGroundFloors"
            :key="floor.id"
            @click="store.setSelectedFloor(floor.id)"
            :class="[
              'floor-btn text-xs',
              store.selectedFloorId === floor.id ? 'floor-btn-active' : 'floor-btn-inactive'
            ]"
          >
            {{ floor.name }}
          </button>
        </div>
      </div>
      
      <div>
        <div class="text-xs text-slate-400 mb-1.5">屋面层</div>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="floor in roofFloors"
            :key="floor.id"
            @click="store.setSelectedFloor(floor.id)"
            :class="[
              'floor-btn text-xs',
              store.selectedFloorId === floor.id ? 'floor-btn-active' : 'floor-btn-inactive'
            ]"
          >
            {{ floor.name }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Building2, Layers } from 'lucide-vue-next';
import { FLOORS } from '../data/constants';
import { useChangeStore } from '../stores/changeStore';

const store = useChangeStore();

const basementFloors = computed(() => FLOORS.filter(f => f.type === 'basement'));
const aboveGroundFloors = computed(() => FLOORS.filter(f => f.type === 'above' || f.type === 'ground'));
const roofFloors = computed(() => FLOORS.filter(f => f.type === 'roof'));
</script>
