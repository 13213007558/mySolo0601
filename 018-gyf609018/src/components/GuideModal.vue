<template>
  <ModalFrame :visible="state.ui.showGuide" title="📘 防水闭水试验记录墙 - 使用说明" wide @close="closeGuide">
    <div class="guide-content">
      <div class="quick-actions">
      <button class="btn btn-primary" @click="onLoadSample">📥 一键加载样例数据（演示用）</button>
      <button class="btn btn-danger" @click="onReset">🗑 清空所有数据</button>
      <button class="btn btn-ghost" @click="closeGuide">关闭说明</button>
    </div>

    <div v-for="block in instructions" :key="block.title" class="guide-block">
      <h3 class="guide-title">{{ block.title }}</h3>
      <div v-for="s in block.sections" :key="s.heading" class="guide-section">
        <h4 class="section-heading">{{ s.heading }}</h4>
        <ul class="section-items">
          <li v-for="(it, i) in s.items" :key="i">{{ it }}</li>
        </ul>
      </div>
    </div>

    <div class="guide-block three-cols">
      <h3 class="guide-title">🎯 三种测试反馈样例</h3>
      <div class="feedback-row">
        <div class="feedback-card empty">
          <div class="fb-icon">📭</div>
          <h4>空态（无数据）</h4>
          <p>无记录时，首页显示引导卡片。点击「新增记录」或一键加载样例即可开始。</p>
        </div>
        <div class="feedback-card normal">
          <div class="fb-icon">✅</div>
          <h4>正常记录</h4>
          <p>时间≥24h、水位≥2cm、照片合规、结论通过。</p>
        </div>
        <div class="feedback-card abnormal">
          <div class="fb-icon">🔴</div>
          <h4>异常记录</h4>
          <p>蓄水不足、照片时间违规、渗漏未复测通过等情况会被标记并高亮。</p>
        </div>
      </div>
    </div>
    </div>
  </ModalFrame>
</template>

<script setup>
import { computed } from 'vue'
import { useWaterproofStore } from '../stores/waterproof.js'
import { getSampleInstructions } from '../utils/mockData.js'
import ModalFrame from './ModalFrame.vue'

const { state, closeGuide, loadSampleData, resetAllData } = useWaterproofStore()
const instructions = computed(() => getSampleInstructions())

function onLoadSample() {
  if (confirm('加载样例数据将覆盖现有记录，是否继续？')) {
    loadSampleData()
    closeGuide()
  }
}
function onReset() {
  if (confirm('确定要清空所有本地数据吗？此操作不可恢复！')) {
    resetAllData()
    closeGuide()
  }
}
</script>

<style scoped>
.guide-content { }
.quick-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 24px;
  padding: 14px;
  background: #e6f4ff;
  border: 1px solid #91caff;
  border-radius: 10px;
}
.guide-block { margin-bottom: 26px; padding-bottom: 20px; border-bottom: 1px dashed #f0f0f0; }
.guide-block:last-child { border-bottom: none; }
.guide-title {
  margin: 0 0 14px;
  font-size: 16px;
  font-weight: 600;
  color: #1677ff;
  padding-left: 10px;
  border-left: 4px solid #1677ff;
}
.guide-section { margin-bottom: 14px; }
.section-heading {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: #262626;
}
.section-items {
  margin: 0;
  padding-left: 20px;
  line-height: 2;
  font-size: 13px;
  color: #595959;
}
.section-items li { margin-bottom: 2px; }

.three-cols { }
.feedback-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
.feedback-card {
  background: #fff;
  border: 2px solid;
  border-radius: 10px;
  padding: 18px;
  text-align: center;
  transition: all 0.2s;
}
.feedback-card:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.08); }
.feedback-card.empty { border-color: #d9d9d9; background: #fafafa; }
.feedback-card.normal { border-color: #b7eb8f; background: #f6ffed; }
.feedback-card.abnormal { border-color: #ffa39e; background: #fff1f0; }
.fb-icon { font-size: 40px; margin-bottom: 10px; }
.feedback-card h4 { margin: 0 0 8px; font-size: 15px; font-weight: 600; }
.feedback-card p { margin: 0; font-size: 12px; color: #595959; line-height: 1.7; }
.feedback-card.empty h4 { color: #8c8c8c; }
.feedback-card.normal h4 { color: #389e0d; }
.feedback-card.abnormal h4 { color: #cf1322; }
</style>
