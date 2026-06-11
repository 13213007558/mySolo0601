<template>
  <div class="record-card" :class="'status-' + status.overall">
    <div class="card-header">
      <div class="room-type">
        <span class="icon">🚿</span>
        <span class="name">{{ record.roomType || '未命名房间' }}</span>
      </div>
      <span class="status-tag" :style="{ background: statusBg, color: statusFg }">
        {{ statusLabel }}
      </span>
    </div>

    <div class="card-body">
      <div class="info-grid">
        <div class="info-item">
          <span class="lbl">开始</span>
          <span class="val">{{ fmt(record.startTime) || '--' }}</span>
        </div>
        <div class="info-item">
          <span class="lbl">结束</span>
          <span class="val">{{ fmt(record.endTime) || '--' }}</span>
        </div>
        <div class="info-item">
          <span class="lbl">时长</span>
          <span class="val" :class="{ danger: duration < 24 && duration > 0 }">
            {{ duration ? duration.toFixed(1) + 'h' : '--' }}
          </span>
        </div>
        <div class="info-item">
          <span class="lbl">水位</span>
          <span class="val" :class="{ danger: hasLowWater }">
            {{ record.waterDepthCm != null ? record.waterDepthCm + 'cm' : '--' }}
          </span>
        </div>
        <div class="info-item full">
          <span class="lbl">质量员</span>
          <span class="val">{{ record.inspector || '--' }}</span>
        </div>
      </div>

      <div v-if="record.photoUrl" class="photo-wrap">
        <div class="photo-label">
          📷 水位照片
          <span v-if="record.photoTime" class="photo-time">拍摄 {{ fmt(record.photoTime) }}</span>
        </div>
        <div class="photo-frame" @click="previewPhoto">
          <img :src="record.photoUrl" alt="水位照片" />
          <div class="photo-mask">点击查看</div>
        </div>
      </div>

      <div class="conclusion-block">
        <div class="conclusion-row">
          <span class="con-label">首次结论：</span>
          <span :class="['con-value', conclusionClass]">{{ conclusionText }}</span>
        </div>
        <div v-if="record.leakLocation" class="leak-loc">
          📍 渗漏部位：{{ record.leakLocation }}
        </div>
        <div v-if="record.remark" class="remark-text">
          💬 {{ record.remark }}
        </div>
      </div>

      <div v-if="status.issues.length > 0" class="issues-block">
        <div v-for="(it, i) in status.issues" :key="i" class="issue-item" :class="'issue-' + it.type">
          ⚠ {{ it.msg }}
        </div>
      </div>

      <div v-if="record.retests && record.retests.length > 0" class="retest-block">
        <div class="retest-title">
          🔁 返修复测记录 <span class="retest-count">{{ record.retests.length }}次</span>
          <span v-if="status.closedLoop" class="closed-badge">✅ 已闭环</span>
          <span v-else class="open-badge">⏳ 进行中</span>
        </div>
        <div v-for="(rt, idx) in record.retests" :key="rt.id" class="retest-item">
          <div class="retest-head">
            <span class="retest-no">第{{ idx + 1 }}次</span>
            <span :class="['retest-con', rt.leakConclusion === 'pass' ? 'pass' : 'leak']">
              {{ rt.leakConclusion === 'pass' ? '通过' : '渗漏' }}
            </span>
          </div>
          <div class="retest-meta">
            {{ fmt(rt.startTime) }} ~ {{ fmt(rt.endTime) }}
          </div>
          <div v-if="rt.photoUrl" class="retest-photo" @click="previewUrl(rt.photoUrl)">
            📷 照片 <span class="hint">（点击查看）</span>
          </div>
          <div v-if="rt.leakLocation" class="retest-leak">📍 {{ rt.leakLocation }}</div>
          <div v-if="rt.remark" class="retest-remark">💬 {{ rt.remark }}</div>
        </div>
      </div>
    </div>

    <div class="card-footer">
      <button class="btn btn-sm btn-ghost" @click="onEdit">✏ 编辑</button>
      <button class="btn btn-sm btn-warn" @click="onRetest">🔁 返修复测</button>
      <button class="btn btn-sm btn-danger" @click="onDelete">🗑 删除</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatDateTime, durationHours, STATUS_LABEL, STATUS_COLOR, REQUIRED_WATER_DEPTH_CM } from '../utils/validators.js'
import { useWaterproofStore } from '../stores/waterproof.js'

const props = defineProps({
  record: { type: Object, required: true },
  status: { type: Object, required: true }
})
const emit = defineEmits(['preview'])
const { openForm, openRetest, deleteRecord } = useWaterproofStore()

const fmt = t => formatDateTime(t)
const duration = computed(() => durationHours(props.record.startTime, props.record.endTime))
const hasLowWater = computed(() => props.record.waterDepthCm != null && props.record.waterDepthCm < REQUIRED_WATER_DEPTH_CM)
const statusLabel = computed(() => STATUS_LABEL[props.status.overall] || props.status.overall)
const statusBg = computed(() => STATUS_COLOR[props.status.overall] + '22')
const statusFg = computed(() => STATUS_COLOR[props.status.overall])

const conclusionText = computed(() => {
  const map = { pass: '✅ 通过', leak: '❌ 渗漏', pending: '⏳ 待定' }
  return map[props.record.leakConclusion] || '未填写'
})
const conclusionClass = computed(() => ({
  'con-pass': props.record.leakConclusion === 'pass',
  'con-leak': props.record.leakConclusion === 'leak',
  'con-pending': props.record.leakConclusion === 'pending' || !props.record.leakConclusion
}))

function onEdit() { openForm(props.record.id) }
function onRetest() { openRetest(props.record.id) }
function onDelete() {
  if (confirm(`确认删除 ${props.record.building}-${props.record.roomNumber} ${props.record.roomType} 的闭水记录吗？此操作不可撤销。`)) {
    deleteRecord(props.record.id)
  }
}
function previewPhoto() {
  if (props.record.photoUrl) emit('preview', props.record.photoUrl)
}
function previewUrl(url) { emit('preview', url) }
</script>

<style scoped>
.record-card {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #f0f0f0;
  overflow: hidden;
  transition: all 0.25s;
  display: flex;
  flex-direction: column;
}
.record-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}
.record-card.status-normal { border-top: 3px solid #52c41a; }
.record-card.status-pending_retest { border-top: 3px solid #faad14; }
.record-card.status-abnormal { border-top: 3px solid #ff4d4f; }
.record-card.status-warning { border-top: 3px solid #fa8c16; }
.record-card.status-incomplete { border-top: 3px solid #8c8c8c; }

.card-header {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fafafa;
  border-bottom: 1px solid #f5f5f5;
}
.room-type { display: flex; align-items: center; gap: 6px; font-weight: 600; color: #262626; }
.room-type .icon { font-size: 18px; }
.status-tag {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.card-body { padding: 14px 16px; flex: 1; display: flex; flex-direction: column; gap: 14px; }
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 14px;
  padding: 10px 12px;
  background: #fafafa;
  border-radius: 8px;
}
.info-item { display: flex; flex-direction: column; gap: 2px; }
.info-item.full { grid-column: 1 / -1; flex-direction: row; justify-content: space-between; align-items: center; }
.info-item .lbl { font-size: 11px; color: #8c8c8c; }
.info-item .val { font-size: 13px; color: #262626; font-weight: 500; font-family: 'SF Mono', Menlo, monospace; }
.info-item .val.danger { color: #ff4d4f; font-weight: 600; }

.photo-wrap { }
.photo-label {
  font-size: 12px;
  color: #595959;
  margin-bottom: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.photo-time { color: #8c8c8c; font-size: 11px; }
.photo-frame {
  position: relative;
  width: 100%;
  padding-top: 60%;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid #f0f0f0;
}
.photo-frame img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.photo-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  font-size: 13px;
}
.photo-frame:hover .photo-mask { opacity: 1; }

.conclusion-block { padding: 10px 12px; background: #f9f9ff; border-radius: 8px; }
.conclusion-row { display: flex; align-items: center; gap: 8px; }
.con-label { font-size: 12px; color: #666; }
.con-value { font-weight: 600; font-size: 14px; }
.con-pass { color: #52c41a; }
.con-leak { color: #ff4d4f; }
.con-pending { color: #faad14; }
.leak-loc { font-size: 12px; color: #cf1322; margin-top: 6px; }
.remark-text { font-size: 12px; color: #595959; margin-top: 6px; line-height: 1.6; }

.issues-block { display: flex; flex-direction: column; gap: 6px; }
.issue-item {
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.5;
  border-left: 3px solid;
}
.issue-time { background: #fff1f0; border-color: #ff4d4f; color: #cf1322; }
.issue-photo { background: #fff7e6; border-color: #fa8c16; color: #ad4e00; }
.issue-water { background: #fff7e6; border-color: #faad14; color: #ad6800; }

.retest-block {
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 8px;
  padding: 12px;
}
.retest-title {
  font-size: 13px;
  font-weight: 600;
  color: #613400;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.retest-count { font-size: 11px; font-weight: 500; color: #8c6b00; }
.closed-badge {
  margin-left: auto;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  color: #389e0d;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}
.open-badge {
  margin-left: auto;
  background: #fff7e6;
  border: 1px solid #ffd591;
  color: #d46b08;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}
.retest-item {
  background: #fff;
  border: 1px dashed #e8d48a;
  border-radius: 6px;
  padding: 10px;
  margin-top: 8px;
}
.retest-item:first-of-type { margin-top: 0; }
.retest-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.retest-no { font-size: 12px; font-weight: 600; color: #613400; }
.retest-con { font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 10px; }
.retest-con.pass { background: #f6ffed; color: #389e0d; }
.retest-con.leak { background: #fff1f0; color: #cf1322; }
.retest-meta { font-size: 11px; color: #8c8c8c; font-family: monospace; }
.retest-photo { font-size: 11px; color: #1677ff; cursor: pointer; margin-top: 4px; }
.retest-photo .hint { color: #8c8c8c; }
.retest-leak { font-size: 11px; color: #cf1322; margin-top: 4px; }
.retest-remark { font-size: 11px; color: #595959; margin-top: 4px; line-height: 1.5; }

.card-footer {
  padding: 10px 12px;
  border-top: 1px solid #f5f5f5;
  display: flex;
  gap: 8px;
  background: #fafafa;
}
.btn-sm { flex: 1; font-size: 12px; padding: 6px 8px; }
</style>
