<template>
  <div v-if="visible" class="modal-mask" @click.self="$emit('close')">
    <div class="modal-dialog" :class="{ wide }">
      <div class="modal-header">
        <h3 class="modal-title">{{ title }}</h3>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      <div class="modal-body"><slot></slot></div>
      <div v-if="$slots.footer" class="modal-footer"><slot name="footer"></slot></div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '' },
  wide: { type: Boolean, default: false }
})
defineEmits(['close'])
</script>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(2px);
}
.modal-dialog {
  background: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 640px;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.2s ease;
}
.modal-dialog.wide { max-width: 880px; }
@keyframes slideIn {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.modal-title { margin: 0; font-size: 16px; font-weight: 600; color: #262626; }
.close-btn {
  width: 32px; height: 32px;
  border: none; background: transparent;
  font-size: 24px; color: #8c8c8c;
  cursor: pointer; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.close-btn:hover { background: #f5f5f5; color: #262626; }
.modal-body { padding: 20px; overflow-y: auto; flex: 1; }
.modal-footer { padding: 12px 20px; border-top: 1px solid #f0f0f0; }
</style>
