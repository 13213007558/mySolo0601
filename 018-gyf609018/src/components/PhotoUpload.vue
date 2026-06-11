<template>
  <div class="photo-upload">
    <div v-if="modelValue" class="preview-wrap">
      <img :src="modelValue" alt="预览" />
      <div class="preview-actions">
        <button type="button" class="btn btn-sm btn-warn" @click="triggerInput">重新上传</button>
        <button type="button" class="btn btn-sm btn-danger" @click="clearImage">移除</button>
      </div>
    </div>
    <label v-else class="uploader-box" @click="triggerInput">
      <input ref="inputRef" type="file" accept="image/*" style="display:none" @change="onFileChange" />
      <div class="upload-icon">📸</div>
      <div class="upload-text">点击上传水位照片</div>
      <div class="upload-hint">支持 JPG/PNG，大小≤5MB</div>
    </label>
    <div v-if="errorMsg" class="upload-error">{{ errorMsg }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { fileToBase64 } from '../utils/storage.js'
const props = defineProps({ modelValue: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue'])
const inputRef = ref(null)
const errorMsg = ref('')

function triggerInput() { inputRef.value?.click() }

async function onFileChange(e) {
  errorMsg.value = ''
  const f = e.target.files?.[0]
  if (!f) return
  if (f.size > 5 * 1024 * 1024) { errorMsg.value = '图片大小不能超过 5MB'; return }
  if (!/^image\//.test(f.type)) { errorMsg.value = '请上传图片文件'; return }
  try {
    const b64 = await fileToBase64(f)
    emit('update:modelValue', b64)
  } catch (err) {
    errorMsg.value = '图片读取失败：' + err.message
  } finally {
    e.target.value = ''
  }
}
function clearImage() { emit('update:modelValue', '') }
</script>

<style scoped>
.photo-upload { }
.uploader-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 28px;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  background: #fafafa;
  transition: all 0.2s;
  gap: 6px;
}
.uploader-box:hover { border-color: #1677ff; background: #f0f7ff; }
.upload-icon { font-size: 36px; }
.upload-text { font-size: 14px; font-weight: 500; color: #262626; }
.upload-hint { font-size: 11px; color: #8c8c8c; }

.preview-wrap {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #f0f0f0;
}
.preview-wrap img {
  width: 100%;
  max-height: 240px;
  object-fit: cover;
  display: block;
}
.preview-actions {
  position: absolute;
  right: 8px;
  bottom: 8px;
  display: flex;
  gap: 6px;
}
.preview-actions .btn-sm { padding: 4px 10px; font-size: 12px; }
.upload-error { margin-top: 6px; font-size: 12px; color: #ff4d4f; }
</style>
