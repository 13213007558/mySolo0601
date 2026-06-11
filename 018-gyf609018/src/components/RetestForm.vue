<template>
  <ModalFrame :visible="state.ui.showRetest" :title="`返修复测 - ${targetInfo}`" @close="closeRetest">
    <div v-if="targetRec" class="retest-form">
      <div class="origin-info">
        <div class="origin-title">📋 原始闭水信息</div>
        <div class="origin-grid">
          <div class="origin-item"><span>首次结论</span><strong :class="'con-' + targetRec.leakConclusion">{{ firstCon }}</strong></div>
          <div class="origin-item"><span>渗漏部位</span>{{ targetRec.leakLocation || '--' }}</div>
          <div class="origin-item"><span>已复测</span>{{ retestCount }} 次</div>
        </div>
      </div>

      <form @submit.prevent="onSubmit">
        <div class="form-section">
          <h4 class="section-title">⏱ 本次复测时间</h4>
          <div class="form-grid">
            <FormItem label="开始时间" required>
              <input type="datetime-local" v-model="form.startTimeLocal" required />
            </FormItem>
            <FormItem label="结束时间" required>
              <input type="datetime-local" v-model="form.endTimeLocal" required />
            </FormItem>
            <div v-if="computedDuration > 0" class="duration-hint" :class="computedDuration < 24 ? 'danger' : 'ok'">
              本次蓄水时长：<strong>{{ computedDuration.toFixed(1) }}</strong> 小时
              <span v-if="computedDuration < 24"> ⚠ 不足24小时</span>
              <span v-else> ✓ 符合要求</span>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h4 class="section-title">📊 复测数据</h4>
          <div class="form-grid">
            <FormItem label="蓄水深度(cm)" required>
              <input type="number" v-model.number="form.waterDepthCm" min="0" step="0.1" placeholder="建议≥2cm" required />
            </FormItem>
            <FormItem label="照片拍摄时间">
              <input type="datetime-local" v-model="form.photoTimeLocal" />
            </FormItem>
            <div class="full-width">
              <FormItem label="复测照片">
                <PhotoUpload v-model="form.photoUrl" />
              </FormItem>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h4 class="section-title">🔍 复测结论</h4>
          <div class="form-grid">
            <FormItem label="结论" required full>
              <div class="radio-group">
                <label class="radio pass"><input type="radio" v-model="form.leakConclusion" value="pass" /> ✅ 通过（闭环）</label>
                <label class="radio leak"><input type="radio" v-model="form.leakConclusion" value="leak" /> ❌ 仍渗漏（需继续返工）</label>
              </div>
            </FormItem>
            <FormItem v-if="form.leakConclusion === 'leak'" label="渗漏部位" full>
              <input v-model="form.leakLocation" placeholder="如：墙面、管道根部、新部位等" maxlength="100" />
            </FormItem>
            <FormItem label="复测说明" full>
              <textarea v-model="form.remark" rows="2" placeholder="返工措施、本次情况等" maxlength="500"></textarea>
            </FormItem>
          </div>
        </div>

        <div v-if="timeErrors.length > 0" class="validation-alert">
          <div v-for="(e, i) in timeErrors" :key="i">⚠ {{ e }}</div>
        </div>
        <div v-if="photoError" class="validation-alert">⚠ {{ photoError }}</div>

        <div class="form-actions">
          <button type="button" class="btn btn-ghost" @click="closeRetest">取消</button>
          <button type="submit" class="btn btn-primary">提交复测记录</button>
        </div>
      </form>
    </div>
  </ModalFrame>
</template>

<script setup>
import { reactive, computed, watch } from 'vue'
import { useWaterproofStore } from '../stores/waterproof.js'
import {
  validateTimeRange, validatePhotoTime, toLocalInputValue, fromLocalInputValue,
  durationHours, nowISO
} from '../utils/validators.js'
import ModalFrame from './ModalFrame.vue'
import FormItem from './FormItem.vue'
import PhotoUpload from './PhotoUpload.vue'

const { state, closeRetest, addRetest, getById } = useWaterproofStore()

const targetRec = computed(() => state.ui.retestRecordId ? getById(state.ui.retestRecordId) : null)
const targetInfo = computed(() => targetRec.value ? `${targetRec.value.building} ${targetRec.value.roomNumber} ${targetRec.value.roomType}` : '')
const retestCount = computed(() => (targetRec.value?.retests || []).length)
const firstCon = computed(() => ({ pass: '✅ 通过', leak: '❌ 渗漏', pending: '⏳ 待定' }[targetRec.value?.leakConclusion] || '--'))

const form = reactive({
  startTimeLocal: toLocalInputValue(nowISO()),
  endTimeLocal: '',
  waterDepthCm: 3,
  photoUrl: '',
  photoTimeLocal: '',
  leakConclusion: 'pass',
  leakLocation: '',
  remark: ''
})

watch(() => state.ui.showRetest, (v) => {
  if (v) {
    form.startTimeLocal = toLocalInputValue(nowISO())
    form.endTimeLocal = ''
    form.waterDepthCm = 3
    form.photoUrl = ''
    form.photoTimeLocal = ''
    form.leakConclusion = 'pass'
    form.leakLocation = ''
    form.remark = ''
  }
})

const startTime = computed(() => fromLocalInputValue(form.startTimeLocal))
const endTime = computed(() => fromLocalInputValue(form.endTimeLocal))
const photoTime = computed(() => fromLocalInputValue(form.photoTimeLocal))
const computedDuration = computed(() => durationHours(startTime.value, endTime.value))
const timeErrors = computed(() => validateTimeRange(startTime.value, endTime.value))
const photoError = computed(() => validatePhotoTime(photoTime.value, endTime.value))

function onSubmit() {
  if (timeErrors.value.length || photoError.value) {
    if (!confirm('存在异常项，是否仍继续保存？')) return
  }
  if (!targetRec.value) return
  addRetest(targetRec.value.id, {
    startTime: startTime.value,
    endTime: endTime.value,
    waterDepthCm: form.waterDepthCm,
    photoUrl: form.photoUrl,
    photoTime: photoTime.value,
    leakConclusion: form.leakConclusion,
    leakLocation: form.leakConclusion === 'leak' ? form.leakLocation : '',
    remark: form.remark
  })
  closeRetest()
}
</script>

<style scoped>
.retest-form { }
.origin-info {
  background: linear-gradient(135deg, #fff7e6, #fffbe6);
  border: 1px solid #ffe58f;
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 20px;
}
.origin-title { font-size: 13px; font-weight: 600; color: #613400; margin-bottom: 10px; }
.origin-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.origin-item { display: flex; flex-direction: column; gap: 2px; }
.origin-item span { font-size: 11px; color: #8c6b00; }
.origin-item strong { font-size: 14px; color: #262626; }
.origin-item .con-pass { color: #52c41a; }
.origin-item .con-leak { color: #ff4d4f; }
.origin-item .con-pending { color: #faad14; }

.form-section { margin-bottom: 20px; }
.section-title {
  margin: 0 0 12px;
  font-size: 14px;
  color: #262626;
  padding-bottom: 8px;
  border-bottom: 1px dashed #f0f0f0;
}
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 20px; }
.full-width { grid-column: 1 / -1; }
.duration-hint { grid-column: 1 / -1; padding: 10px 14px; border-radius: 8px; font-size: 13px; }
.duration-hint.ok { background: #f6ffed; color: #389e0d; border: 1px solid #b7eb8f; }
.duration-hint.danger { background: #fff1f0; color: #cf1322; border: 1px solid #ffa39e; }

.radio-group { display: flex; gap: 12px; }
.radio {
  flex: 1;
  padding: 10px 14px;
  border: 2px solid #f0f0f0;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 500;
}
.radio:hover { border-color: #d9d9d9; }
.radio.pass:has(input:checked) { border-color: #52c41a; background: #f6ffed; color: #389e0d; }
.radio.leak:has(input:checked) { border-color: #ff4d4f; background: #fff1f0; color: #cf1322; }
.radio input { accent-color: #1677ff; }

.validation-alert {
  background: #fff1f0;
  border: 1px solid #ffa39e;
  color: #cf1322;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.8;
  margin-bottom: 14px;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid #f5f5f5;
}
</style>
