<template>
  <div class="room-group">
    <div class="group-header">
      <h3 class="group-title">
        <span class="building-badge">{{ group.building }}</span>
        <span v-if="group.unit" class="unit-text">{{ group.unit }}</span>
        <span class="room-no">{{ group.roomNumber }}室</span>
        <span class="room-count">{{ group.items.length }} 间</span>
      </h3>
    </div>
    <div class="cards-grid">
      <RecordCard
        v-for="rec in group.items"
        :key="rec.id"
        :record="rec"
        :status="statusMap[rec.id]"
      />
    </div>
  </div>
</template>

<script setup>
import RecordCard from './RecordCard.vue'
import { useWaterproofStore } from '../stores/waterproof.js'
defineProps({ group: { type: Object, required: true } })
const { statusMap } = useWaterproofStore()
</script>

<style scoped>
.room-group { margin-bottom: 28px; }
.group-header {
  padding: 0 4px 10px;
  border-bottom: 2px solid #e6f4ff;
  margin-bottom: 16px;
}
.group-title {
  margin: 0;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.building-badge {
  background: linear-gradient(135deg, #1677ff, #4096ff);
  color: #fff;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
}
.unit-text {
  color: #595959;
  font-size: 14px;
  font-weight: 500;
}
.room-no {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}
.room-count {
  margin-left: auto;
  font-size: 12px;
  color: #8c8c8c;
  background: #fafafa;
  padding: 3px 10px;
  border-radius: 12px;
}
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}
</style>
