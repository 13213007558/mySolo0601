<template>
  <div class="filter-bar">
    <div class="filter-row">
      <div class="filter-item">
        <label>楼栋</label>
        <select v-model="local.building" @change="onChange">
          <option value="">全部楼栋</option>
          <option v-for="b in buildings" :key="b" :value="b">{{ b }}</option>
        </select>
      </div>
      <div class="filter-item">
        <label>单元</label>
        <select v-model="local.unit" @change="onChange" :disabled="!local.building">
          <option value="">全部单元</option>
          <option v-for="u in availableUnits" :key="u" :value="u">{{ u }}</option>
          <option v-if="local.building && availableUnits.length === 0">无</option>
        </select>
      </div>
      <div class="filter-item">
        <label>户号</label>
        <select v-model="local.roomNumber" @change="onChange">
          <option value="">全部户号</option>
          <option v-for="r in availableRoomNumbers" :key="r" :value="r">{{ r }}</option>
        </select>
      </div>
      <div class="filter-item">
        <label>状态</label>
        <select v-model="local.status" @change="onChange">
          <option value="">全部状态</option>
          <option value="normal">🟢 正常通过</option>
          <option value="pending_retest">🟡 待复测</option>
          <option value="abnormal">🔴 时间异常</option>
          <option value="warning">🟠 水位不足</option>
          <option value="incomplete">⚪ 未完成</option>
        </select>
      </div>
      <button class="btn btn-ghost" @click="onReset">重置筛选</button>
    </div>
    <div class="filter-actions">
      <div class="result-count">
        结果：<strong>{{ count }}</strong> 条
      </div>
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { useWaterproofStore } from '../stores/waterproof.js'

const props = defineProps({ count: { type: Number, default: 0 } })
const { buildings, availableUnits, availableRoomNumbers, setFilters, resetFilters, state } = useWaterproofStore()

const local = reactive({
  building: state.filters.building,
  unit: state.filters.unit,
  roomNumber: state.filters.roomNumber,
  status: state.filters.status
})

watch(() => state.filters, v => {
  local.building = v.building
  local.unit = v.unit
  local.roomNumber = v.roomNumber
  local.status = v.status
}, { deep: true })

function onChange() {
  if (local.building !== state.filters.building) local.unit = ''
  setFilters(local)
}
function onReset() {
  local.building = ''; local.unit = ''; local.roomNumber = ''; local.status = ''
  resetFilters()
}
</script>

<style scoped>
.filter-bar {
  background: #fff;
  border-radius: 10px;
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  margin-bottom: 20px;
}
.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
}
.filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 140px;
}
.filter-item label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}
.filter-item select {
  padding: 8px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  background: #fff;
  outline: none;
  transition: all 0.2s;
}
.filter-item select:focus { border-color: #1677ff; box-shadow: 0 0 0 2px rgba(22,119,255,0.1); }
.filter-item select:disabled { background: #f5f5f5; color: #bfbfbf; }
.filter-actions {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.result-count { font-size: 13px; color: #666; }
.result-count strong { color: #1677ff; font-size: 15px; margin: 0 2px; }
</style>
