<template>
  <div class="dashboard-panel">
    <div class="stat-cards">
      <StatCard label="总记录数" :value="stats.total" icon="📋" color="#1677ff" />
      <StatCard label="正常通过" :value="stats.normal" icon="✅" color="#52c41a" />
      <StatCard label="待复测" :value="stats.pending" icon="⏳" color="#faad14" />
      <StatCard label="时间异常" :value="stats.abnormal" icon="⚠️" color="#ff4d4f" />
      <StatCard label="水位不足" :value="stats.warning" icon="💧" color="#fa8c16" />
      <StatCard label="未完成" :value="stats.incomplete" icon="📝" color="#8c8c8c" />
    </div>

    <div class="charts-grid">
      <div class="chart-box">
        <h4 class="chart-title">楼栋分布</h4>
        <div ref="buildingChartRef" class="chart-area"></div>
      </div>
      <div class="chart-box">
        <h4 class="chart-title">状态占比</h4>
        <div ref="statusChartRef" class="chart-area"></div>
      </div>
      <div class="chart-box wide">
        <h4 class="chart-title">房间类型分布</h4>
        <div ref="roomTypeChartRef" class="chart-area"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import { useWaterproofStore } from '../stores/waterproof.js'
import StatCard from './StatCard.vue'

const { statistics, state } = useWaterproofStore()
const stats = computed(() => statistics.value.statusCounts)

const buildingChartRef = ref(null)
const statusChartRef = ref(null)
const roomTypeChartRef = ref(null)
let buildingChart, statusChart, roomTypeChart

function buildPie(data, colors) {
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, type: 'scroll', textStyle: { fontSize: 11 } },
    color: colors,
    series: [{
      type: 'pie',
      radius: ['45%', '68%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{c}条', fontSize: 11 },
      data: Object.entries(data).map(([name, value]) => ({ name, value }))
    }]
  }
}

function buildBar(data) {
  const entries = Object.entries(data)
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 40, right: 20, top: 20, bottom: 40 },
    xAxis: {
      type: 'category',
      data: entries.map(e => e[0]),
      axisLabel: { fontSize: 11, interval: 0, rotate: entries.length > 6 ? 20 : 0 }
    },
    yAxis: { type: 'value', minInterval: 1, axisLabel: { fontSize: 11 } },
    series: [{
      type: 'bar',
      data: entries.map((e, i) => ({
        value: e[1],
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: ['#1677ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2', '#eb2f96'][i % 7]
        }
      })),
      barMaxWidth: 40,
      label: { show: true, position: 'top', fontSize: 11, fontWeight: 600 }
    }]
  }
}

function renderCharts() {
  if (!buildingChartRef.value || !statusChartRef.value || !roomTypeChartRef.value) return
  if (buildingChart) buildingChart.dispose()
  if (statusChart) statusChart.dispose()
  if (roomTypeChart) roomTypeChart.dispose()

  buildingChart = echarts.init(buildingChartRef.value)
  buildingChart.setOption(buildBar(statistics.value.buildingStats))

  const s = statistics.value.statusCounts
  const statusData = {
    '正常通过': s.normal,
    '待复测': s.pending,
    '时间异常': s.abnormal,
    '水位不足': s.warning,
    '未完成': s.incomplete
  }
  statusChart = echarts.init(statusChartRef.value)
  statusChart.setOption(buildPie(statusData, ['#52c41a', '#faad14', '#ff4d4f', '#fa8c16', '#8c8c8c']))

  roomTypeChart = echarts.init(roomTypeChartRef.value)
  roomTypeChart.setOption(buildBar(statistics.value.roomTypeStats))
}

function resizeHandler() {
  buildingChart?.resize()
  statusChart?.resize()
  roomTypeChart?.resize()
}

onMounted(async () => {
  await nextTick()
  renderCharts()
  window.addEventListener('resize', resizeHandler)
})

watch(() => state.records, async () => {
  await nextTick()
  renderCharts()
}, { deep: true })

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeHandler)
  buildingChart?.dispose()
  statusChart?.dispose()
  roomTypeChart?.dispose()
})
</script>


<style scoped>
.dashboard-panel { }
.stat-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}
.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.chart-box {
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.chart-box.wide { grid-column: 1 / -1; }
.chart-title { margin: 0 0 10px; font-size: 14px; font-weight: 600; color: #262626; }
.chart-area { width: 100%; height: 260px; }
</style>
