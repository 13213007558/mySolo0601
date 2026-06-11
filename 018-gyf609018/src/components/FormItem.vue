<template>
  <div class="form-item" :class="{ full }">
    <label class="form-label">
      <span v-if="required" class="req">*</span>{{ label }}
    </label>
    <div class="form-control"><slot></slot></div>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, default: '' },
  required: { type: Boolean, default: false },
  full: { type: Boolean, default: false }
})
</script>

<style scoped>
.form-item { display: flex; flex-direction: column; gap: 6px; }
.form-item.full { grid-column: 1 / -1; }
.form-label {
  font-size: 13px;
  color: #595959;
  font-weight: 500;
}
.req { color: #ff4d4f; margin-right: 2px; }
.form-control { width: 100%; }
.form-control :deep(input),
.form-control :deep(select),
.form-control :deep(textarea) {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  background: #fff;
  outline: none;
  transition: all 0.2s;
  box-sizing: border-box;
  font-family: inherit;
}
.form-control :deep(textarea) { resize: vertical; min-height: 60px; }
.form-control :deep(input:focus),
.form-control :deep(select:focus),
.form-control :deep(textarea:focus) {
  border-color: #1677ff;
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.1);
}
.field-hint { font-size: 11px; color: #8c8c8c; margin-top: 4px; }
</style>
