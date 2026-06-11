<template>
  <div class="stat-card" :style="{ '--c': color }">
    <div class="icon-box">{{ icon }}</div>
    <div class="info">
      <div class="label">{{ label }}</div>
      <div class="value">{{ value }}</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, default: '' },
  value: { type: Number, default: 0 },
  icon: { type: String, default: '📊' },
  color: { type: String, default: '#1677ff' }
})
</script>

<style scoped>
.stat-card {
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border-left: 4px solid var(--c);
  transition: all 0.2s;
}
.stat-card:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08); }
.icon-box {
  width: 48px; height: 48px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--c) 15%, #fff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}
.info { flex: 1; min-width: 0; }
.label { font-size: 12px; color: #8c8c8c; margin-bottom: 4px; }
.value { font-size: 24px; font-weight: 700; color: var(--c); font-family: 'SF Mono', Menlo, monospace; }
</style>
