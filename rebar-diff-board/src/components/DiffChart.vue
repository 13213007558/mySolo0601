<template>
  <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
    <h3 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
      <BarChart3 class="w-5 h-5 text-rebar-blue" />
      差异统计概览
    </h3>
    <div class="grid grid-cols-5 gap-3 mb-4">
      <div class="text-center p-3 bg-gray-50 rounded-lg">
        <div class="text-2xl font-bold text-gray-900">{{ stats.total }}</div>
        <div class="text-xs text-gray-500">总条目</div>
      </div>
      <div class="text-center p-3 bg-red-50 rounded-lg">
        <div class="text-2xl font-bold text-red-600">{{ stats.shortage }}</div>
        <div class="text-xs text-gray-500">少料</div>
      </div>
      <div class="text-center p-3 bg-green-50 rounded-lg">
        <div class="text-2xl font-bold text-green-600">{{ stats.surplus }}</div>
        <div class="text-xs text-gray-500">多料</div>
      </div>
      <div class="text-center p-3 bg-gray-100 rounded-lg">
        <div class="text-2xl font-bold text-gray-600">{{ stats.matched }}</div>
        <div class="text-xs text-gray-500">一致</div>
      </div>
      <div class="text-center p-3 bg-yellow-50 rounded-lg">
        <div class="text-2xl font-bold text-yellow-600">{{ stats.pending }}</div>
        <div class="text-xs text-gray-500">待确认</div>
      </div>
    </div>
    <div ref="chartRef" class="w-full h-64"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { BarChart3 } from 'lucide-vue-next'

const props = defineProps<{
  stats: { total: number; shortage: number; surplus: number; matched: number; pending: number; bad: number }
  diameterGroups: { diameter: number; shortage: number; surplus: number; matched: number }[]
}>()

const emit = defineEmits<{
  'click-diameter': [diameter: number]
}>()

const chartRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null

function renderChart() {
  if (!chartRef.value) return
  if (!chart) {
    chart = echarts.init(chartRef.value)
    chart.on('click', (params: any) => {
      if (params.name && typeof params.name === 'string') {
        const diam = parseFloat(params.name)
        if (!isNaN(diam)) {
          emit('click-diameter', diam)
        }
      }
    })
  }

  const diameters = props.diameterGroups.map((g) => `Φ${g.diameter}`)

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['少料', '多料', '一致'],
      top: 0,
      textStyle: { fontSize: 12 }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: diameters,
      axisLabel: { fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 11 }
    },
    series: [
      {
        name: '少料',
        type: 'bar',
        stack: 'total',
        itemStyle: { color: '#DC2626' },
        data: props.diameterGroups.map((g) => -g.shortage)
      },
      {
        name: '多料',
        type: 'bar',
        stack: 'total',
        itemStyle: { color: '#059669' },
        data: props.diameterGroups.map((g) => g.surplus)
      },
      {
        name: '一致',
        type: 'bar',
        stack: 'total',
        itemStyle: { color: '#9CA3AF' },
        data: props.diameterGroups.map((g) => g.matched)
      }
    ]
  }

  chart.setOption(option, true)
}

onMounted(() => {
  nextTick(() => {
    renderChart()
    window.addEventListener('resize', () => chart?.resize())
  })
})

watch(() => props.diameterGroups, () => {
  nextTick(renderChart)
}, { deep: true })
</script>
