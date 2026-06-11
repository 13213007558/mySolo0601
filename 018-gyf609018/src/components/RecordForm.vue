<template>
  <ModalFrame :visible="state.ui.showForm" :title="isEdit ? '编辑闭水试验记录' : '新增闭水试验记录'" @close="closeForm">
    <form class="record-form" @submit.prevent="onSubmit">
      <div class="form-section">
        <h4 class="section-title">📍 位置信息</h4>
        <div class="form-grid">
          <FormItem label="楼栋" required>
            <select v-model="form.building" required>
              <option value="">请选择</option>
              <option v-for="b in buildings" :key="b" :value="b">{{ b }}</option>
            </select>
          </FormItem>
          <FormItem label="单元">
            <input v-model="form.unit" placeholder="如：1单元、2单元" maxlength="20" />
          </FormItem>
          <FormItem label="户号" required>
            <input v-model="form.roomNumber" placeholder="如：101、202" required maxlength="10" />
          </FormItem>
          <FormItem label="房间类型" required>
            <select v-model="form.roomType" required>
              <option value="">请选择</option>
              <option v-for="r in roomTypes" :key="r" :value="r">{{ r }}</option>
            </select>
          </FormItem>
          <FormItem label="质量员">
            <input v-model="form.inspector" placeholder="填姓名或工号" maxlength="20" />
          </FormItem>
        </div>
      </div>

      <div class="form-section">
        <h4 class="section-title">⏱ 闭水时间（系统自动校验时长≥24h）</h4>
        <div class="form-grid">
          <FormItem label="开始时间" required>
            <input type="datetime-local" v-model="form.startTimeLocal" required />
          </FormItem>
          <FormItem label="结束时间" required>
            <input type="datetime-local" v-model="form.endTimeLocal" required />
          </FormItem>
          <div v-if="computedDuration > 0" class="duration-hint" :class="computedDuration < 24 ? 'danger' : 'ok'">
            蓄水时长：<strong>{{ computedDuration.toFixed(1) }}</strong> 小时
            <span v-if="computedDuration < 24"> ⚠ 不足24小时，记录将被标记异常</span>
            <span v-else> ✓ 符合要求</span>
          </div>
        </div>
      </div>

      <div class="form-section">
        <h4 class="section-title">📊 水位与证据</h4>
        <div class="form-grid">
          <FormItem label="蓄水深度(cm)" required>
            <input type="number" v-model.number="form.waterDepthCm" min="0" step="0.1" placeholder="建议≥2cm" required />
          </FormItem>
          <FormItem label="照片拍摄时间">
            <input type="datetime-local" v-model="form.photoTimeLocal" />
            <div class="field-hint">照片时间须早于结束时间</div>
          </FormItem>
          <div class="full-width">
            <FormItem label="水位照片">
              <PhotoUpload v-model="form.photoUrl" />
            </FormItem>
          </div>
        </div>
      </div>

      <div class="form-section">
        <h4 class="section-title">🔍 渗漏结论</h4>
        <div class="form-grid">
          <FormItem label="结论" required full>
            <div class="radio-group">
              <label class="radio pass"><input type="radio" v-model="form.leakConclusion" value="pass" /> ✅ 通过</label>
              <label class="radio leak"><input type="radio" v-model="form.leakConclusion" value="leak" /> ❌ 渗漏</label>
              <label class="radio pending"><input type="radio" v-model="form.leakConclusion" value="pending" /> ⏳ 待定</label>
            </div>
          </FormItem>
          <FormItem v-if="form.leakConclusion === 'leak'" label="渗漏部位" full>
            <input v-model="form.leakLocation" placeholder="如：墙角、管道周边、门槛处" maxlength="100" />
          </FormItem>
          <FormItem label="备注" full>
            <textarea v-model="form.remark" rows="2" placeholder="其他说明（选填）" maxlength="500"></textarea>
          </FormItem>
        </div>
      </div>

      <div v-if="timeErrors.length > 0" class="validation-alert">
        <div v-for="(e, i) in timeErrors" :key="i">⚠ {{ e }}</div>
      </div>
      <div v-if="photoError" class="validation-alert">⚠ {{ photoError }}</div>

      <div class="form-actions">
        <button type="button" class="btn btn-ghost" @click="closeForm">取消</button>
        <button type="submit" class="btn btn-primary">{{ isEdit ? '保存修改' : '创建记录' }}</button>
      </div>
    </form>
  </ModalFrame>
</template>

<script setup>
import { reactive, computed, watch } from 'vue'
import { useWaterproofStore } from '../stores/waterproof.js'
import {
  validateTimeRange, validatePhotoTime, toLocalInputValue, fromLocalInputValue,
  durationHours, nowISO
} from '../utils/validators.js'
import { fileToBase64 } from '../utils/storage.js'
import ModalFrame from './ModalFrame.vue'
import FormItem from './FormItem.vue'
import PhotoUpload from './PhotoUpload.vue'

const { state, buildings, roomTypes, openForm, closeForm, addRecord, updateRecord, getById } = useWaterproofStore()

const form = reactive({
  building: '',
  unit: '',
  roomNumber: '',
  roomType: '',
  inspector: '',
  startTimeLocal: '',
  endTimeLocal: '',
  waterDepthCm: 3,
  photoUrl: '',
  photoTimeLocal: '',
  leakConclusion: 'pending',
  leakLocation: '',
  remark: ''
})

const isEdit = computed(() => !!state.ui.editingId)

watch(() => state.ui.showForm, (v) => {
  if (v) {
    if (state.ui.editingId) {
      const r = getById(state.ui.editingId)
      if (r) {
        form.building = r.building
        form.unit = r.unit || ''
        form.roomNumber = r.roomNumber
        form.roomType = r.roomType
        form.inspector = r.inspector || ''
        form.startTimeLocal = toLocalInputValue(r.startTime)
        form.endTimeLocal = toLocalInputValue(r.endTime)
        form.waterDepthCm = r.waterDepthCm ?? 3
        form.photoUrl = r.photoUrl || ''
        form.photoTimeLocal = toLocalInputValue(r.photoTime)
        form.leakConclusion = r.leakConclusion || 'pending'
        form.leakLocation = r.leakLocation || ''
        form.remark = r.remark || ''
      }
    } else {
      Object.assign(form, {
        building: state.filters.building || '',
        unit: state.filters.unit || '',
        roomNumber: state.filters.roomNumber || '',
        roomType: '',
        inspector: '',
        startTimeLocal: toLocalInputValue(nowISO()),
        endTimeLocal: '',
        waterDepthCm: 3,
        photoUrl: '',
        photoTimeLocal: '',
        leakConclusion: 'pending',
        leakLocation: '',
        remark: ''
      })
    }
  }
})

const startTime = computed(() => fromLocalInputValue(form.startTimeLocal))
const endTime = computed(() => fromLocalInputValue(form.endTimeLocal))
const photoTime = computed(() => fromLocalInputValue(form.photoTimeLocal))
const computedDuration = computed(() => durationHours(startTime.value, endTime.value))
const timeErrors = computed(() => validateTimeRange(startTime.value, endTime.value))
const photoError = computed(() => validatePhotoTime(photoTime.value, endTime.value))

function onSubmit() {
  if (!form.building || !form.roomNumber || !form.roomType) {
    alert('请完整填写位置信息')
    return
  }
  if (timeErrors.value.length || photoError.value) {
    if (!confirm('存在异常项，是否仍继续保存？（记录将被标记异常）')) return
  }
  const payload = {
    building: form.building,
    unit: form.unit,
    roomNumber: form.roomNumber,
    roomType: form.roomType,
    inspector: form.inspector,
    startTime: startTime.value,
    endTime: endTime.value,
    waterDepthCm: form.waterDepthCm,
    photoUrl: form.photoUrl,
    photoTime: photoTime.value,
    leakConclusion: form.leakConclusion,
    leakLocation: form.leakConclusion === 'leak' ? form.leakLocation : '',
    remark: form.remark
  }
  if (isEdit.value) updateRecord(state.ui.editingId, payload)
  else addRecord(payload)
  closeForm()
}
</script>

<style scoped>
.record-form { padding: 4px 4px 8px; }
.form-section { margin-bottom: 22px; }
.section-title {
  margin: 0 0 14px;
  font-size: 14px;
  color: #262626;
  padding-bottom: 8px;
  border-bottom: 1px dashed #f0f0f0;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 20px;
}
.form-grid .full-width { grid-column: 1 / -1; }
.duration-hint {
  grid-column: 1 / -1;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
}
.duration-hint.ok { background: #f6ffed; color: #389e0d; border: 1px solid #b7eb8f; }
.duration-hint.danger { background: #fff1f0; color: #cf1322; border: 1px solid #ffa39e; }

.radio-group { display: flex; gap: 12px; flex-wrap: wrap; }
.radio {
  flex: 1;
  min-width: 110px;
  padding: 10px 14px;
  border: 2px solid #f0f0f0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 500;
}
.radio:hover { border-color: #d9d9d9; }
.radio.pass input:checked + *, .radio.pass:has(input:checked) { border-color: #52c41a; background: #f6ffed; color: #389e0d; }
.radio.leak input:checked + *, .radio.leak:has(input:checked) { border-color: #ff4d4f; background: #fff1f0; color: #cf1322; }
.radio.pending input:checked + *, .radio.pending:has(input:checked) { border-color: #faad14; background: #fffbe6; color: #ad6800; }
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
