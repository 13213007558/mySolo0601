<template>
  <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
    <div class="p-4 border-b border-slate-100 flex items-center justify-between">
      <h3 class="text-sm font-semibold text-slate-700 flex items-center gap-2">
        <List class="w-4 h-4" />
        变更列表
        <span class="text-xs font-normal text-slate-400">
          共 {{ store.change.filteredChanges.length }} 条
        </span>
      </h3>
      <div class="flex items-center gap-2">
        <span v-if="store.change.floorStats.constructedCount > 0" class="text-xs text-red-600 bg-red-50 px-2 py-1 rounded flex items-center gap-1">
          <AlertTriangle class="w-3 h-3" />
          {{ store.change.floorStats.constructedCount }} 条已施工需返工
        </span>
      </div>
    </div>
    
    <div class="overflow-x-auto scrollbar-thin">
      <table class="w-full">
        <thead class="bg-slate-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">变更编号</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">标题</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">楼层</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">专业</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">施工状态</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">影响等级</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">责任人</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">处理状态</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">版本</th>
            <th class="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr 
            v-for="change in store.change.filteredChanges" 
            :key="change.id"
            :class="[
              getConstructionClass(change.constructionStatus),
              'hover:bg-slate-50 transition-colors cursor-pointer'
            ]"
            @click="store.change.openDetail(change.id)"
          >
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <span class="text-sm font-mono text-slate-700">{{ change.changeNo }}</span>
                <span v-if="change.version > 1" class="tag bg-purple-100 text-purple-700">
                  v{{ change.version }}
                </span>
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="max-w-xs">
                <div class="text-sm font-medium text-slate-800 truncate">{{ change.title }}</div>
                <div class="text-xs text-slate-400 truncate">{{ change.description }}</div>
              </div>
            </td>
            <td class="px-4 py-3">
              <span class="text-sm text-slate-600">{{ getFloorName(change.floorId) }}</span>
            </td>
            <td class="px-4 py-3">
              <span :class="['tag', getMajorColor(change.major)]">{{ getMajorName(change.major) }}</span>
            </td>
            <td class="px-4 py-3">
              <span :class="['tag', getConstructionTagClass(change.constructionStatus)]">
                {{ getConstructionName(change.constructionStatus) }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span :class="['tag', getImpactClass(change.impactLevel)]">
                {{ getImpactName(change.impactLevel) }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span v-if="change.responsiblePerson" class="text-sm text-slate-600">
                {{ getPersonName(change.responsiblePerson) }}
              </span>
              <span v-else class="text-xs text-slate-400">未分派</span>
            </td>
            <td class="px-4 py-3">
              <span :class="['badge', getStatusClass(change.status)]">
                {{ getStatusName(change.status) }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span class="text-sm text-slate-500">v{{ change.version }}</span>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex items-center justify-end gap-1" @click.stop>
                <button
                  v-if="change.status === 'pending' && change.constructionStatus === 'constructed'"
                  @click="store.change.openRevertModal(change.id)"
                  class="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                  title="撤回误判"
                >
                  <Undo2 class="w-4 h-4" />
                </button>
                <button
                  @click="store.change.openDetail(change.id)"
                  class="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="查看详情"
                >
                  <Eye class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="store.change.filteredChanges.length === 0">
            <td colspan="10" class="px-4 py-12 text-center">
              <div class="text-slate-400">
                <Search class="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p class="text-sm">没有找到匹配的变更</p>
                <p class="text-xs mt-1">尝试调整筛选条件</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { List, Eye, Undo2, Search, AlertTriangle } from 'lucide-vue-next';
import { useChangeStore } from '../stores/changeStore';
import { FLOORS, MAJORS, CONSTRUCTION_STATUS, IMPACT_LEVEL, CHANGE_STATUS, RESPONSIBLE_PERSONS } from '../data/constants';

const store = { change: useChangeStore() };

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

const getConstructionClass = (id) => {
  const status = CONSTRUCTION_STATUS.find(s => s.id === id);
  return status ? status.color : '';
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

const getStatusName = (id) => {
  const status = CHANGE_STATUS.find(s => s.id === id);
  return status ? status.name : id;
};

const getStatusClass = (id) => {
  const status = CHANGE_STATUS.find(s => s.id === id);
  return status ? status.color : 'bg-slate-100 text-slate-700';
};

const getPersonName = (id) => {
  const person = RESPONSIBLE_PERSONS.find(p => p.id === id);
  return person ? person.name : id;
};
</script>
